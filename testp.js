/**
 * ShopIQ – main application logic
 * Uses SerpAPI Google Shopping for live price data.
 *
 * ⚠️  SECURITY NOTE: The API key below is visible to anyone who opens
 *     DevTools → Network. Fine for personal/demo use. For a public site,
 *     proxy the SerpAPI call through a tiny serverless function (e.g.
 *     Vercel Edge Function) so the key stays server-side.
 */

// ── CONFIG ─────────────────────────────────────────────────────────────────
// Point this to your Cloudflare Worker proxy URL.
// The worker injects the SerpAPI key server-side — no key needed here.
const PROXY_URL = 'https://pricecompare.lchethas.workers.dev'; // ← replace with your worker URL

// Only results from these stores will be shown
const STORES = [
  {
    key: 'amazon',
    sourcePattern: /amazon/i,
    linkPattern: /amazon\.in/i,
    label: 'Amazon',
    cls: 'store-link-amazon',
    barColor: '#f97316',
    logo: 'https://static.vecteezy.com/system/resources/previews/019/136/322/original/amazon-logo-amazon-icon-free-free-vector.jpg',
  },
  {
    key: 'flipkart',
    sourcePattern: /flipkart/i,
    linkPattern: /flipkart\.com/i,
    label: 'Flipkart',
    cls: 'store-link-flipkart',
    barColor: '#1d4ed8',
    logo: 'https://tse2.mm.bing.net/th/id/OIP.OQrbMsmN86RrB-hXq7AfSQHaHY?rs=1&pid=ImgDetMain&o=7&rm=3',
  },
  {
    key: 'croma',
    sourcePattern: /croma/i,
    linkPattern: /croma\.com/i,
    label: 'Croma',
    cls: 'store-link-croma',
    barColor: '#0f766e',
    logo: 'https://brandlogovector.com/wp-content/uploads/2021/11/Croma-Logo-300x100.png',
  },
  {
    key: 'reliance',
    sourcePattern: /reliance/i,
    linkPattern: /reliancedigital\.in/i,
    label: 'Reliance Digital',
    cls: 'store-link-reliance',
    barColor: '#dc2626',
    logo: 'https://www.shopickr.com/wp-content/uploads/2018/07/reliance-digital.png?v=200',
  },
  {
    key: 'tatacliq',
    sourcePattern: /tata\s*cliq/i,
    linkPattern: /tatacliq\.com/i,
    label: 'Tata CLiQ',
    cls: 'store-link-tatacliq',
    barColor: '#7c3aed',
    logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/5d/Tata_Cliq_Logo.png/250px-Tata_Cliq_Logo.png',
  },
];

// ── State ──────────────────────────────────────────────────────────────────
let currentResults = [];   // all filtered results (sorted)
let bestPerStore = {};   // cheapest item per store key
let searchDebounce = null;
let rawSerpResults = []; // cache raw search results for local filtering

// ── DOM refs ───────────────────────────────────────────────────────────────
const splashEl = document.getElementById('splashScreen');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const sortMode = document.getElementById('sortMode');
const clearSearch = document.getElementById('clearSearch');
const storeCheckboxes = document.querySelectorAll('#storeFilters input[type="checkbox"]');
const resultsList = document.getElementById('resultsList');
const graphCard = document.getElementById('graphCard');
const priceChart = document.getElementById('priceChart');
const storeLinks = document.getElementById('storeLinks');

// ── Splash ─────────────────────────────────────────────────────────────────
function hideSplash() { splashEl.classList.add('hidden'); }

// ── Helpers ────────────────────────────────────────────────────────────────
function openInNewTab(url) {
  if (!url) return;
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) w.opener = null;
}

function fmt(price) {
  return '₹' + Number(price).toLocaleString('en-IN');
}

function matchStore(item) {
  const src = item.source || '';
  const link = item.link || '';
  return STORES.find(s =>
    s.sourcePattern.test(src) || s.linkPattern.test(link)
  ) ?? null;
}

function sortItems(items, mode) {
  const arr = [...items];
  if (mode === 'expensive') return arr.sort((a, b) => b.price - a.price);
  return arr.sort((a, b) => a.price - b.price);   // default: cheapest first
}

// ── UI state helpers ───────────────────────────────────────────────────────
function showLoading(msg = 'Searching prices across stores…') {
  if (resultsList) {
    resultsList.innerHTML = `
      <div class="loading-indicator">
        <div class="spin"></div>
        <span>${msg}</span>
      </div>`;
  }
  if (graphCard) graphCard.style.display = 'none';
  const specsCard = document.getElementById('specsCard');
  if (specsCard) specsCard.style.display = 'none';
}

function showError(msg) {
  if (resultsList) {
    resultsList.innerHTML = `<div class="error-state">⚠️ ${msg}</div>`;
  }
  if (graphCard) graphCard.style.display = 'none';
}

function showEmpty(msg = 'Type a product name to compare prices across Amazon, Flipkart, Croma & Reliance Digital.') {
  if (resultsList) {
    resultsList.innerHTML = `
      <div style="padding:2rem;text-align:center;color:#64748b;font-size:.95rem;line-height:1.6;">
        <div style="font-size:2rem;margin-bottom:.5rem;">🔍</div>
        ${msg}
      </div>`;
  }
  if (graphCard) graphCard.style.display = 'none';
  const specsCard = document.getElementById('specsCard');
  if (specsCard) specsCard.style.display = 'none';
  const storeFilters = document.getElementById('storeFilters');
  if (storeFilters) storeFilters.style.display = 'none';
}

// ── SerpAPI call ───────────────────────────────────────────────────────────
async function fetchPrices(rawQuery) {
  if (!rawQuery || rawQuery.length < 2) { showEmpty(); return; }

  showLoading();

  // Load static data instead of SerpAPI for demo
  const res = await fetch('data.json');
  if (!res.ok) {
    showError('Failed to load data.json');
    return;
  }
  const data = await res.json();

  const category = categoryFilter.value;
  const products = data[category === 'mobiles' ? 'mobiles' : category === 'laptops' ? 'laptops' : 'mobiles'];

  // Filter products based on search query
  const searchTerms = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const filteredProducts = products.filter(product => {
    const brandLower = product.brand.toLowerCase();
    return searchTerms.some(term => brandLower.includes(term));
  });

  if (filteredProducts.length === 0) {
    showEmpty(`No products found matching "${rawQuery}". Try searching for iPhone, Samsung, OnePlus, etc.`);
    return;
  }

  const shopping_results = [];
  filteredProducts.forEach(product => {
    STORES.forEach(store => {
      const urlKey = store.key + 'Url';
      if (product[urlKey] && product[store.key]) {
        shopping_results.push({
          title: product.brand,
          link: product[urlKey],
          extracted_price: product[store.key],
          price: '₹' + product[store.key].toLocaleString('en-IN'),
          source: store.label,
          thumbnail: product.specs?.image || '',
          delivery: 'Free delivery',
          rating: 4.5,
          reviews: 100,
        });
      }
    });
  });

  processAndRender(shopping_results);
}

// ── Process results ────────────────────────────────────────────────────────
function processAndRender(raw) {
  rawSerpResults = raw; // save raw results to avoid network call when filtering stores

  const activeStores = Array.from(storeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  // Map → filter → sort
  const mapped = raw.map(item => {
    const store = matchStore(item);
    if (!store || !item.extracted_price) return null;
    if (!activeStores.includes(store.key)) return null;

    return {
      title: item.title,
      price: item.extracted_price,
      priceStr: item.price || fmt(item.extracted_price),
      thumbnail: item.thumbnail || '',
      link: item.link || '#',
      source: item.source || '',
      delivery: item.delivery || '',
      rating: item.rating || null,
      reviews: item.reviews || null,
      store,
    };
  }).filter(Boolean);

  if (mapped.length === 0) {
    showEmpty('No results found from the tracked stores.<br>Try a more specific product name.');
    return;
  }

  currentResults = sortItems(mapped, sortMode.value);

  // Best per store (cheapest)
  bestPerStore = {};
  currentResults.forEach(item => {
    if (!bestPerStore[item.store.key] || item.price < bestPerStore[item.store.key].price) {
      bestPerStore[item.store.key] = item;
    }
  });

  const storeFiltersEl = document.getElementById('storeFilters');
  if (storeFiltersEl) {
    storeFiltersEl.style.display = 'flex';
  }

  renderCards(currentResults);
  renderChart();
}

// ── Product cards ──────────────────────────────────────────────────────────
function renderCards(items) {
  if (!resultsList) {
    console.warn('Results list element not found');
    return;
  }
  
  const bestLinks = new Set(Object.values(bestPerStore).map(i => i.link));

  let html = `
    <div class="stack" style="margin-bottom:.75rem;">
      <span class="pill">Results: ${items.length}</span>
      <span class="pill">Filtered to tracked stores · sorted by price</span>
    </div>
    <div class="results-grid">`;

  items.forEach((item, idx) => {
    const isBest = bestLinks.has(item.link);

    html += `
      <div class="product-card${isBest ? ' best-deal-card' : ''}" data-index="${idx}">
        ${isBest ? `<div class="best-deal-badge">🏆 Cheapest on ${item.store.label}</div>` : ''}
        <img class="product-thumb"
             src="${item.thumbnail}"
             onerror="this.src='https://placehold.co/120x120/f1f5f9/94a3b8?text=No+Image'"
             alt="${item.title}" loading="lazy" />
        <div class="product-card-body">
          <span class="store-badge" style="--sc:${item.store.barColor};">${item.store.label}</span>
          <div class="product-card-title">${item.title}</div>
          <div class="product-card-price">${item.priceStr}</div>
          ${item.delivery ? `<div class="product-card-delivery">${item.delivery}</div>` : ''}
          ${item.rating ? `<div class="product-card-rating">⭐ ${item.rating}${item.reviews ? ` (${item.reviews})` : ''}</div>` : ''}
          <a class="view-deal-btn" href="${item.link}" target="_blank" rel="noopener noreferrer">View Deal →</a>
        </div>
      </div>`;
  });

  html += '</div>';
  resultsList.innerHTML = html;

  // Click card → compare page
  resultsList.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.view-deal-btn')) return;
      showComparePage(currentResults[Number(card.dataset.index)]);
    });
  });

  // Handle view deal button clicks
  resultsList.querySelectorAll('.view-deal-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const link = btn.getAttribute('href');
      const w = window.open(link, '_blank');
      if (!w) {
        alert('Popup blocked. Please allow popups for this site to view the deal.');
      }
    });
  });
}

// ── Comparison bar chart (best per store) ──────────────────────────────────
function renderChart() {
  if (!graphCard || !priceChart || !storeLinks) {
    console.warn('Chart elements not found in DOM');
    return;
  }
  
  const stores = Object.values(bestPerStore).sort((a, b) => a.price - b.price);
  if (stores.length < 1) { graphCard.style.display = 'none'; return; }

  const minP = stores[0].price;
  const maxP = stores[stores.length - 1].price;
  const scale = v => 30 + ((v - minP) / Math.max(1, maxP - minP)) * 60;

  let chartHtml = `
    <div style="margin-bottom:.6rem;font-size:.9rem;font-weight:700;color:#111827;">
      Best price per store — lowest ${fmt(minP)}
    </div>`;

  stores.forEach(item => {
    const w = Math.max(30, scale(item.price));
    const isBest = item.price === minP;
    chartHtml += `
      <div class="chart-bar">
        <div class="bar" style="width:${w}%;background:linear-gradient(90deg,${item.store.barColor},${item.store.barColor}bb);color:#fff;">
          ${fmt(item.price)}
        </div>
        <span class="label">${item.store.label}${isBest ? ' ✓' : ''}</span>
      </div>`;
  });

  priceChart.innerHTML = chartHtml;
  graphCard.style.display = 'block';

  // Store link buttons beneath chart
  let linksHtml = '<span class="store-links-area-title">Go to store:</span>';
  stores.forEach(item => {
    linksHtml += `
      <a class="store-link-btn ${item.store.cls}" href="${item.link}" target="_blank" rel="noopener noreferrer">
        <img src="${item.store.logo}" alt="${item.store.label}" />
        <span>${item.store.label} &mdash; ${fmt(item.price)}</span>
      </a>`;
  });
  storeLinks.innerHTML = linksHtml;
  storeLinks.style.display = 'flex';
}

// ── Compare page ───────────────────────────────────────────────────────────
function showComparePage(item) {
  document.getElementById('searchPage').style.display = 'none';
  document.getElementById('comparePage').style.display = 'block';

  document.getElementById('compareTitle').textContent = item.title;
  document.getElementById('compareSummary').textContent =
    `Best price: ${item.priceStr} on ${item.store.label}`;

  // ── Product details
  const detBox = document.getElementById('productDetailsCompare');
  detBox.innerHTML = `
    <div style="display:flex;gap:1.2rem;align-items:flex-start;flex-wrap:wrap;">
      <img src="${item.thumbnail}"
           onerror="this.src='https://placehold.co/220x180/f1f5f9/94a3b8?text=No+Image';"
           style="width:220px;height:180px;object-fit:contain;border-radius:14px;background:#f8fafc;padding:.5rem;" />
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;color:#111827;font-size:1rem;margin-bottom:.4rem;">${item.title}</div>
        <div style="font-size:1.8rem;font-weight:900;color:#1d4ed8;margin-bottom:.4rem;">${item.priceStr}</div>
        <span style="display:inline-block;padding:.2rem .7rem;border-radius:999px;font-size:.8rem;font-weight:700;
                     border:1px solid ${item.store.barColor};color:${item.store.barColor};background:${item.store.barColor}15;">
          ${item.store.label}
        </span>
        ${item.delivery ? `<div style="color:#475569;font-size:.85rem;margin-top:.5rem;">${item.delivery}</div>` : ''}
        ${item.rating ? `<div style="color:#475569;font-size:.85rem;margin-top:.3rem;">⭐ ${item.rating}${item.reviews ? ` (${item.reviews} reviews)` : ''}</div>` : ''}
      </div>
    </div>`;

  // ── Price chart on compare page
  const stores = Object.values(bestPerStore).sort((a, b) => a.price - b.price);
  const minP = stores[0]?.price ?? 0;
  const maxP = stores[stores.length - 1]?.price ?? 1;
  const scale = v => 30 + ((v - minP) / Math.max(1, maxP - minP)) * 60;

  let cHtml = `
    <div style="margin-bottom:.6rem;font-size:.9rem;font-weight:700;color:#111827;">
      Best price from each store
    </div>`;

  stores.forEach(s => {
    const w = Math.max(30, scale(s.price));
    const isBest = s.price === minP;
    cHtml += `
      <div class="chart-bar">
        <div class="bar" style="width:${w}%;background:linear-gradient(90deg,${s.store.barColor},${s.store.barColor}bb);color:#fff;">
          ${fmt(s.price)}
        </div>
        <span class="label">${s.store.label}${isBest ? ' ✓ Best' : ''}</span>
      </div>`;
  });

  document.getElementById('priceChartCompare').innerHTML = cHtml;

  // Store link buttons on compare page
  const slc = document.getElementById('storeLinksCompare');
  let slcHtml = '<span class="store-links-area-title">View on store:</span>';
  stores.forEach(s => {
    slcHtml += `
      <a class="store-link-btn ${s.store.cls}" href="${s.link}" target="_blank" rel="noopener noreferrer">
        <img src="${s.store.logo}" alt="${s.store.label}" />
        <span>${s.store.label} &mdash; ${fmt(s.price)}</span>
      </a>`;
  });
  slc.innerHTML = slcHtml;
  slc.style.display = 'flex';
}

// Back button with safety check
const backButton = document.getElementById('backButton');
if (backButton) {
  backButton.addEventListener('click', () => {
    const comparePage = document.getElementById('comparePage');
    const searchPage = document.getElementById('searchPage');
    if (comparePage) comparePage.style.display = 'none';
    if (searchPage) searchPage.style.display = 'block';
  });
}

// ── Event listeners ────────────────────────────────────────────────────────
async function triggerSearch() {
  const q = searchInput.value.trim();
  if (!q) { showEmpty(); return; }

  // Detect if input is a URL
  try {
    const urlObj = new URL(q);
    if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
      showLoading('Parsing link to find product...');
      
      const extRes = await fetch(`${PROXY_URL}/extract?url=${encodeURIComponent(q)}`);
      if (extRes.ok) {
        const data = await extRes.json();
        let title = data.title;
        if (title) {
          // Clean typical store suffixes from titles
          title = title.split('|')[0]   // e.g. "Product | Amazon"
                       .split(':')[0]   // e.g. "Product : Flipkart"
                       .split('-')[0]   // e.g. "Product - Buy Online"
                       .replace(/buy/i, '')
                       .replace(/online/i, '')
                       .trim();
          
          searchInput.value = title;
          fetchPrices(title);
          return;
        }
      }
    }
  } catch (e) {
    // Not a valid URL, continue to normal search
  }

  fetchPrices(q);
}

// Event listeners with safety checks
if (searchBtn) {
  searchBtn.addEventListener('click', triggerSearch);
}

if (searchInput) {
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') triggerSearch();
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener('change', () => {
    const q = searchInput.value.trim();
    if (q) fetchPrices(q);
  });
}

if (sortMode) {
  sortMode.addEventListener('change', () => {
    if (!currentResults.length) return;
    renderCards(sortItems(currentResults, sortMode.value));
  });
}

if (clearSearch) {
  clearSearch.addEventListener('click', () => {
    searchInput.value = '';
    categoryFilter.value = 'all';
    sortMode.value = 'none';
    currentResults = [];
    rawSerpResults = [];
    bestPerStore = {};
    showEmpty();
  });
}

if (storeCheckboxes && storeCheckboxes.length > 0) {
  storeCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      if (rawSerpResults.length > 0) {
        processAndRender(rawSerpResults);
      }
    });
  });
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
function initializeApp() {
  setTimeout(() => {
    hideSplash();
    showEmpty();
  }, 1200);
}

// Ensure DOM is loaded before running
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
