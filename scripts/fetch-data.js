import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ============================================
// NEWS SOURCES CONFIG
// ============================================
const NEWS_SOURCES = [
  {
    category: 'guardian-world',
    name: 'Guardian 國際',
    url: 'https://www.theguardian.com/world/rss',
    lang: 'en'
  },
  {
    category: 'cnn-world',
    name: 'CNN 國際',
    url: 'http://rss.cnn.com/rss/edition.rss',
    lang: 'en'
  },
  {
    category: 'bbc-chinese',
    name: 'BBC 中文',
    url: 'https://feeds.bbci.co.uk/zhongwen/trad/rss.xml',
    lang: 'zh'
  }
];

// ============================================
// HOROSCOPE CONFIG
// ============================================
const HOROSCOPE_API_BASE = 'https://horoscope-app-api.vercel.app/api/v1/get-horoscope/daily';

const HOROSCOPE_TEMPLATES = [
  { sign: '白羊座', signEn: 'Aries', emoji: '♈', element: '火', trait: '衝動熱情' },
  { sign: '金牛座', signEn: 'Taurus', emoji: '♉', element: '土', trait: '穩重務實' },
  { sign: '雙子座', signEn: 'Gemini', emoji: '♊', element: '風', trait: '靈活好奇' },
  { sign: '巨蟹座', signEn: 'Cancer', emoji: '♋', element: '水', trait: '敏感體貼' },
  { sign: '獅子座', signEn: 'Leo', emoji: '♌', element: '火', trait: '自信大方' },
  { sign: '處女座', signEn: 'Virgo', emoji: '♍', element: '土', trait: '細心完美' },
  { sign: '天秤座', signEn: 'Libra', emoji: '♎', element: '風', trait: '平衡和諧' },
  { sign: '天蠍座', signEn: 'Scorpio', emoji: '♏', element: '水', trait: '深沉專注' },
  { sign: '射手座', signEn: 'Sagittarius', emoji: '♐', element: '火', trait: '樂觀自由' },
  { sign: '摩羯座', signEn: 'Capricorn', emoji: '♑', element: '土', trait: '堅毅踏實' },
  { sign: '水瓶座', signEn: 'Aquarius', emoji: '♒', element: '風', trait: '創新獨立' },
  { sign: '雙魚座', signEn: 'Pisces', emoji: '♓', element: '水', trait: '浪漫直覺' }
];

const SIGN_API_KEYS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'
];

// ============================================
// XML PARSER CONFIG
// ============================================
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
});

// ============================================
// UTILITY FUNCTIONS
// ============================================
function stripHtml(html) {
  if (!html) return '';
  if (typeof html === 'object') {
    html = html['#text'] || html.content || JSON.stringify(html);
  }
  if (typeof html !== 'string') html = String(html);
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toStr(v) {
  if (!v) return '';
  if (typeof v === 'object') return v['#text'] || '';
  return String(v);
}

// ============================================
// RSS FETCHING
// ============================================
async function fetchSource(source) {
  console.log(`Fetching: ${source.name}...`);
  const response = await fetch(source.url, {
    headers: { 
      'User-Agent': 'Mozilla/5.0 (compatible; CC-News-Hub/1.0; +https://github.com)' 
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const xml = await response.text();
  const parsed = parser.parse(xml);
  return { source: source.name, category: source.category, lang: source.lang, parsed };
}

function extractArticles(sourceName, category, lang, parsed) {
  const articles = [];

  // RSS 2.0 format
  if (parsed.rss?.channel?.item) {
    const items = Array.isArray(parsed.rss.channel.item)
      ? parsed.rss.channel.item
      : [parsed.rss.channel.item];
    
    for (const item of items) {
      articles.push({
        title: toStr(item.title),
        link: toStr(item.link),
        description: stripHtml(item.description || item['content:encoded'] || ''),
        pubDate: toStr(item.pubDate || item['dc:date'] || ''),
        source: sourceName,
        category,
        lang,
      });
    }
  }

  // Atom format
  if (parsed.feed?.entry) {
    const entries = Array.isArray(parsed.feed.entry)
      ? parsed.feed.entry
      : [parsed.feed.entry];
    
    for (const entry of entries) {
      let link = '';
      if (typeof entry.link === 'object') {
        link = entry.link['@_href']
          || (Array.isArray(entry.link) ? entry.link.find(l => l['@_rel'] === 'alternate')?.['@_href'] : '')
          || '';
      }
      
      articles.push({
        title: toStr(entry.title),
        link,
        description: stripHtml(entry.summary || entry.content || ''),
        pubDate: toStr(entry.published || entry.updated || ''),
        source: sourceName,
        category,
        lang,
      });
    }
  }

  return articles;
}

// ============================================
// HOROSCOPE FETCHING & GENERATION
// ============================================
/** 返回 Asia/Shanghai 时区的日期字符串 YYYY-MM-DD */
function getCSTDateStr() {
  const tzFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  return tzFmt.format(new Date());
}

async function fetchAllHoroscopes() {
  const dateStr = getCSTDateStr();
  const results = await Promise.allSettled(
    SIGN_API_KEYS.map(signKey => {
      const url = `${HOROSCOPE_API_BASE}?sign=${signKey}&day=${dateStr}`;
      return fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CC-News-Hub/1.0; +https://github.com)' },
        signal: AbortSignal.timeout(10000),
      }).then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        return { signKey, text: json.data.horoscope };
      });
    })
  );

  const map = {};
  let allOk = true;
  for (const r of results) {
    if (r.status === 'fulfilled') {
      map[r.value.signKey] = r.value.text;
    } else {
      allOk = false;
    }
  }
  return allOk ? map : null;
}

const FORTUNE_TEXTS = {
  overall: [
    '運用你與生俱來的{trait}特質，今日將在關鍵時刻發揮作用。',
    '直覺敏銳的一天，傾聽內心聲音能引領你走向正確方向。',
    '外在環境多變，但只要你保持冷靜，一切盡在掌握之中。',
    '今日適合回顧過去一段時間的成果，你會發現自己的成長比預期更快。',
    '與人交流時展現你的{trait}一面，將讓對方留下深刻印象。',
    '不要害怕改變，今天的你擁有足夠的適應力去迎接新挑戰。',
    '運勢穩中有升，貴人可能以意想不到的方式出現在你身邊。',
    '專注當下的每一件小事，積累起來就是巨大的進步。',
    '今日能量充沛，適合主動出擊，尤其是醞釀已久的計劃。',
    '保持開放心態，接納不同的意見會讓你的視野更加開闊。',
    '你一直以來的堅持即將看到成果，今天就是轉折點。',
    '節奏放慢一些也沒關係，有時停頓是為了跳得更高。',
    '適合整理思緒，把模糊的想法變成具體的行動計劃。',
    '今天容易得到他人的信任與支持，這與你平時的{trait}密不可分。',
    '運勢波動但總體向好，關鍵時刻保持專注就能化險為夷。',
    '新的靈感可能在最不經意的時刻降臨，隨手記錄下來。',
    '今天適合處理長期積累的舊問題，一次解決一個就夠了。',
    '外在世界節奏飛快，但你內心平靜，這就是你最大的優勢。',
    '今日社交運勢佳，你的人格魅力將自然吸引志同道合的人。',
    '面對選擇時，不要只看利弊，也要傾聽自己的熱情所在。',
    '你的{trait}特質今天特別突出，無論工作還是生活都能派上用場。',
    '今天適合制定未來一週的計劃，清晰的方向讓你更有信心。',
    '運勢處於上升通道，大膽表達你的想法，會得到積極回應。',
    '有付出必有回報，今天的努力將為明天奠定堅實基礎。',
    '遇到瓶頸時換個角度思考，你會發現解決方案就在眼前。',
    '今天適合與老朋友聯繫，過去的緣分可能帶來新的機會。',
    '保持自律但不苛求完美，進步比完美更重要。',
    '你的行動力今天特別強，趁熱打鐵完成重要任務。',
    '運勢平穩中帶著驚喜，保持微笑迎接每一個可能性。',
    '用心觀察周圍的變化，機會往往藏在細節之中。'
  ],
  love: [
    '單身者今天在社交場合容易遇到有趣的人，展現{trait}的一面會加分。',
    '伴侶之間需要一點新鮮感，一起嘗試沒做過的事能增進感情。',
    '今天感情運勢波動，給彼此多一點空間反而更好。',
    '你的{trait}特質在感情中特別有魅力，自然地做自己就好。',
    '適合與伴侶進行一次深度對話，把心裡的話說出來。',
    '單身者可能通過共同朋友認識不錯的對象，保持開放態度。',
    '感情中不要過度分析細節，信任是維繫關係的基石。',
    '今天適合製造小驚喜，一份用心的小禮物勝過千言萬語。',
    '桃花運不錯，但你需要在熱情和理性之間找到平衡。',
    '伴侶今天可能需要你的支持，耐心傾聽比給建議更重要。',
    '單身者專注提升自己，對的人會在對的時機出現。',
    '感情穩定發展，偶爾的浪漫舉動能讓關係更加甜蜜。',
    '今天容易因為小事產生誤會，及時溝通就能化解。',
    '你的{trait}個性讓你在感情中與眾不同，別為了迎合而改變。',
    '適合與伴侶一起規劃未來，共同的目標讓關係更緊密。',
    '單身者今天魅力四射，但不要急著投入，先了解對方。',
    '感情需要平衡付出與接受，不要一味犧牲自己。',
    '今天適合表達感謝，讓身邊的人感受到你的心意。',
    '過去的情感經歷讓你成長，今天的你值得更好的關係。',
    '伴侶之間的小爭吵不可怕，關鍵是如何修復與理解。',
    '單身者可以在興趣愛好中遇到同頻的人，多參加活動。',
    '今天感情運勢溫馨，適合與家人或伴侶共度時光。',
    '不要讓工作壓力影響感情，回到家就好好放鬆。',
    '真誠是最好的感情策略，坦率表達你的想法和感受。',
    '今天適合回顧感情中的美好時刻，感恩讓愛更長久。',
    '單身者不要急於脫單，先享受一個人的生活也很好。',
    '伴侶之間的小默契比大驚喜更珍貴，珍惜日常的溫暖。',
    '你的{trait}讓你在感情中獨具魅力，自信就是最好的吸引力。',
    '今天感情運勢平穩，適合與伴侶一起做一頓飯或看場電影。',
    '學會在感情中設立健康的邊界，愛別人也要愛自己。'
  ],
  career: [
    '工作中充分發揮你的{trait}優勢，能讓你在團隊中脫穎而出。',
    '今天的會議或匯報中，清晰的表達將為你贏得認可。',
    '遇到挑戰時不要退縮，這正是展現你能力的機會。',
    '團隊協作順暢，你的貢獻會被看到，適時主動溝通。',
    '適合處理需要耐心的任務，你的{trait}特質讓你能夠勝任。',
    '今天可能出現新的工作機會或項目，仔細評估後再決定。',
    '工作進度比預期順利，把握節奏提前完成目標。',
    '與上級的溝通順暢，適合提出有建設性的建議。',
    '今天適合學習新技能或參加培訓，投資自己永遠值得。',
    '項目推進中可能遇到小阻礙，換個方法就能突破。',
    '你的專業能力今天特別受到肯定，保持謙虛繼續努力。',
    '適合整理工作環境和文件，整潔的空間帶來清晰的思路。',
    '同事之間的合作氣氛良好，團隊凝聚力是今日的亮點。',
    '今天工作效率高，先處理最困難的任務會更有成就感。',
    '職場人際關係和諧，你的{trait}讓大家願意與你合作。',
    '適合制定長期職業規劃，明確的方向讓你更有動力。',
    '今天可能會承擔新的責任，雖然壓力大但也是成長機會。',
    '工作中有機會展示領導力，主動站出來帶領大家前進。',
    '注意細節但不要鑽牛角尖，把握好大方向更重要。',
    '今天適合與不同部門的同事交流，跨界合作能帶來新靈感。',
    '你的努力正在被看見，堅持下去很快就會有回報。',
    '工作中保持靈活性，隨機應變是今天的關鍵能力。',
    '今天適合處理需要創意的任務，你的想像力會帶來驚喜。',
    '不要害怕向資深同事請教，虛心學習能讓你進步更快。',
    '完成一個里程碑後，給自己一些獎勵和休息時間。',
    '今天適合做決策，你的判斷力準確，相信自己的直覺。',
    '工作節奏由你掌控，合理安排時間能事半功倍。',
    '與客戶或合作夥伴的溝通順暢，良好的關係是成功的基礎。',
    '今天可能收到好消息或正面反饋，這是對你付出的肯定。',
    '在專業領域持續深耕，你的{trait}將成為你最大的競爭力。'
  ],
  wealth: [
    '正財收入穩定，今天適合重新檢視個人財務狀況。',
    '偏財運一般，不宜投機，穩健理財才是上策。',
    '今天可能有意外開支，提前做好預算就不會手忙腳亂。',
    '適合研究新的理財工具或投資渠道，但不要急於投入。',
    '你的{trait}特質在消費決策上幫助你保持理性。',
    '財運平穩，今天適合做一個長期的財務規劃。',
    '可能有一筆款項到賬，合理分配比衝動消費更有意義。',
    '今天購物慾望較強，建議先列清單再出門。',
    '適合盤點資產和負債，清楚自己的財務狀況才能更好管理。',
    '投資方面保持觀望，不要被短期波動影響判斷。',
    '今天有可能獲得額外收入，比如兼職或獎金。',
    '省錢不等於降低生活品質，找到性價比高的選擇才是智慧。',
    '財運穩步上升，之前的投入開始顯現回報。',
    '適合學習理財知識，提高財商比追求短期收益更重要。',
    '今天消費時多比較幾家，貨比三家能省下不少錢。',
    '偏財運不錯，但見好就收，不要貪心。',
    '適合與伴侶或家人討論家庭財務規劃，達成共識很重要。',
    '今天可能有請客或社交支出，量力而行就好。',
    '財運趨勢向好，但需要耐心等待，不要急於求成。',
    '適合整理各類帳單和繳費，避免逾期產生不必要的費用。',
    '你的{trait}讓你對金錢有獨到的看法，堅持自己的理財原則。',
    '今天適合開源節流，在增加收入的同時控制不必要的開支。',
    '投資理財忌衝動，冷靜分析後再做決定。',
    '日常節省的小錢累積起來就是大財富，堅持良好的消費習慣。',
    '今天可能有關於財務的好消息，但還是要保持謹慎。',
    '適合更新你的簡歷或技能，提升自己的市場價值也是理財。',
    '財運平穩，做好本職工作就是最好的賺錢方式。',
    '今天避免大額消費，給自己一天冷靜期再決定。',
    '適合與理財顧問或經驗豐富的朋友交流，聽取建議。',
    '你的{trait}讓你在金錢管理上有自己的節奏，堅持下去。'
  ]
};

const LUCKY_COLORS = ['紅色', '藍色', '綠色', '黃色', '紫色', '白色', '黑色', '金色', '粉色', '橙色', '灰色', '棕色', '米色', '青色', '銀色', '珊瑚色'];
const LUCKY_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 16, 18, 21, 23, 27];

function generateHoroscope(apiTexts) {
  // 使用北京时间 (Asia/Shanghai) 计算日期
  const dateStr = getCSTDateStr();
  const [y, m, d] = dateStr.split('-').map(Number);
  const seed = y * 10000 + m * 100 + d;

  const hash = (i, catSeed) => {
    const h = ((seed * 31 + i * 17) * 31 + catSeed * 13) >>> 0;
    return (h % 1000) / 1000;
  };

  const pick = (arr, i, catSeed) => arr[Math.floor(hash(i, catSeed) * arr.length) % arr.length];

  const horoscopes = HOROSCOPE_TEMPLATES.map((tpl, index) => {
    const replaceTrait = (text) => text.replace(/\{trait\}/g, tpl.trait);

    const overall = apiTexts
      ? apiTexts[SIGN_API_KEYS[index]]
      : replaceTrait(pick(FORTUNE_TEXTS.overall, index, 0));

    return {
      sign: tpl.sign,
      signEn: tpl.signEn,
      emoji: tpl.emoji,
      overall,
      luckyNumber: pick(LUCKY_NUMBERS, index, 4),
      luckyColor: pick(LUCKY_COLORS, index, 5),
      love: replaceTrait(pick(FORTUNE_TEXTS.love, index, 1)),
      career: replaceTrait(pick(FORTUNE_TEXTS.career, index, 2)),
      wealth: replaceTrait(pick(FORTUNE_TEXTS.wealth, index, 3))
    };
  });

  return { date: dateStr, horoscopes };
}

// ============================================
// MAIN BUILD FUNCTION
// ============================================
async function build() {
  console.log('🚀 Starting data fetch...\n');

  // Create data directory
  const dataDir = join(rootDir, 'data');
  mkdirSync(dataDir, { recursive: true });

  // Fetch all news sources
  console.log('📰 Fetching news sources...');
  const results = await Promise.allSettled(
    NEWS_SOURCES.map(s => fetchSource(s))
  );

  const allArticles = [];
  const errors = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      const articles = extractArticles(
        NEWS_SOURCES[i].name,
        r.value.category,
        r.value.lang,
        r.value.parsed
      );
      allArticles.push(...articles);
      console.log(`  ✓ ${NEWS_SOURCES[i].name}: ${articles.length} articles`);
    } else {
      errors.push({ 
        source: NEWS_SOURCES[i].name, 
        error: r.reason?.message || 'Unknown error' 
      });
      console.error(`  ✗ ${NEWS_SOURCES[i].name}: FAILED - ${r.reason?.message}`);
    }
  }

  // Sort by date (newest first)
  allArticles.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  // Generate news.json
  const newsData = {
    lastUpdated: new Date().toISOString(),
    totalArticles: allArticles.length,
    sources: NEWS_SOURCES.map(s => s.name),
    errors,
    articles: allArticles
  };

  const newsPath = join(dataDir, 'news.json');
  writeFileSync(newsPath, JSON.stringify(newsData, null, 2));
  console.log(`\n💾 Saved news to ${newsPath}`);

  // Generate horoscope.json (try API first, fall back to algorithm)
  console.log('\n🔮 Fetching horoscope from API...');
  const apiTexts = await fetchAllHoroscopes();
  if (apiTexts) {
    console.log('  ✓ Horoscope API: 12 signs fetched');
  } else {
    console.log('  ⚠ Horoscope API failed, using enhanced algorithm');
  }
  const horoscopeData = generateHoroscope(apiTexts);
  const horoscopePath = join(dataDir, 'horoscope.json');
  writeFileSync(horoscopePath, JSON.stringify(horoscopeData, null, 2));
  console.log(`💾 Saved horoscope to ${horoscopePath}`);

  // Summary
  console.log('\n✅ Build complete!');
  console.log(`   Total articles: ${allArticles.length}`);
  console.log(`   Successful sources: ${NEWS_SOURCES.length - errors.length}/${NEWS_SOURCES.length}`);
  console.log(`   Horoscope signs: ${horoscopeData.horoscopes.length}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  Errors:');
    errors.forEach(e => console.log(`   - ${e.source}: ${e.error}`));
  }
}

// Run build
build().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
