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
// INITIALIZE
// ============================================
document.addEventListener('DOMContentLoaded', loadData);
