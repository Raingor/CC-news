// ============================================
// DATA LOADING
// ============================================
let newsData = null;
let horoscopeData = null;
let currentCategory = 'all';

async function loadData() {
  try {
    const [newsRes, horoscopeRes] = await Promise.all([
      fetch('./data/news.json'),
      fetch('./data/horoscope.json')
    ]);

    if (!newsRes.ok || !horoscopeRes.ok) {
      throw new Error('Data files not found');
    }

    newsData = await newsRes.json();
    horoscopeData = await horoscopeRes.json();

    updateHeader();
    renderNews();
    renderHoroscope();
    setupTabs();
  } catch (error) {
    console.error('Failed to load data:', error);
    showError('載入失敗，請稍後重試');
  }
}

// ============================================
// HEADER UPDATE
// ============================================
function updateHeader() {
  const updateTime = new Date(newsData.lastUpdated);
  const timeStr = updateTime.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  document.getElementById('update-time').textContent = `更新於 ${timeStr}`;
  document.getElementById('article-count').textContent = `共 ${newsData.totalArticles} 則新聞`;
}

// ============================================
// NEWS RENDERING
// ============================================
function renderNews() {
  const grid = document.getElementById('news-grid');
  
  // Filter by category
  let articles = newsData.articles;
  if (currentCategory !== 'all') {
    articles = articles.filter(a => a.category === currentCategory);
  }

  // Limit to 30 articles for performance
  articles = articles.slice(0, 30);

  if (articles.length === 0) {
    grid.innerHTML = '<div class="loading">暫無新聞數據</div>';
    return;
  }

  grid.innerHTML = articles.map((article, index) => {
    const date = article.pubDate ? new Date(article.pubDate) : null;
    const dateStr = date ? formatDate(date) : '未知日期';
    const langLabel = article.lang === 'zh' ? '中文' : 'EN';
    const delay = index * 0.03;

    return `
      <article class="news-card" style="animation-delay: ${delay}s">
        <h3 class="news-title">
          <a href="${article.link}" target="_blank" rel="noopener">${article.title}</a>
        </h3>
        <div class="news-meta">
          <span class="news-source">${article.source}</span>
          <span class="lang-badge">${langLabel}</span>
          <span class="news-date">${dateStr}</span>
        </div>
        <p class="news-description">${article.description}</p>
      </article>
    `;
  }).join('');
}

function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  
  if (hours < 1) return '剛剛';
  if (hours < 24) return `${hours} 小時前`;
  
  return date.toLocaleDateString('zh-TW', {
    month: 'short',
    day: 'numeric'
  });
}

// ============================================
// HOROSCOPE RENDERING
// ============================================
function renderHoroscope() {
  const grid = document.getElementById('horoscope-grid');
  const dateEl = document.getElementById('horoscope-date');
  
  // Format date
  const date = new Date(horoscopeData.date);
  const dateStr = date.toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
  dateEl.textContent = dateStr;

  grid.innerHTML = horoscopeData.horoscopes.map((h, index) => `
    <div class="horoscope-card" data-sign="${h.signEn}" style="animation-delay: ${index * 0.05}s">
      <div class="horoscope-header">
        <span class="horoscope-emoji">${h.emoji}</span>
        <div>
          <div class="horoscope-sign">${h.sign}</div>
          <div class="horoscope-sign-en">${h.signEn}</div>
        </div>
      </div>
      
      <p class="horoscope-overview">${h.overall}</p>
      
      <div class="horoscope-lucky">
        <span class="lucky-item"><strong>幸運數字:</strong> ${h.luckyNumber}</span>
        <span class="lucky-item"><strong>幸運色:</strong> ${h.luckyColor}</span>
      </div>
      
      <div class="horoscope-detail">
        <div class="detail-item">
          <div class="detail-label">愛情運勢</div>
          <div class="detail-text">${h.love}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">事業運勢</div>
          <div class="detail-text">${h.career}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">財富運勢</div>
          <div class="detail-text">${h.wealth}</div>
        </div>
      </div>
      
      <div class="expand-hint"></div>
    </div>
  `).join('');

  // Setup click to expand
  setupHoroscopeCards();
}

function setupHoroscopeCards() {
  const cards = document.querySelectorAll('.horoscope-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('expanded');
    });
  });
}

// ============================================
// TABS SETUP
// ============================================
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Update active state
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Update category and re-render
      currentCategory = tab.dataset.category;
      renderNews();
    });
  });
}

// ============================================
// ERROR HANDLING
// ============================================
function showError(message) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 5000);
}

// ============================================
// SECTION NAVIGATION
// ============================================
let currentSection = 'news';
const sections = ['news', 'horoscope'];
const sectionElements = {
  news: document.getElementById('news-section'),
  horoscope: document.getElementById('horoscope-section')
};

function setupSectionNav() {
  const navLinks = document.querySelectorAll('.section-nav-link');
  const jumpBtn = document.getElementById('scroll-jump');
  const jumpLabel = document.getElementById('jump-label');
  const sectionNav = document.getElementById('section-nav');

  // Smooth scroll on nav link click
  navLinks.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Floating jump button click
  jumpBtn.addEventListener('click', () => {
    if (currentSection === 'news') {
      sectionElements.horoscope.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // IntersectionObserver to track visible section
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id.replace('-section', '');
        setActiveSection(id);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '-80px 0px -40% 0px'
  });

  observer.observe(sectionElements.news);
  observer.observe(sectionElements.horoscope);

  // Scroll handler for sticky nav shadow and jump button visibility
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateNavShadow(sectionNav);
        updateJumpButton(jumpBtn, jumpLabel);
        ticking = false;
      });
      ticking = true;
    }
  });

  // Initial state
  updateNavShadow(sectionNav);
  updateJumpButton(jumpBtn, jumpLabel);
}

function setActiveSection(id) {
  if (currentSection === id) return;
  currentSection = id;

  document.querySelectorAll('.section-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === id);
  });
}

function updateNavShadow(nav) {
  nav.classList.toggle('scrolled', window.scrollY > 60);
}

function updateJumpButton(btn, label) {
  const horoscopeTop = sectionElements.horoscope.offsetTop;
  const scrollY = window.scrollY;
  const viewportH = window.innerHeight;
  const isAtOrPastHoroscope = scrollY + viewportH / 2 >= horoscopeTop;
  const isMobile = window.innerWidth <= 720;
  const showThreshold = isMobile ? 200 : 400;

  if (scrollY > showThreshold) {
    btn.classList.add('visible');
  } else {
    btn.classList.remove('visible');
  }

  btn.classList.toggle('at-horoscope', isAtOrPastHoroscope);
  label.textContent = isAtOrPastHoroscope ? '回到頂部' : '星座運程';
  btn.querySelector('.jump-icon').textContent = isAtOrPastHoroscope ? '↑' : '🔮';
}

// ============================================
// THEME SWITCHER
// ============================================
function setupThemeSwitcher() {
  const btn = document.getElementById('theme-btn');
  const menu = document.getElementById('theme-menu');
  const label = document.getElementById('theme-label');
  const themeNames = {
    default: '預設',
    sakura: '櫻花',
    gothic: '哥特',
    chinese: '中國風'
  };

  // Load saved theme
  const savedTheme = localStorage.getItem('ccnews-theme') || 'default';
  applyTheme(savedTheme);

  // Toggle menu
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    btn.parentElement.classList.toggle('open');
  });

  // Close menu on outside click
  document.addEventListener('click', () => {
    btn.parentElement.classList.remove('open');
  });

  // Theme selection
  menu.querySelectorAll('.theme-option').forEach(opt => {
    opt.addEventListener('click', (e) => {
      e.stopPropagation();
      const theme = opt.dataset.theme;
      applyTheme(theme);
      localStorage.setItem('ccnews-theme', theme);
      btn.parentElement.classList.remove('open');
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  const label = document.getElementById('theme-label');
  const themeNames = {
    default: '預設',
    sakura: '櫻花',
    gothic: '哥特',
    chinese: '中國風'
  };
  if (label) label.textContent = themeNames[theme] || '風格';

  // Update active state in menu
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === theme);
  });
}

// ============================================
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  setupThemeSwitcher();
  setupSectionNav();
  loadData();
});
