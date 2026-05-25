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
    category: 'yahoo-international',
    name: 'Yahoo 國際新聞',
    url: 'https://tw.news.yahoo.com/rss/',
    lang: 'zh'
  },
  {
    category: 'bbc-world',
    name: 'BBC World News',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    lang: 'en'
  },
  {
    category: 'bbc-hongkong',
    name: 'BBC 香港與亞太',
    url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml',
    lang: 'zh'
  }
];

// ============================================
// HOROSCOPE DATA (Fallback template)
// ============================================
const HOROSCOPE_TEMPLATES = [
  { sign: '白羊座', signEn: 'Aries', emoji: '♈' },
  { sign: '金牛座', signEn: 'Taurus', emoji: '♉' },
  { sign: '雙子座', signEn: 'Gemini', emoji: '♊' },
  { sign: '巨蟹座', signEn: 'Cancer', emoji: '♋' },
  { sign: '獅子座', signEn: 'Leo', emoji: '♌' },
  { sign: '處女座', signEn: 'Virgo', emoji: '♍' },
  { sign: '天秤座', signEn: 'Libra', emoji: '♎' },
  { sign: '天蠍座', signEn: 'Scorpio', emoji: '♏' },
  { sign: '射手座', signEn: 'Sagittarius', emoji: '♐' },
  { sign: '摩羯座', signEn: 'Capricorn', emoji: '♑' },
  { sign: '水瓶座', signEn: 'Aquarius', emoji: '♒' },
  { sign: '雙魚座', signEn: 'Pisces', emoji: '♓' }
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
// HOROSCOPE GENERATOR
// ============================================
function generateHoroscope() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  
  const fortuneTypes = [
    { key: 'overall', label: '整體運勢' },
    { key: 'love', label: '愛情運勢' },
    { key: 'career', label: '事業運勢' },
    { key: 'wealth', label: '財富運勢' }
  ];

  const fortuneTexts = {
    overall: [
      '今日運勢平稳上升，适合处理重要事务，保持积极心态会有意想不到的收获。',
      '整体运势良好，人际關係和谐，工作上会有贵人相助，把握机会勇往直前。',
      '运势平稳，适合沉淀思考，不宜冒进。保持耐心，稳扎稳打才能走得更远。',
      '今日充满活力，行动力强，适合开展新计划。注意劳逸结合，避免过度消耗。',
      '运势上升期，各方面都有不错的发展。保持谦逊态度，会得到更多支持。'
    ],
    love: [
      '感情运势佳，单身者有机会结识新朋友，有伴者感情甜蜜，适合深度沟通。',
      '爱情运势平稳，需要多花时间在另一半身上，小惊喜能增进感情。',
      '感情方面较为敏感，注意沟通方式，避免误会。真诚是最好的桥梁。',
      '桃花运旺盛，社交场合容易吸引目光。已有伴侣者需注意边界感。',
      '感情运势上升，适合表达心意。单身者多参与社交活动，机会自来。'
    ],
    career: [
      '工作运势强劲，项目推进顺利，团队协作良好。适合提出新想法。',
      '事业运稳定发展，专注本职工作会有回报。避免分心，集中精力完成目标。',
      '工作上可能遇到小挑战，保持冷静分析问题。求助同事是明智之选。',
      '今日适合学习新技能，提升自我。领导会注意到你的努力和进步。',
      '事业运势上升，有机会展现能力。把握表现机会，但不可过于张扬。'
    ],
    wealth: [
      '财运良好，正财稳定，偏财有小惊喜。理性消费，避免冲动购物。',
      '财富运势平稳，适合理财规划。小额投资可考虑，但需谨慎评估风险。',
      '今日财运一般，注意控制开支。避免借贷，守成为上策。',
      '偏财运佳，可能有意外收入。但不可贪心，见好就收最重要。',
      '财运上升，工作回报丰厚。适合长期投资规划，耐心等待收获。'
    ]
  };

  const luckyColors = ['紅色', '藍色', '綠色', '黃色', '紫色', '白色', '黑色', '金色', '粉色', '橙色', '灰色', '棕色'];
  const luckyNumbers = [1, 2, 3, 5, 7, 8, 9, 11, 13, 16, 18, 21];

  const horoscopes = HOROSCOPE_TEMPLATES.map((template, index) => {
    // 用 date seed + 星座索引 + 类别偏移做多重哈希，确保每个星座每项运程都不同
    const hash = (i, categorySeed) => {
      const h = ((seed * 31 + i * 17) * 31 + categorySeed * 13) >>> 0;
      return (h % 1000) / 1000;
    };
    const pickArray = (arr, i, catSeed) => arr[Math.floor(hash(i, catSeed) * arr.length) % arr.length];
    
    return {
      sign: template.sign,
      signEn: template.signEn,
      emoji: template.emoji,
      overall: pickArray(fortuneTexts.overall, index, 0),
      love: pickArray(fortuneTexts.love, index, 1),
      career: pickArray(fortuneTexts.career, index, 2),
      wealth: pickArray(fortuneTexts.wealth, index, 3),
      luckyNumber: luckyNumbers[Math.floor(hash(index, 4) * luckyNumbers.length) % luckyNumbers.length],
      luckyColor: luckyColors[Math.floor(hash(index, 5) * luckyColors.length) % luckyColors.length]
    };
  });

  return {
    date: dateStr,
    horoscopes
  };
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

  // Generate horoscope.json
  console.log('\n🔮 Generating horoscope data...');
  const horoscopeData = generateHoroscope();
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
