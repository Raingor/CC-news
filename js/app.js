// ============================================
// CC NEWS HUB — READING EXPERIENCE
// ============================================
let newsData = null;
let horoscopeData = null;
let currentCategory = 'all';
let currentLanguage = 'all';
let currentSearch = '';
let visibleLimit = 12;
let currentSection = 'news';

const sectionElements = {
  news: document.getElementById('news-section'),
  horoscope: document.getElementById('horoscope-section')
};

const sourceLabels = {
  'guardian-world': 'Guardian 國際',
  'cnbc-world': 'CNBC 國際',
  'bbc-chinese': 'BBC 中文'
};

const themeNames = {
  default: '預設',
  sakura: '櫻花',
  gothic: '哥特',
  chinese: '中國風'
};

const localizedHoroscopeOverviews = {
  Aries: '今天適合把旺盛的行動力集中在一個目標上，先完成最重要的事，再迎接新的挑戰。',
  Taurus: '放慢一點反而更穩。今天適合整理財務與生活節奏，用踏實的步伐累積成果。',
  Gemini: '交流會帶來靈感。勇敢說出你的想法，也為自己保留一段安靜思考與整理的時間。',
  Cancer: '熟悉的人與事能讓你重新充電。今天適合照顧自己的情緒，也關心身邊重要的人。',
  Leo: '你的存在感自然提升，適合站出來承擔責任；保持真誠，別讓急於證明自己打亂節奏。',
  Virgo: '細節是你的優勢，但不必追求每件事都完美。先完成，再逐步修正，效率會更高。',
  Libra: '今天適合在不同意見中尋找平衡。清楚表達需求，關係與合作都會因此更順暢。',
  Scorpio: '直覺能幫你看見事情的核心。給自己一點獨處空間，再做出重要決定會更踏實。',
  Sagittarius: '新的可能性正在靠近。先處理眼前的責任，再為下一段旅程保留好奇與彈性。',
  Capricorn: '一步一步就能推進長期目標。今天適合排定優先順序，完成一件拖延已久的工作。',
  Aquarius: '新點子值得被記下來，但不必一次完成所有事。選一個方向實驗，成果會比想像更好。',
  Pisces: '敏銳的感受力帶來創意，也需要界線來保護能量。今天適合安靜整理心情與計畫。'
};

async function loadData() {
  try {
    const [newsRes, horoscopeRes] = await Promise.all([
      fetch('./data/news.json'),
      fetch('./data/horoscope.json')
    ]);

    if (!newsRes.ok || !horoscopeRes.ok) throw new Error('Data files not found');

    newsData = await newsRes.json();
    horoscopeData = await horoscopeRes.json();

    updateHeader();
    renderNews();
    renderHoroscope();
    setupNewsControls();
  } catch (error) {
    console.error('Failed to load data:', error);
    showError('載入失敗，請稍後重試');
  }
}

// ============================================
// HEADER & FRESHNESS
// ============================================
function getFreshness(lastUpdated) {
  const updatedAt = new Date(lastUpdated);
  if (Number.isNaN(updatedAt.getTime())) return { type: 'unknown', label: '狀態未知' };

  const hours = Math.max(0, (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60));
  if (hours <= 6) return { type: 'fresh', label: '即時更新' };
  if (hours <= 24) return { type: 'recent', label: '今日更新' };
  if (hours <= 72) return { type: 'delayed', label: '資料延遲' };
  return { type: 'stale', label: '尚未更新' };
}

function updateHeader() {
  const updateTime = new Date(newsData.lastUpdated);
  const freshness = getFreshness(newsData.lastUpdated);
  const timeStr = Number.isNaN(updateTime.getTime())
    ? '時間未知'
    : updateTime.toLocaleString('zh-TW', {
        year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });

  const statusEl = document.getElementById('edition-status');
  statusEl.className = `edition-status ${freshness.type}`;
  statusEl.innerHTML = `<i aria-hidden="true"></i>${freshness.label}`;

  document.getElementById('update-time').textContent = `最後更新 ${timeStr}`;
  document.getElementById('article-count').textContent = `${newsData.totalArticles || 0} 則新聞`;
  document.getElementById('nav-date').textContent = updateTime.toLocaleDateString('en-US', {
    month: 'short', day: '2-digit', year: 'numeric'
  }).toUpperCase();

  if (freshness.type === 'stale' || freshness.type === 'delayed') {
    document.getElementById('filter-note').textContent = '資料可能延遲，仍按最新發布排序';
  }
}

// ============================================
// NEWS FILTERING & RENDERING
// ============================================
function getFilteredArticles() {
  const articles = Array.isArray(newsData?.articles) ? newsData.articles : [];
  const search = currentSearch.trim().toLocaleLowerCase();

  return articles.filter(article => {
    const categoryMatch = currentCategory === 'all' || article.category === currentCategory;
    const languageMatch = currentLanguage === 'all' || article.lang === currentLanguage;
    const searchable = `${article.title || ''} ${article.description || ''} ${article.source || ''}`.toLocaleLowerCase();
    const searchMatch = !search || searchable.includes(search);
    return categoryMatch && languageMatch && searchMatch;
  });
}

function renderNews() {
  const featured = document.getElementById('featured-news');
  const grid = document.getElementById('news-grid');
  const loadMore = document.getElementById('load-more');
  const visibleCount = document.getElementById('visible-count');
  const articles = getFilteredArticles();

  featured.innerHTML = '';
  grid.innerHTML = '';

  if (articles.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-mark" aria-hidden="true">⌕</span>
        <h3>找不到相符的新聞</h3>
        <p>試試其他關鍵字，或清除目前的篩選條件。</p>
        <button class="empty-state-action" type="button" id="reset-filters">清除篩選</button>
      </div>
    `;
    loadMore.hidden = true;
    visibleCount.textContent = '0 則結果';
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
    return;
  }

  const [lead, ...remaining] = articles;
  featured.innerHTML = renderArticle(lead, { featured: true, index: 0 });

  const cardsToRender = remaining.slice(0, visibleLimit - 1);
  grid.innerHTML = cardsToRender.map((article, index) => renderArticle(article, {
    featured: false,
    index: index + 1
  })).join('');

  const renderedCount = Math.min(articles.length, visibleLimit);
  visibleCount.textContent = `顯示 ${renderedCount} / ${articles.length} 則`;
  loadMore.hidden = renderedCount >= articles.length;
  const remainingCount = articles.length - renderedCount;
  loadMore.innerHTML = remainingCount > 0
    ? `載入更多新聞 <span aria-hidden="true">↓</span><small>還有 ${remainingCount} 則</small>`
    : '載入更多新聞 <span aria-hidden="true">↓</span>';
}

function renderArticle(article, { featured = false, index = 0 } = {}) {
  const title = escapeHTML(article.title || '未命名新聞');
  const description = escapeHTML(cleanDescription(article.description || '暫無摘要。'));
  const link = safeURL(article.link);
  const source = escapeHTML(article.source || sourceLabels[article.category] || '新聞來源');
  const langLabel = article.lang === 'zh' ? '中文' : 'EN';
  const date = article.pubDate ? new Date(article.pubDate) : null;
  const dateLabel = date && !Number.isNaN(date.getTime()) ? formatDate(date) : '時間未知';
  const readingTime = estimateReadingTime(`${article.title || ''} ${article.description || ''}`);
  const sourceClass = escapeHTML(article.category || 'unknown');
  const delay = Math.min(index * 0.035, 0.45);

  return `
    <article class="news-card ${featured ? 'news-card--featured' : ''} source-${sourceClass}" style="--card-delay: ${delay}s">
      <div class="news-card-rule" aria-hidden="true"></div>
      <div class="news-card-topline">
        <span class="news-index">${featured ? '01' : String(index + 1).padStart(2, '0')}</span>
        ${featured ? '<span class="lead-label">EDITOR’S PICK</span>' : ''}
      </div>
      <h3 class="news-title">
        <a href="${link}" target="_blank" rel="noopener noreferrer">${title}</a>
      </h3>
      <div class="news-meta">
        <span class="news-source">${source}</span>
        <span class="lang-badge lang-${article.lang === 'zh' ? 'zh' : 'en'}">${langLabel}</span>
        <span class="news-date">${dateLabel}</span>
        <span class="reading-time">${readingTime} 分鐘閱讀</span>
      </div>
      <p class="news-description">${description}</p>
      <a class="article-more" href="${link}" target="_blank" rel="noopener noreferrer">閱讀原文 <span aria-hidden="true">↗</span></a>
    </article>
  `;
}

function cleanDescription(value) {
  return String(value)
    .replace(/Continue reading\.\.\.?/gi, '')
    .replace(/Sign up for[^.]*\.?/gi, '')
    .replace(/Get the Guardian's? newsletter[^.]*\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim() || '暫無摘要。';
}

function estimateReadingTime(text) {
  const normalized = String(text).trim();
  if (!normalized) return 1;
  const chineseChars = (normalized.match(/[\u3400-\u9fff]/g) || []).length;
  const englishWords = normalized.replace(/[\u3400-\u9fff]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil((chineseChars / 420) + (englishWords / 220)));
}

function formatDate(date) {
  const diff = Date.now() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours >= 0 && hours < 1) return '剛剛';
  if (hours >= 1 && hours < 24) return `${hours} 小時前`;
  return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
}

function setupNewsControls() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentCategory = tab.dataset.category;
      visibleLimit = 12;
      document.querySelectorAll('.tab').forEach(item => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      updateFilterNote();
      renderNews();
    });
  });

  document.querySelectorAll('.language-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentLanguage = tab.dataset.language;
      visibleLimit = 12;
      document.querySelectorAll('.language-tab').forEach(item => {
        const active = item === tab;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      updateFilterNote();
      renderNews();
    });
  });

  const search = document.getElementById('news-search');
  const clear = document.getElementById('search-clear');
  search.addEventListener('input', event => {
    currentSearch = event.target.value;
    clear.hidden = !currentSearch;
    visibleLimit = 12;
    updateFilterNote();
    renderNews();
  });
  clear.addEventListener('click', () => {
    search.value = '';
    currentSearch = '';
    clear.hidden = true;
    visibleLimit = 12;
    updateFilterNote();
    renderNews();
    search.focus();
  });

  document.getElementById('load-more').addEventListener('click', () => {
    visibleLimit += 9;
    renderNews();
  });
}

function updateFilterNote() {
  const parts = [];
  if (currentCategory !== 'all') parts.push(sourceLabels[currentCategory] || currentCategory);
  if (currentLanguage !== 'all') parts.push(currentLanguage === 'zh' ? '中文' : 'English');
  if (currentSearch.trim()) parts.push(`搜尋「${currentSearch.trim()}」`);
  document.getElementById('filter-note').textContent = parts.length
    ? `${parts.join(' · ')} · 按最新發布排序`
    : '按最新發布排序';
}

function resetFilters() {
  currentCategory = 'all';
  currentLanguage = 'all';
  currentSearch = '';
  visibleLimit = 12;
  document.getElementById('news-search').value = '';
  document.getElementById('search-clear').hidden = true;
  document.querySelectorAll('.tab, .language-tab').forEach(item => {
    const isActive = item.dataset.category === 'all' || item.dataset.language === 'all';
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-pressed', String(isActive));
  });
  updateFilterNote();
  renderNews();
}

// ============================================
// HOROSCOPE
// ============================================
function renderHoroscope() {
  const grid = document.getElementById('horoscope-grid');
  const date = new Date(horoscopeData.date);
  document.getElementById('horoscope-date').textContent = Number.isNaN(date.getTime())
    ? '日期未知'
    : date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  grid.innerHTML = horoscopeData.horoscopes.map((h, index) => {
    const overall = localizeHoroscopeText(h.overall, h.sign);
    const detailId = `horoscope-detail-${index}`;
    return `
      <article class="horoscope-card" data-sign="${escapeHTML(h.signEn)}" tabindex="0" role="button" aria-expanded="false" aria-controls="${detailId}" style="--card-delay: ${Math.min(index * 0.04, 0.45)}s">
        <div class="horoscope-header">
          <span class="horoscope-emoji" aria-hidden="true">${h.emoji}</span>
          <div>
            <div class="horoscope-sign">${escapeHTML(h.sign)}</div>
            <div class="horoscope-sign-en">${escapeHTML(h.signEn)}</div>
          </div>
          <span class="horoscope-chevron" aria-hidden="true">↘</span>
        </div>
        <p class="horoscope-overview">${escapeHTML(overall)}</p>
        <div class="horoscope-lucky">
          <span class="lucky-item"><strong>幸運數字</strong> ${escapeHTML(h.luckyNumber)}</span>
          <span class="lucky-item"><strong>幸運色</strong> ${escapeHTML(h.luckyColor)}</span>
        </div>
        <div class="horoscope-detail" id="${detailId}" aria-hidden="true">
          <div class="detail-item"><div class="detail-label">愛情運勢</div><div class="detail-text">${escapeHTML(h.love)}</div></div>
          <div class="detail-item"><div class="detail-label">事業運勢</div><div class="detail-text">${escapeHTML(h.career)}</div></div>
          <div class="detail-item"><div class="detail-label">財富運勢</div><div class="detail-text">${escapeHTML(h.wealth)}</div></div>
        </div>
        <div class="expand-hint">查看愛情・事業・財富</div>
      </article>
    `;
  }).join('');

  setupHoroscopeCards();
}

function localizeHoroscopeText(text, sign) {
  const signEn = horoscopeData?.horoscopes?.find(item => item.sign === sign)?.signEn;
  const value = String(text || '').trim();
  const hasCjk = /[\u3400-\u9fff]/.test(value);
  if (hasCjk) return value;
  return localizedHoroscopeOverviews[signEn] || `${sign}今天適合放慢腳步，先整理方向，再開始下一步。`;
}

function setupHoroscopeCards() {
  const cards = document.querySelectorAll('.horoscope-card');
  cards.forEach(card => {
    const toggle = () => {
      const expanded = card.classList.toggle('expanded');
      card.setAttribute('aria-expanded', String(expanded));
      card.querySelector('.horoscope-detail').setAttribute('aria-hidden', String(!expanded));
      card.querySelector('.expand-hint').textContent = expanded
        ? '收起今日完整運勢'
        : '查看愛情・事業・財富';
    };
    card.addEventListener('click', toggle);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggle();
      }
    });
  });
}

// ============================================
// SECTION NAVIGATION
// ============================================
function setupSectionNav() {
  const nav = document.getElementById('section-nav');
  const jumpBtn = document.getElementById('scroll-jump');
  const jumpLabel = document.getElementById('jump-label');

  document.querySelectorAll('.section-nav-link').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  jumpBtn.addEventListener('click', () => {
    const target = currentSection === 'news' ? sectionElements.horoscope : sectionElements.news;
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) setActiveSection(entry.target.id.replace('-section', ''));
    });
  }, { threshold: 0.15, rootMargin: '-80px 0px -40% 0px' });

  observer.observe(sectionElements.news);
  observer.observe(sectionElements.horoscope);

  const update = () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
    const atHoroscope = window.scrollY + window.innerHeight / 2 >= sectionElements.horoscope.offsetTop;
    const show = window.scrollY > (window.innerWidth <= 720 ? 180 : 360);
    jumpBtn.classList.toggle('visible', show);
    jumpBtn.classList.toggle('at-horoscope', atHoroscope);
    jumpLabel.textContent = atHoroscope ? '回到新聞' : '星座運程';
    jumpBtn.setAttribute('aria-label', atHoroscope ? '回到國際焦點' : '跳至星座運程');
    jumpBtn.querySelector('.jump-icon').textContent = atHoroscope ? '↑' : '✧';
  };

  window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });
  window.addEventListener('resize', update);
  update();
}

function setActiveSection(id) {
  if (currentSection === id) return;
  currentSection = id;
  document.querySelectorAll('.section-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === id);
  });
}

// ============================================
// THEME SWITCHER
// ============================================
function setupThemeSwitcher() {
  const switcher = document.querySelector('.theme-switcher');
  const btn = document.getElementById('theme-btn');
  const menu = document.getElementById('theme-menu');
  const savedTheme = localStorage.getItem('ccnews-theme') || 'default';
  applyTheme(savedTheme);

  btn.addEventListener('click', event => {
    event.stopPropagation();
    const open = switcher.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', () => {
    switcher.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  });

  menu.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', event => {
      event.stopPropagation();
      applyTheme(option.dataset.theme);
      localStorage.setItem('ccnews-theme', option.dataset.theme);
      switcher.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    });
  });
}

function applyTheme(theme) {
  const normalized = themeNames[theme] ? theme : 'default';
  document.documentElement.setAttribute('data-theme', normalized);
  const label = document.getElementById('theme-label');
  if (label) label.textContent = themeNames[normalized];
  document.querySelectorAll('.theme-option').forEach(option => {
    option.classList.toggle('active', option.dataset.theme === normalized);
  });
}

// ============================================
// HELPERS & ACCESSIBILITY
// ============================================
function safeURL(value) {
  try {
    const url = new URL(value || '#', window.location.href);
    return ['http:', 'https:'].includes(url.protocol) ? escapeHTML(url.href) : '#';
  } catch {
    return '#';
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[char]));
}

function showError(message) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  setupThemeSwitcher();
  setupSectionNav();
  loadData();
});
