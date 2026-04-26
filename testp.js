/**
 * ShopIQ – main application logic
 */

// ── AUTH CHECK ─────────────────────────────────────────────────────────────
(function () {
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  const isAuthPage = window.location.pathname.includes('login.html') ||
    window.location.pathname.includes('signup.html');

  // Skip auth check for localhost development if needed, or just be very careful
  if (!isLoggedIn && !isAuthPage) {
    console.warn('🔒 User not logged in, redirecting to login.html');
    window.location.href = 'login.html';
  }
})();

// Global Error Handler to hide splash screen if anything crashes
window.onerror = function (msg, url, line, col, error) {
  console.error('💥 GLOBAL ERROR:', msg, 'at', line, ':', col);
  const splash = document.getElementById('splashScreen');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 500);
  }
  return false;
};

function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userFirstName');
  localStorage.removeItem('userLastName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('userGender');
  window.location.href = 'login.html';
}

// Backend server URL
// In development: http://localhost:3000
// In production (Vercel): Use relative path
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000'
  : '';

// For production deployment, change to your server URL:
// const API_URL = 'https://your-domain.com';

const PROXY_URL = API_URL; // Legacy compatibility

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
let productDataMap = {}; // Map to store original product data with price history
let wishlist = [];       // Wishlist items
let cart = [];           // Cart items

// ── LocalStorage Helpers ───────────────────────────────────────────────────
function saveState() {
  localStorage.setItem('shopiq_wishlist', JSON.stringify(wishlist));
  localStorage.setItem('shopiq_cart', JSON.stringify(cart));
  updateBadges();
}

function loadState() {
  try {
    wishlist = JSON.parse(localStorage.getItem('shopiq_wishlist')) || [];
    cart = JSON.parse(localStorage.getItem('shopiq_cart')) || [];
  } catch (e) {
    wishlist = [];
    cart = [];
  }
  updateBadges();
}

function updateBadges() {
  const wlBadge = document.getElementById('wishlistCount');
  const cartBadge = document.getElementById('cartCount');
  if (wlBadge) {
    wlBadge.textContent = wishlist.length;
    wlBadge.style.display = wishlist.length > 0 ? 'inline-block' : 'none';
  }
  if (cartBadge) {
    cartBadge.textContent = cart.length;
    cartBadge.style.display = cart.length > 0 ? 'inline-block' : 'none';
  }

  // Update Login/Account link
  const loginLink = document.querySelector('a[href="account.html"]');
  if (loginLink) {
    if (localStorage.getItem('isLoggedIn') === 'true') {
      const firstName = localStorage.getItem('userFirstName') || 'User';
      loginLink.innerHTML = `<i class="far fa-user"></i> ${firstName}`;
    } else {
      loginLink.innerHTML = `<i class="far fa-user"></i> Login`;
    }
  }

  // Update theme toggle icon
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    const isDark = document.documentElement.classList.contains('dark-theme');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  }
}

function toggleWishlist(e, itemStr) {
  e.stopPropagation(); // prevent opening PDP
  const item = JSON.parse(decodeURIComponent(itemStr));
  const existingIdx = wishlist.findIndex(w => w.title === item.title);
  if (existingIdx >= 0) {
    wishlist.splice(existingIdx, 1);
    e.currentTarget.classList.remove('active');
    e.currentTarget.innerHTML = '<i class="far fa-heart"></i>';
  } else {
    wishlist.push(item);
    e.currentTarget.classList.add('active');
    e.currentTarget.innerHTML = '<i class="fas fa-heart" style="color:red;"></i>';
  }
  saveState();
  if (document.getElementById('wishlistPage').style.display === 'block') {
    showWishlistPage(); // refresh if open
  }
}

function addToCart(e, itemStr) {
  e.stopPropagation();
  const item = JSON.parse(decodeURIComponent(itemStr));
  const existingIdx = cart.findIndex(c => c.title === item.title);
  if (existingIdx < 0) {
    cart.push(item);
    saveState();
    const btn = e.currentTarget;
    const oldText = btn.innerHTML;
    btn.innerHTML = '✔ Added';
    btn.style.background = '#f0fdf4';
    btn.style.borderColor = '#16a34a';
    btn.style.color = '#16a34a';
    setTimeout(() => {
      btn.innerHTML = oldText;
      btn.style.background = '';
      btn.style.borderColor = '';
      btn.style.color = '';
    }, 2000);
  } else {
    alert('Item is already in your cart!');
  }
}

function removeFromCart(title) {
  cart = cart.filter(c => c.title !== title);
  saveState();
  showCartPage();
}

// ── Page Views ─────────────────────────────────────────────────────────────
function hideAllPages() {
  document.getElementById('homePage').style.display = 'none';
  document.getElementById('searchPage').style.display = 'none';
  document.getElementById('comparePage').style.display = 'none';
  document.getElementById('wishlistPage').style.display = 'none';
  document.getElementById('cartPage').style.display = 'none';
  document.getElementById('splashScreen').classList.add('hidden');
}

function showWishlistPage() {
  hideAllPages();
  const wp = document.getElementById('wishlistPage');
  wp.style.display = 'block';

  const container = document.getElementById('wishlistContainer');
  if (wishlist.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 4rem; color: var(--text-muted);">Your wishlist is empty.</div>';
    return;
  }

  // We can reuse the HTML generation logic but simplify it
  let html = '';
  wishlist.forEach((item, idx) => {
    let imgSrc = item.thumbnail || '';
    let minPrice = Infinity;
    let storeLink = '#';
    let storeLogo = '';

    // Find best price to show
    if (item.storeVariants) {
      Object.values(item.storeVariants).forEach(v => {
        if (v.price > 0 && v.price < minPrice) {
          minPrice = v.price;
          storeLink = v.link;
        }
      });
    }

    const priceDisplay = minPrice !== Infinity ? fmt(minPrice) : 'Check Store';
    const itemStr = encodeURIComponent(JSON.stringify(item));

    html += `
      <div class="deal-card" onclick="showComparePage(JSON.parse(decodeURIComponent('${itemStr}')))">
        <div class="wishlist-btn-float active" onclick="toggleWishlist(event, '${itemStr}')" title="Remove from wishlist">
          <i class="fas fa-heart" style="color:red;"></i>
        </div>
        <img src="${imgSrc}" style="width:100%;height:140px;object-fit:contain;margin-bottom:10px" onerror="this.src='https://placehold.co/140x140?text=No+Image'" />
        <h3 style="font-size:0.9rem;margin:0 0 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.title}</h3>
        <div style="font-weight:800;color:var(--text);margin-bottom:10px;">${priceDisplay}</div>
        <button class="add-to-cart-btn" style="width:100%;justify-content:center;" onclick="addToCart(event, '${itemStr}')">Add to Cart</button>
      </div>
    `;
  });
  container.innerHTML = html;
}

function showCartPage() {
  hideAllPages();
  const cp = document.getElementById('cartPage');
  cp.style.display = 'block';

  const container = document.getElementById('cartContainer');
  if (cart.length === 0) {
    container.innerHTML = '<div style="text-align:center; padding: 4rem; color: var(--text-muted);">Your cart is empty.</div>';
    return;
  }

  let html = '';
  let mockTotal = 0;
  cart.forEach((item) => {
    let imgSrc = item.thumbnail || '';
    let minPrice = Infinity;
    let storeLink = '#';
    let bestStoreName = 'Store';

    if (item.storeVariants) {
      Object.keys(item.storeVariants).forEach(key => {
        let v = item.storeVariants[key];
        if (v.price > 0 && v.price < minPrice) {
          minPrice = v.price;
          storeLink = v.link;
          let s = STORES.find(st => st.key === key);
          if (s) bestStoreName = s.label;
        }
      });
    }

    if (minPrice !== Infinity) mockTotal += minPrice;
    const priceDisplay = minPrice !== Infinity ? fmt(minPrice) : 'Check Store';

    html += `
      <div class="cart-item-row">
        <img src="${imgSrc}" class="cart-item-img" onerror="this.src='https://placehold.co/80x80?text=No+Img'" />
        <div class="cart-item-info">
          <h3>${item.title}</h3>
          <div style="color:var(--text-muted);font-size:0.9rem;margin-bottom:4px;">Best price at: <strong>${bestStoreName}</strong></div>
          <div class="cart-item-price">${priceDisplay}</div>
        </div>
        <div class="cart-actions">
          <a href="${storeLink}" target="_blank" class="cart-purchase-btn">Purchase <i class="fas fa-external-link-alt" style="font-size:0.8rem;margin-left:4px;"></i></a>
          <button class="cart-remove-btn" onclick="removeFromCart('${item.title.replace(/'/g, "\\'")}')">Remove</button>
        </div>
      </div>
    `;
  });

  if (mockTotal > 0) {
    html += `
      <div style="text-align:right; margin-top: 2rem; padding-top: 1.5rem; border-top: 2px dashed var(--border);">
        <div style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 0.5rem;">Estimated Total</div>
        <div style="font-size: 2rem; font-weight: 900; color: var(--text);">${fmt(mockTotal)}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.5rem;">*Actual totals may vary during checkout on third-party stores.</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

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
function hideSplash() {
  const splash = document.getElementById('splashScreen');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => { splash.style.display = 'none'; }, 600);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────
function openInNewTab(url) {
  if (!url) return;
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w) w.opener = null;
}

function fmt(price) {
  if (price === undefined || price === null) return 'Price on Store';
  if (price === 0 || price === Infinity) return 'Check Price';
  if (typeof price === 'string' && price.startsWith('₹')) return price;
  const num = Number(String(price).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return String(price);
  return '₹' + num.toLocaleString('en-IN');
}

// ── Home page image error handler ──────────────────────────────────────────
function imgError(el) {
  const fallback = el.getAttribute('data-fallback');
  if (fallback && el.src !== fallback) {
    el.src = fallback;
  } else {
    // Show the emoji sibling div
    el.style.display = 'none';
    const sibling = el.nextElementSibling;
    if (sibling) sibling.style.display = 'flex';
  }
}

function showResultsPage() {
  document.getElementById('homePage').style.display = 'none';
  document.getElementById('comparePage').style.display = 'none';
  document.getElementById('searchPage').style.display = 'block';
  window.scrollTo(0, 0);
}

async function showHomePage() {
  document.getElementById('homePage').style.display = 'block';
  document.getElementById('comparePage').style.display = 'none';
  document.getElementById('searchPage').style.display = 'none';
  window.scrollTo(0, 0);

  // Populate Home Content
  renderHomeContent();
}

async function renderHomeContent() {
  const dealsContainer = document.getElementById('dealsContainer');
  const brandsContainer = document.getElementById('brandsContainer');
  if (!dealsContainer || !brandsContainer) return;

  // Reliable brand-specific fallback images (Wikipedia/official CDNs that allow hotlinking)
  const brandFallbacks = {
    'samsung': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Samsung_wordmark.svg/320px-Samsung_wordmark.svg.png',
    'apple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/120px-Apple_logo_black.svg.png',
    'oneplus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/OnePlus_logo.svg/320px-OnePlus_logo.svg.png',
    'iphone': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/120px-Apple_logo_black.svg.png',
    'redmi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/320px-Xiaomi_logo_%282021-%29.svg.png',
    'xiaomi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/320px-Xiaomi_logo_%282021-%29.svg.png',
    'dell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/320px-Dell_Logo.svg.png',
    'hp': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/180px-HP_logo_2012.svg.png',
    'lenovo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/320px-Lenovo_logo_2015.svg.png',
    'asus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/320px-ASUS_Logo.svg.png',
    'acer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Acer_2011.svg/320px-Acer_2011.svg.png',
    'msi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/MSI_Logo_2022.svg/320px-MSI_Logo_2022.svg.png',
    'google': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/320px-Google_2015_logo.svg.png',
  };

  function getBrandFallback(brand) {
    const b = brand.toLowerCase();
    for (const key of Object.keys(brandFallbacks)) {
      if (b.includes(key)) return brandFallbacks[key];
    }
    return '';
  }

  try {
    const res = await fetch(`${API_URL}/api/data`);
    const data = await res.json();

    // Render Deals (All categories)
    const all = [];
    Object.keys(data).forEach(cat => {
      if (Array.isArray(data[cat])) all.push(...data[cat]);
    });

    // Randomize deals for variety
    const shuffled = all.sort(() => 0.5 - Math.random());

    dealsContainer.innerHTML = shuffled.slice(0, 10).map(item => {
      const prices = [item.amazon, item.flipkart, item.reliance, item.croma, item.tatacliq].filter(p => p > 0);
      const minP = prices.length ? Math.min(...prices) : (item.price || 50000);
      const rawImg = (item.specs && item.specs.image) ? item.specs.image : '';
      const fallbackImg = getBrandFallback(item.brand);
      const emoji = getBrandEmoji(item.brand);

      // Image HTML: direct from GSMArena; fallback to brand logo then emoji
      const fb = fallbackImg || '';
      let imgHtml;
      if (rawImg) {
        imgHtml = '<img src="' + rawImg + '" data-fallback="' + fb + '" onerror="imgError(this)" style="max-width:100%; max-height:140px; object-fit:contain;" />'
          + '<div style="display:none;align-items:center;justify-content:center;font-size:3rem;height:140px;">' + emoji + '</div>';
      } else {
        imgHtml = `<div style="display:flex;align-items:center;justify-content:center;font-size:3rem;height:140px;">${emoji}</div>`;
      }

      return `
        <div class="deal-card" onclick="searchQuery('${item.brand.replace(/'/g, "\\'")}')">
          <div style="height:150px; display:flex; align-items:center; justify-content:center; margin-bottom:12px;">
            ${imgHtml}
          </div>
          <div style="font-weight:700; font-size:13px; margin-bottom:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.brand}">${item.brand}</div>
          <div style="color:var(--primary); font-weight:800; font-size:1rem;">From ${fmt(minP)}</div>
        </div>
      `;
    }).join('');

    // Render Brands with brand logos
    const brands = [
      { name: 'Apple', logo: brandFallbacks['apple'] },
      { name: 'Samsung', logo: brandFallbacks['samsung'] },
      { name: 'Dell', logo: brandFallbacks['dell'] },
      { name: 'HP', logo: brandFallbacks['hp'] },
      { name: 'OnePlus', logo: brandFallbacks['oneplus'] },
      { name: 'Asus', logo: brandFallbacks['asus'] },
    ];
    brandsContainer.innerHTML = brands.map(function (b) {
      return '<div class="brand-item" onclick="searchQuery(\'' + b.name + '\')" style="min-width:120px;text-align:center;cursor:pointer;">'
        + '<div style="width:90px;height:90px;margin:0 auto 10px;background:var(--bg);border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);padding:12px;">'
        + '<img src="' + b.logo + '" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display=\'none\';this.parentElement.textContent=\'' + getBrandEmoji(b.name) + '\';" />'
        + '</div>'
        + '<div style="font-weight:600;font-size:13px;color:var(--text);">' + b.name + '</div>'
        + '</div>';
    }).join('');

  } catch (e) {
    console.error('Home content error:', e);
  }
}

// Generate synthetic price history for products that don't have real data
function generateSyntheticHistory(product) {
  const history = {};
  const storeKeys = ['amazon', 'flipkart', 'reliance', 'croma', 'tatacliq'];
  const dates = ['2026-02-15', '2026-03-01', '2026-03-15', '2026-04-01', '2026-04-15'];

  // Use a seeded-ish random based on product title for consistency
  const title = (product.brand || product.title || 'unknown').toString();
  const seed = title.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const pseudoRandom = (i) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 49297;
    return x - Math.floor(x);
  };

  let idx = 0;
  storeKeys.forEach(store => {
    if (product[store]) {
      const currentPrice = product[store];
      const variation = 0.06 + pseudoRandom(idx++) * 0.09; // 6-15% higher at start
      const points = [];

      dates.forEach((date, i) => {
        const progress = i / (dates.length - 1);
        const factor = 1 + variation * (1 - progress);
        // Round to nearest 100 and add 99 for realism
        let price = Math.round(currentPrice * factor / 100) * 100 - 1;
        if (i === dates.length - 1) price = currentPrice; // ensure last = current
        points.push({ date, price });
      });

      history[store] = points;
    }
  });

  return history;
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

  showLoading('🔍 Searching across all stores...');

  try {
    // Try to fetch from backend server first (real-time scraping)
    try {
      console.log(`Fetching from: ${API_URL}/api/search?q=${encodeURIComponent(rawQuery)}`);
      const response = await Promise.race([
        fetch(`${API_URL}/api/search?q=${encodeURIComponent(rawQuery)}`),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout after 8s')), 8000))
      ]);

      if (response.ok) {
        const data = await response.json();

        console.log(`API Response:`, data);

        if (data.results && data.results.length > 0) {
          console.log(`✅ Got ${data.results.length} results from backend server`);

          // Transform API response to match expected format
          const shopping_results = data.results.map(product => ({
            title: product.title,
            link: product.link || '#',
            extracted_price: product.price,
            price: product.priceStr || '₹' + product.price.toLocaleString('en-IN'),
            source: product.source,
            thumbnail: product.image || '',
            delivery: product.delivery || 'Check store for delivery info',
            rating: product.rating || null,
            reviews: product.reviews || null,
            allStorePrices: product.allStorePrices || {},
            isSearchLink: product.isSearchLink || false,
            isFallback: product.isFallback || false,
            isSynthetic: product.isSynthetic || false
          }));

          productDataMap = {};
          shopping_results.forEach(product => {
            productDataMap[product.title] = product;
          });

          processAndRender(shopping_results);
          console.log('✅ Successfully rendered live data from backend server');
          return;
        } else {
          console.warn('⚠️ Backend returned empty results');
        }
      } else {
        console.warn(`⚠️ Backend returned status: ${response.status}`);
      }
    } catch (serverError) {
      console.warn('⚠️ Backend server error (will use fallback):', serverError.message);
    }

    // FALLBACK: Load from local data.json
    console.log('📦 Using local fallback data from data.json...');
    const res = await fetch('data.json');
    if (!res.ok) {
      showError('Failed to load product data. Please refresh the page.');
      return;
    }

    const data = await res.json();
    const category = categoryFilter.value;
    let products = [];

    if (category === 'all') {
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key])) {
          products = products.concat(data[key]);
        }
      });
    } else {
      products = data[category] || [];
    }

    // Filter products based on search query
    const searchTerms = rawQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);
    const filteredProducts = products.filter(product => {
      const brandLower = product.brand.toLowerCase();
      const specsLower = (product.specs?.details || '').toLowerCase();
      const combinedText = `${brandLower} ${specsLower}`;
      return searchTerms.every(term => combinedText.includes(term));
    });

    if (filteredProducts.length === 0) {
      showEmpty(`No products found matching "${rawQuery}". Try: iPhone, Samsung, OnePlus, MacBook, etc.`);
      return;
    }

    // Create results with ALL store prices
    const shopping_results = [];
    filteredProducts.forEach(product => {
      // For each product, create multiple entries - one per store with a price
      STORES.forEach(store => {
        const urlKey = store.key + 'Url';
        const altUrlKey = store.key === 'tatacliq' ? 'tataCliqUrl' : urlKey;
        const productUrl = product[urlKey] || product[altUrlKey];
        const storePrice = product[store.key];

        if (productUrl && storePrice) {
          shopping_results.push({
            title: product.brand,
            link: productUrl,
            extracted_price: storePrice,
            price: '₹' + storePrice.toLocaleString('en-IN'),
            source: store.label,
            store: store.key,
            thumbnail: product.specs?.image || '',
            delivery: 'Free delivery',
            rating: 4.5,
            reviews: 100,
            allStorePrices: Object.fromEntries(
              STORES
                .filter(s => product[s.key])
                .map(s => [s.key, { price: product[s.key], source: s.label, link: product[s.key + 'Url'] || product[s.key === 'tatacliq' ? 'tataCliqUrl' : s.key + 'Url'] }])
            )
          });
        }
      });
    });

    if (shopping_results.length === 0) {
      showEmpty(`No products found matching "${rawQuery}". Try: iPhone, Samsung, OnePlus, MacBook, etc.`);
      return;
    }

    productDataMap = {};
    filteredProducts.forEach(product => {
      productDataMap[product.brand] = product;
    });

    processAndRender(shopping_results);
    console.log(`✅ Rendered ${shopping_results.length} results from fallback data (${filteredProducts.length} unique products across multiple stores)`);

  } catch (error) {
    console.error('Search error:', error);
    showError(`Error searching products: ${error.message}`);
  }
}

// ── Process results ────────────────────────────────────────────────────────
function processAndRender(raw) {
  rawSerpResults = raw; // save raw results to avoid network call when filtering stores

  const activeStores = Array.from(storeCheckboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);

  console.log(`Processing ${raw.length} raw results. Active stores: ${activeStores.join(', ')}`);

  // Group by product title to show best price and all store options
  const productMap = {};


  // ── No client-side relevance filter — backend already handles relevance ──
  const filteredRaw = raw;

  filteredRaw.forEach(item => {
    if (item.extracted_price === undefined || item.extracted_price === null) return;

    const store = matchStore(item);
    if (!store) {
      console.warn('Could not match store for item:', item);
      return;
    }

    if (!activeStores.includes(store.key)) return;

    const titleKey = item.title.toLowerCase().trim();

    // Stricter fuzzy matching to group the same product from different stores
    let matchedKey = null;
    const currentWords = titleKey.split(/[\s\-\(\),]+/).filter(w => w.length > 0);

    const isModelWord = (w) => (/^[0-9]+$/.test(w) && parseInt(w) < 100) || ['pro', 'max', 'plus', 'ultra', 'fe', 'air', 'm1', 'm2', 'm3', 'fold', 'flip'].includes(w);
    const currentModels = currentWords.filter(isModelWord).sort().join(',');

    for (const existingKey of Object.keys(productMap)) {
      if (existingKey === titleKey) {
        // Prevent grouping if the store already has this exact product (e.g. Amazon returned duplicates)
        if (!productMap[existingKey].storeVariants[store.key]) {
          matchedKey = existingKey;
          break;
        }
      }

      // Do not group if the existing product already has a variant from THIS store!
      // (This prevents an Amazon product from merging into another Amazon product)
      if (productMap[existingKey].storeVariants[store.key]) continue;

      // Normalize to separate numbers and letters (e.g., 128gb -> 128 gb) for better matching
      const normalizeWords = (str) => str.toLowerCase().replace(/([0-9]+)([a-z]+)/gi, '$1 $2').split(/[\s\-\(\),]+/).filter(w => w.length > 0);

      const currentNorm = normalizeWords(titleKey);
      const existingNorm = normalizeWords(existingKey);

      const currentModels = currentNorm.filter(isModelWord).sort().join(',');
      const existingModels = existingNorm.filter(isModelWord).sort().join(',');

      // Must have the exact same model modifiers (e.g., '15' vs '15,pro,max')
      if (currentModels !== existingModels) continue;

      let matches = 0;
      for (const word of currentNorm) {
        if (word.length > 1 && existingNorm.includes(word)) matches++;
      }

      const len1 = currentNorm.filter(w => w.length > 1).length;
      const len2 = existingNorm.filter(w => w.length > 1).length;
      if (len1 === 0 || len2 === 0) continue;

      const ratioMin = matches / Math.min(len1, len2);
      if (ratioMin >= 0.5) {
        matchedKey = existingKey;
        break;
      }
    }

    const targetKey = matchedKey || titleKey;

    if (!productMap[targetKey]) {
      productMap[targetKey] = {
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
        storeVariants: {},
        specs: item.specs || null,
        priceHistory: item.priceHistory || null
      };
    }

    // Track this product across all stores
    productMap[targetKey].storeVariants[store.key] = {
      price: item.extracted_price,
      priceStr: item.price || fmt(item.extracted_price),
      source: item.source,
      link: item.link,
      rating: item.rating,
      delivery: item.delivery,
      store: store
    };

    // Update main entry to show cheapest option
    if (item.extracted_price < productMap[targetKey].price) {
      productMap[targetKey].price = item.extracted_price;
      productMap[targetKey].priceStr = item.price || fmt(item.extracted_price);
      productMap[targetKey].source = item.source;
      productMap[targetKey].store = store;
      productMap[targetKey].link = item.link;
      productMap[targetKey].delivery = item.delivery;
    }
  });

  // Inject "View on Store" links for any store missing from each product
  Object.values(productMap).forEach(product => {
    if (!product || product.price === 0) return; // skip search-link placeholder cards

    // Create a clean title for searching (remove weird characters that might break store search engines)
    const cleanTitle = product.title.replace(/[^\w\s-]/gi, ' ').replace(/\s+/g, ' ').trim();

    const specificStoreUrls = {
      amazon: `https://www.amazon.in/s?k=${encodeURIComponent(cleanTitle)}`,
      flipkart: `https://www.flipkart.com/search?q=${encodeURIComponent(cleanTitle)}`,
      croma: `https://www.croma.com/searchB?q=${encodeURIComponent(cleanTitle)}%3Arelevance&text=${encodeURIComponent(cleanTitle)}`,
      reliance: `https://www.reliancedigital.in/products?q=${encodeURIComponent(cleanTitle)}`,
      tatacliq: `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(cleanTitle)}`
    };

    STORES.forEach(s => {
      if (!product.storeVariants[s.key]) {
        // Generate a synthetic price close to the base product price for missing stores
        let syntheticPrice = product.price;
        if (s.key === 'flipkart') syntheticPrice = Math.round(product.price * (Math.random() * 0.04 + 0.98)); // 0.98 to 1.02
        if (s.key === 'croma') syntheticPrice = Math.round(product.price * (Math.random() * 0.05 + 1.00)); // 1.00 to 1.05
        if (s.key === 'reliance') syntheticPrice = Math.round(product.price * (Math.random() * 0.05 + 0.99)); // 0.99 to 1.04
        if (s.key === 'tatacliq') syntheticPrice = Math.round(product.price * (Math.random() * 0.06 + 1.02)); // 1.02 to 1.08

        // Ensure price formatting
        const formattedPrice = '₹' + syntheticPrice.toLocaleString('en-IN');

        product.storeVariants[s.key] = {
          price: syntheticPrice,
          priceStr: formattedPrice,
          source: s.label,
          link: specificStoreUrls[s.key] || '#',
          rating: null,
          delivery: 'Check store for delivery details',
          store: s,
          isSearchLink: false
        };

        // Update main entry to show cheapest option if this synthetic price is lower
        if (syntheticPrice < product.price) {
          product.price = syntheticPrice;
          product.priceStr = formattedPrice;
          product.source = s.label;
          product.store = s;
          product.link = specificStoreUrls[s.key] || '#';
        }
      }
    });
  });

  // Filter out standalone search-link placeholder cards (price=0) since stores are now injected into real products
  let mapped = Object.values(productMap).filter(p => p && p.price > 0);

  if (mapped.length === 0) {
    // If we have no real products, show the placeholder search cards instead of an empty screen
    mapped = Object.values(productMap);
  }

  console.log(`Mapped to ${mapped.length} unique products`);

  if (mapped.length === 0) {
    showEmpty('No results found from the tracked stores.<br>Try a more specific product name.');
    return;
  }

  currentResults = sortItems(mapped, sortMode.value);

  // Filter out extreme outliers (like cheap accessories) before calculating best per store
  let validForChart = currentResults;
  if (currentResults.length > 2) {
    const prices = currentResults.map(i => i.price).sort((a, b) => a - b);
    const q1 = prices[Math.floor(prices.length * 0.25)];
    const q3 = prices[Math.floor(prices.length * 0.75)];
    const iqr = q3 - q1;
    // Lower bound: exclude things that are much cheaper than the main cluster (accessories)
    const lowerBound = Math.max(0, q1 - 1.5 * iqr);
    // Alternatively, if the cheapest item is < 20% of median, it's probably an accessory
    const median = prices[Math.floor(prices.length * 0.5)];

    validForChart = currentResults.filter(item => {
      // Exclude if price is suspiciously low compared to median (e.g., a case vs a phone)
      if (item.price < median * 0.2) return false;
      return true;
    });

    if (validForChart.length === 0) validForChart = currentResults;
  }

  // Best per store (cheapest)
  bestPerStore = {};
  validForChart.forEach(item => {
    if (!bestPerStore[item.store.key] || item.price < bestPerStore[item.store.key].price) {
      bestPerStore[item.store.key] = item;
    }
  });

  console.log(`Best per store (filtered for chart):`, Object.keys(bestPerStore).map(k => `${k}: ₹${bestPerStore[k].price}`).join(', '));

  const storeFiltersEl = document.getElementById('storeFilters');
  if (storeFiltersEl) {
    storeFiltersEl.style.display = 'flex';
  }

  renderCards(currentResults);
  renderChart();

  // Show paste link section if results are synthetic or empty
  const pasteLinkSection = document.getElementById('pasteLinkSection');
  if (pasteLinkSection) {
    const hasRealResults = currentResults.some(r => !r.isSynthetic);
    pasteLinkSection.style.display = !hasRealResults ? 'flex' : 'none';
  }
}

// ── Product cards ──────────────────────────────────────────────────────────
function renderCards(items) {
  if (!resultsList) { console.warn('Results list element not found'); return; }

  // Show/Hide sidebar based on results
  const sidebar = document.getElementById('sidebarFilters');
  if (sidebar) {
    sidebar.style.display = items.length > 0 ? 'block' : 'none';
    // Update storeFilters display if it was previously set to flex/none
    const storeFiltersEl = document.getElementById('storeFilters');
    if (storeFiltersEl) storeFiltersEl.style.display = 'flex';
  }

  const storeInfo = {};
  STORES.forEach(function (s) { storeInfo[s.key] = s; });

  var html = '';

  items.forEach(function (item, idx) {
    // Build store price rows
    var allStoreRows = [];
    STORES.forEach(function (store) {
      var variant = item.storeVariants ? item.storeVariants[store.key] : null;
      if (variant && variant.isSearchLink) {
        allStoreRows.push({ key: store.key, label: store.label, price: Infinity, priceStr: 'View on Store →', link: variant.link || '#', logo: store.logo, available: true, isSearchLink: true });
      } else if (variant && variant.price > 0) {
        allStoreRows.push({ key: store.key, label: store.label, price: variant.price, priceStr: variant.priceStr || fmt(variant.price), link: variant.link || '#', logo: store.logo, available: true });
      } else if (variant) {
        allStoreRows.push({ key: store.key, label: store.label, price: variant.price, priceStr: variant.priceStr || fmt(variant.price), link: variant.link || '#', logo: store.logo, available: true });
      } else {
        allStoreRows.push({ key: store.key, label: store.label, price: Infinity, priceStr: '\u2014', link: '#', logo: store.logo, available: false });
      }
    });
    allStoreRows.sort(function (a, b) { return a.price - b.price; });

    var cheapestPrice = allStoreRows[0] ? allStoreRows[0].price : 0;
    var cheapestLink = allStoreRows[0] ? allStoreRows[0].link : '#';
    var availableStores = allStoreRows.filter(function (r) { return r.available; });

    // MRP
    var mrpPrice = 0;
    availableStores.forEach(function (r) { if (r.price > mrpPrice && r.price !== Infinity) mrpPrice = r.price; });
    var discount = mrpPrice > cheapestPrice ? Math.round(((mrpPrice - cheapestPrice) / mrpPrice) * 100) : 0;

    // Image
    var imgSrc = item.thumbnail || '';
    if (imgSrc && (imgSrc.startsWith('http') || imgSrc.startsWith('//'))) {
      imgSrc = `${API_URL}/api/image-proxy?url=${encodeURIComponent(imgSrc)}`;
    }
    var emoji = getBrandEmoji(item.title);
    var gradient = getBrandGradient(item.title);
    var imgHtml = imgSrc ?
      '<img src="' + imgSrc + '" onerror="this.style.display=\x27none\x27;this.nextElementSibling.style.display=\x27flex\x27;" alt="' + item.title + '" loading="lazy" />' +
      '<div class="product-thumb-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;">' + emoji + '</span></div>'
      :
      '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;">' + emoji + '</span></div>';

    // Rating
    var rating = (4.1 + Math.random() * 0.7).toFixed(1);
    var ratingCount = (Math.floor(Math.random() * 3000) + 150).toLocaleString();

    // Specs
    var specsHtml = '';
    if (item.specs && item.specs.details) {
      var lines = item.specs.details.split('\n').slice(0, 5);
      lines.forEach(l => { if (l.trim()) specsHtml += '<li>' + l.trim() + '</li>'; });
    } else {
      specsHtml += '<li>Brand Warranty Available</li>';
      specsHtml += '<li>High Quality Product</li>';
      specsHtml += '<li>Free Shipping on Pre-paid orders</li>';
    }

    // Compare Stores Table
    var compareHtml = '';
    allStoreRows.forEach(function (r) {
      var isBest = r.available && !r.isSearchLink && r.price === cheapestPrice && cheapestPrice !== Infinity;
      var priceLabel = r.isSearchLink ? 'View' : (r.available ? fmt(r.price) : 'N/A');
      compareHtml += `
        <div class="fk-store-row">
          <div class="fk-store-name">
            <img src="${r.logo}" class="fk-store-logo" onerror="this.style.visibility='hidden'">
            <span>${r.label}</span>
          </div>
          <div class="fk-store-price ${isBest ? 'fk-best-price' : ''}">${priceLabel}</div>
        </div>
      `;
    });

    // Check if the overall product is a "Search Link" product
    const isMainSearchLink = availableStores.every(s => s.isSearchLink);
    const mainPriceHtml = isMainSearchLink ?
      `<div class="fk-main-price" style="font-size:1.2rem;">View Deals →</div>` :
      `<div class="fk-main-price">${fmt(cheapestPrice)}</div>
       ${discount > 0 ? `<div class="fk-old-price">${fmt(mrpPrice)}</div><div class="fk-discount">${discount}% off</div>` : ''}`;

    const itemStr = encodeURIComponent(JSON.stringify(item));
    const inWishlist = wishlist.some(w => w.title === item.title);
    const heartIcon = inWishlist ? '<i class="fas fa-heart" style="color:red;"></i>' : '<i class="far fa-heart"></i>';
    const heartClass = inWishlist ? 'wishlist-btn-float active' : 'wishlist-btn-float';

    html += `
      <div class="fk-product-card" data-index="${idx}">
        <div class="${heartClass}" onclick="toggleWishlist(event, '${itemStr}')" title="Add to Wishlist">
          ${heartIcon}
        </div>
        <div class="fk-image-col">${imgHtml}</div>
        <div class="fk-details-col">
          <h2 class="fk-product-title">${item.title}</h2>
          <div class="fk-rating-row">
            <div class="fk-rating-badge">${rating} ★</div>
            <div class="fk-rating-count">${ratingCount} Ratings & Reviews</div>
          </div>
          <ul class="fk-specs-list">${specsHtml}</ul>
        </div>
        <div class="fk-price-col">
          <div class="fk-main-price-row">
            ${mainPriceHtml}
          </div>
          <div class="fk-delivery-info">${isMainSearchLink ? 'Explore more options' : 'Free delivery'}</div>
          <button class="add-to-cart-btn" onclick="addToCart(event, '${itemStr}')"><i class="fas fa-shopping-cart"></i> Add to Cart</button>
          <div class="fk-store-compare-box" style="margin-top:12px;">
            <div class="fk-store-compare-head"><span>Store</span><span>Price</span></div>
            ${compareHtml}
          </div>
        </div>
      </div>`;
  });

  resultsList.innerHTML = html;

  // Click card -> compare page
  resultsList.querySelectorAll('.fk-product-card').forEach(function (card) {
    card.addEventListener('click', function (e) {
      // If clicking a store row, go to that store instead of compare page
      const storeRow = e.target.closest('.fk-store-row');
      if (storeRow) {
        const storeName = storeRow.querySelector('.fk-store-name span').textContent;
        const resultIndex = Number(card.dataset.index);
        const item = currentResults[resultIndex];

        // Find the matching store variant link
        for (let key in item.storeVariants) {
          if (STORES.find(s => s.key === key).label === storeName) {
            window.open(item.storeVariants[key].link, '_blank');
            return;
          }
        }
      }

      if (e.target.closest('.view-deal-btn') || e.target.closest('.store-visit-link') || e.target.closest('a[target="_blank"]')) return;
      showComparePage(currentResults[Number(card.dataset.index)]);
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

// ── Price History Chart ────────────────────────────────────────────────────
function renderPriceHistory(productData, selectedItem) {
  const historyCard = document.getElementById('priceHistoryCard');
  const svg = document.getElementById('historyChartSvg');
  const insightDiv = document.getElementById('priceInsight');

  if (!svg || !historyCard || !productData.priceHistory) {
    if (historyCard) historyCard.style.display = 'none';
    return;
  }

  const history = productData.priceHistory;

  // Collect all dates and stores
  const allDates = new Set();
  const storeKeys = Object.keys(history);

  storeKeys.forEach(store => {
    if (history[store] && Array.isArray(history[store])) {
      history[store].forEach(entry => {
        allDates.add(entry.date);
      });
    }
  });

  const sortedDates = Array.from(allDates).sort();
  if (sortedDates.length < 2) {
    historyCard.style.display = 'none';
    return;
  }

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 40, left: 50 };
  const width = svg.clientWidth - margin.left - margin.right;
  const height = 320 - margin.top - margin.bottom;

  // Find min/max prices
  let minPrice = Infinity, maxPrice = 0;
  storeKeys.forEach(store => {
    if (history[store]) {
      history[store].forEach(entry => {
        minPrice = Math.min(minPrice, entry.price);
        maxPrice = Math.max(maxPrice, entry.price);
      });
    }
  });

  const priceRange = maxPrice - minPrice || 1;
  const padding = priceRange * 0.1;
  const minY = minPrice - padding;
  const maxY = maxPrice + padding;

  // Scale functions
  const xScale = (date) => {
    const idx = sortedDates.indexOf(date);
    return idx === -1 ? 0 : (idx / (sortedDates.length - 1 || 1)) * width;
  };
  const yScale = (price) => height - ((price - minY) / (maxY - minY)) * height;

  // Clear SVG
  svg.innerHTML = '';

  // Create group for chart
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${margin.left},${margin.top})`);

  // Draw grid lines
  const gridLinesY = 5;
  for (let i = 0; i <= gridLinesY; i++) {
    const y = (i / gridLinesY) * height;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', 0);
    line.setAttribute('y1', y);
    line.setAttribute('x2', width);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#e2e8f0');
    line.setAttribute('stroke-dasharray', '4');
    line.setAttribute('stroke-width', '1');
    g.appendChild(line);
  }

  // Define colors for each store
  const storeColors = {
    amazon: '#FF9900',
    flipkart: '#2874F0',
    croma: '#00E9BF',
    reliance: '#E4252A',
    tatacliq: '#D0021B'
  };


  // Draw lines for each store
  storeKeys.forEach(storeKey => {
    if (!history[storeKey] || history[storeKey].length === 0) return;

    const points = history[storeKey]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(entry => ({
        x: xScale(entry.date),
        y: yScale(entry.price),
        price: entry.price,
        date: entry.date
      }));

    if (points.length < 2) return;

    // Draw line
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    const pathData = points.map((p, i) => `${p.x},${p.y}`).join(' ');
    path.setAttribute('points', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', storeColors[storeKey] || '#2563eb');
    path.setAttribute('stroke-width', '2.5');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    g.appendChild(path);

    // Draw circles for points
    points.forEach((point, idx) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', '4');
      circle.setAttribute('fill', storeColors[storeKey] || '#2563eb');
      circle.setAttribute('stroke', '#fff');
      circle.setAttribute('stroke-width', '2');
      circle.setAttribute('class', 'history-point');

      // Add hover tooltip
      circle.style.cursor = 'pointer';
      circle.addEventListener('mouseover', () => {
        circle.setAttribute('r', '6');
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', point.x);
        label.setAttribute('y', point.y - 15);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '12');
        label.setAttribute('fill', storeColors[storeKey] || '#2563eb');
        label.setAttribute('font-weight', '600');
        label.textContent = fmt(point.price);
        label.setAttribute('class', 'history-label');
        g.appendChild(label);
      });
      circle.addEventListener('mouseout', () => {
        circle.setAttribute('r', '4');
        const labels = g.querySelectorAll('.history-label');
        labels.forEach(l => l.remove());
      });

      g.appendChild(circle);
    });
  });

  // Draw axes
  const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  xAxis.setAttribute('x1', 0);
  xAxis.setAttribute('y1', height);
  xAxis.setAttribute('x2', width);
  xAxis.setAttribute('y2', height);
  xAxis.setAttribute('stroke', '#cbd5e1');
  xAxis.setAttribute('stroke-width', '1.5');
  g.appendChild(xAxis);

  const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  yAxis.setAttribute('x1', 0);
  yAxis.setAttribute('y1', 0);
  yAxis.setAttribute('x2', 0);
  yAxis.setAttribute('y2', height);
  yAxis.setAttribute('stroke', '#cbd5e1');
  yAxis.setAttribute('stroke-width', '1.5');
  g.appendChild(yAxis);

  // Add x-axis labels (dates)
  sortedDates.forEach((date, idx) => {
    if (idx % Math.ceil(sortedDates.length / 5) === 0 || idx === sortedDates.length - 1) {
      const x = xScale(date);
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x);
      text.setAttribute('y', height + 20);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '11');
      text.setAttribute('fill', '#64748b');
      text.textContent = date.substring(5);
      g.appendChild(text);
    }
  });

  // Add y-axis labels (prices)
  for (let i = 0; i <= gridLinesY; i++) {
    const price = minY + (i / gridLinesY) * (maxY - minY);
    const y = yScale(price);
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', -5);
    text.setAttribute('y', y + 4);
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('font-size', '11');
    text.setAttribute('fill', '#64748b');
    text.textContent = fmt(Math.round(price));
    g.appendChild(text);
  }

  // Add legend
  let legendX = 10;
  storeKeys.forEach(storeKey => {
    if (!history[storeKey] || history[storeKey].length === 0) return;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', legendX);
    rect.setAttribute('y', -15);
    rect.setAttribute('width', '12');
    rect.setAttribute('height', '12');
    rect.setAttribute('fill', storeColors[storeKey] || '#2563eb');
    rect.setAttribute('rx', '2');
    g.appendChild(rect);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', legendX + 16);
    text.setAttribute('y', -3);
    text.setAttribute('font-size', '12');
    text.setAttribute('fill', '#64748b');
    text.setAttribute('font-weight', '500');
    const storeLabel = STORES.find(s => s.key === storeKey)?.label || storeKey;
    text.textContent = storeLabel;
    g.appendChild(text);

    legendX += 130;
  });

  svg.appendChild(g);
  historyCard.style.display = 'block';

  // Generate insights
  generatePriceInsight(history, storeKeys, sortedDates, insightDiv);
}

// ── Generate Price Insights ───────────────────────────────────────────────
function generatePriceInsight(history, storeKeys, sortedDates, insightDiv) {
  let insights = [];

  // Find best and worst deals
  storeKeys.forEach(store => {
    if (history[store] && history[store].length > 0) {
      const prices = history[store].map(e => e.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const latestPrice = prices[prices.length - 1];
      const startPrice = prices[0];
      const priceChange = startPrice - latestPrice;
      const percentChange = ((priceChange / startPrice) * 100).toFixed(1);

      const storeLabel = STORES.find(s => s.key === store)?.label || store;

      if (priceChange > 0) {
        insights.push(`✅ <strong>${storeLabel}</strong>: Price dropped by ${fmt(priceChange)} (${percentChange}%)`);
      } else if (priceChange < 0) {
        insights.push(`📈 <strong>${storeLabel}</strong>: Price increased by ${fmt(Math.abs(priceChange))} (${percentChange}%)`);
      } else {
        insights.push(`➡️ <strong>${storeLabel}</strong>: Price remained stable`);
      }
    }
  });

  // Overall best current deal
  let bestStore = null;
  let bestPrice = Infinity;
  storeKeys.forEach(store => {
    if (history[store] && history[store].length > 0) {
      const latestPrice = history[store][history[store].length - 1].price;
      if (latestPrice < bestPrice) {
        bestPrice = latestPrice;
        bestStore = store;
      }
    }
  });

  if (bestStore) {
    const bestStoreLabel = STORES.find(s => s.key === bestStore)?.label || bestStore;
    insights.unshift(`🏆 <strong>Best current deal:</strong> ${bestStoreLabel} at ${fmt(bestPrice)}`);
  }

  insightDiv.innerHTML = insights.join('<br>');
}

// ── Compare page ───────────────────────────────────────────────────────────
function showComparePage(item) {
  console.log('📦 showComparePage called for:', item.title);

  // Hide splash screen if it got stuck
  const splash = document.getElementById('splashScreen');
  if (splash) splash.classList.add('hidden');

  const searchPage = document.getElementById('searchPage');
  const comparePage = document.getElementById('comparePage');
  const compareTitle = document.getElementById('compareTitle');

  if (searchPage) searchPage.style.display = 'none';
  if (comparePage) comparePage.style.display = 'block';
  window.scrollTo(0, 0);

  if (compareTitle) compareTitle.textContent = item.title;
  else console.warn('⚠️ compareTitle element missing');

  // Build store comparison from THIS product's storeVariants (not global bestPerStore)
  var stores = [];
  STORES.forEach(function (storeInfo) {
    var variant = item.storeVariants ? item.storeVariants[storeInfo.key] : null;
    if (variant && !variant.isSearchLink && variant.price > 0) {
      stores.push({
        price: variant.price,
        priceStr: variant.priceStr || fmt(variant.price),
        link: variant.link || '#',
        store: storeInfo,
        isSearchLink: false
      });
    } else {
      // Add search link for stores without real prices
      var searchQuery = (document.getElementById('searchInput')?.value || item.title).trim();
      var storeSearchUrls = {
        amazon: 'https://www.amazon.in/s?k=' + encodeURIComponent(searchQuery),
        flipkart: 'https://www.flipkart.com/search?q=' + encodeURIComponent(searchQuery),
        croma: 'https://www.croma.com/searchB?q=' + encodeURIComponent(searchQuery),
        reliance: 'https://www.reliancedigital.in/search?q=' + encodeURIComponent(searchQuery),
        tatacliq: 'https://www.tatacliq.com/search/?searchCategory=all&text=' + encodeURIComponent(searchQuery)
      };
      stores.push({
        price: Infinity,
        priceStr: 'View on Store →',
        link: (variant && variant.link) ? variant.link : (storeSearchUrls[storeInfo.key] || '#'),
        store: storeInfo,
        isSearchLink: true
      });
    }
  });

  // Sort: real prices first (cheapest), then search links
  stores.sort(function (a, b) {
    if (a.isSearchLink && !b.isSearchLink) return 1;
    if (!a.isSearchLink && b.isSearchLink) return -1;
    return a.price - b.price;
  });

  var realStores = stores.filter(function (s) { return !s.isSearchLink; });
  var cheapest = realStores[0] || stores[0];

  // Populate Flipkart-style price section
  var bestPriceEl = document.getElementById('compareBestPrice');
  var mrpEl = document.getElementById('compareMrp');
  var discountEl = document.getElementById('compareDiscount');

  if (!cheapest.isSearchLink) {
    var maxPrice = 0;
    realStores.forEach(function (s) { if (s.price > maxPrice) maxPrice = s.price; });
    var discountPct = maxPrice > cheapest.price ? Math.round(((maxPrice - cheapest.price) / maxPrice) * 100) : 0;

    if (bestPriceEl) bestPriceEl.textContent = fmt(cheapest.price);
    if (mrpEl) mrpEl.textContent = discountPct > 0 ? fmt(maxPrice) : '';
    if (discountEl) discountEl.textContent = discountPct > 0 ? discountPct + '% off' : '';
  } else {
    if (bestPriceEl) bestPriceEl.textContent = 'Check stores for price';
    if (mrpEl) mrpEl.textContent = '';
    if (discountEl) discountEl.textContent = '';
  }
  const compareSum = document.getElementById('compareSummary');
  if (compareSum) {
    compareSum.innerHTML =
      cheapest.isSearchLink
        ? 'Click any store link below to check live prices'
        : 'Lowest on <strong>' + cheapest.store.label + '</strong> — Free delivery available';
  }

  // 3. Product Image & Gallery
  let productData = null;
  for (let brand in productDataMap) {
    if (item.title.toLowerCase().includes(brand.toLowerCase())) {
      productData = productDataMap[brand];
      break;
    }
  }

  const imgEl = document.getElementById('compareProductImg');
  let imgSrc = (item.specs && item.specs.image) ? item.specs.image : (item.thumbnail || '');

  if (imgEl) {
    if (imgSrc) {
      if (imgSrc.startsWith('http') || imgSrc.startsWith('//')) {
        imgSrc = `${API_URL}/api/image-proxy?url=${encodeURIComponent(imgSrc)}`;
      }
      imgEl.src = imgSrc;
      imgEl.style.display = 'block';
    } else {
      const emoji = getBrandEmoji(item.title);
      const gradient = getBrandGradient(item.title);
      imgEl.parentElement.innerHTML = `<div style="width:100%;height:300px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:${gradient};"><span style="font-size:5rem;">${emoji}</span></div>`;
    }
  }

  const gallery = document.getElementById('productGallery');
  if (gallery) {
    const thumbs = imgSrc ? [imgSrc, imgSrc, imgSrc, imgSrc] : [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=200',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200',
      'https://images.unsplash.com/photo-1556656793-062ff987b50d?w=200'
    ];

    gallery.innerHTML = thumbs.map(function (t, i) {
      return '<div class="pdp-thumb' + (i === 0 ? ' active' : '') + '" onclick="updatePdpImage(\'' + t + '\', this)">' +
        '<img src="' + t + '" onerror="this.src=\'https://via.placeholder.com/60?text=Photo+' + (i + 1) + '\'" />' +
        '</div>';
    }).join('');
    gallery.style.display = 'flex';
  }

  // 5. Specs Table
  const specsWrap = document.getElementById('specsTableWrap');
  if (specsWrap) {
    const specIcons = { 'Display': '📱', 'CPU': '⚙️', 'RAM': '🧠', 'Storage': '💾', 'Camera': '📷', 'Rear Camera': '📷', 'Battery': '🔋', 'OS': '💻', 'GPU': '🎮', 'Weight': '⚖️' };
    const specs = item.specs || (productData && productData.specs) || null;
    
    if (specs && specs.details) {
      const specParts = specs.details.split(' • ');
      let specHtml = '<ul>';
      specParts.forEach(function (part) {
        const kv = part.split(': ');
        if (kv.length >= 2) {
          const icon = specIcons[kv[0]] || '🔹';
          specHtml += `<li><span class="pdp-highlight-icon">${icon}</span><div><strong>${kv[0]}</strong><br>${kv.slice(1).join(': ')}</div></li>`;
        } else {
          specHtml += `<li><span class="pdp-highlight-icon">🔹</span><div>${part}</div></li>`;
        }
      });
      specHtml += '</ul>';
      specsWrap.innerHTML = specHtml;
    } else {
      specsWrap.innerHTML = '<p style="color:var(--text-muted,#64748b);font-size:0.95rem;">High-performance product with premium features. Brand warranty included.</p>';
    }
  }

  // ── Buy at Lowest Price button
  var buyBtn = document.getElementById('buyLowestBtn');
  var buyBtn2 = document.getElementById('buyLowestBtn2');

  if (buyBtn && cheapest) {
    buyBtn.href = cheapest.link || '#';
    const priceText = (cheapest.isSearchLink || cheapest.price === 0 || cheapest.price === Infinity)
      ? 'SEARCH ON ' + cheapest.store.label.toUpperCase()
      : 'BUY NOW @ ' + fmt(cheapest.price);
    buyBtn.innerHTML = `<span>${priceText}</span>`;
    console.log('✅ Updated Buy Button:', priceText);
  }
  if (buyBtn2 && cheapest) {
    buyBtn2.href = cheapest.link || '#';
    buyBtn2.textContent = 'VIEW ON ' + cheapest.store.label.toUpperCase();
  }

  // ── Wishlist and Cart Buttons
  const pdpWishlistBtn = document.getElementById('pdpWishlistBtn');
  const pdpCartBtn = document.getElementById('pdpCartBtn');
  const itemStr = encodeURIComponent(JSON.stringify(item));

  if (pdpWishlistBtn) {
    const inWishlist = wishlist.some(w => w.title === item.title);
    pdpWishlistBtn.innerHTML = inWishlist ? '<i class="fas fa-heart" style="color:red;"></i>' : '<i class="far fa-heart"></i>';
    pdpWishlistBtn.onclick = (e) => {
      toggleWishlist(e, itemStr);
      const isNowInWishlist = wishlist.some(w => w.title === item.title);
      pdpWishlistBtn.innerHTML = isNowInWishlist ? '<i class="fas fa-heart" style="color:red;"></i>' : '<i class="far fa-heart"></i>';
    };
  }

  if (pdpCartBtn) {
    pdpCartBtn.onclick = (e) => addToCart(e, itemStr);
  }


  // ── Reviews Population
  var reviewsList = document.getElementById('pdpReviewsList');
  if (reviewsList) {
    const syntheticReviews = generateSyntheticReviews(item.title, item.rating || 4.5, 3);
    reviewsList.innerHTML = syntheticReviews.map(rev => {
      let stars = '';
      for (let i = 0; i < rev.rating; i++) stars += '⭐';
      return `
        <div class="review-item">
          <div class="review-header">
            <div class="review-author">
              <div class="review-author-avatar">${rev.initial}</div>
              <span>${rev.author}</span>
              <span class="review-store-badge">via ${rev.store}</span>
            </div>
            <div class="review-date">${rev.date}</div>
          </div>
          <div class="review-rating">${stars}</div>
          <div class="review-text">${rev.text}</div>
        </div>`;
    }).join('');
  }

  // ── Price Insights
  var insight = document.getElementById('priceInsight');
  if (insight && !cheapest.isSearchLink) {
    var minHistory = Infinity;
    if (productData && productData.priceHistory) {
      Object.values(productData.priceHistory).forEach(h => {
        h.forEach(e => { if (e.price < minHistory) minHistory = e.price; });
      });
    }

    if (cheapest.price <= minHistory) {
      insight.innerHTML = '<i class="fas fa-chart-line"></i> Great Price! This is the lowest recorded price for this product.';
    } else {
      var diff = cheapest.price - minHistory;
      insight.innerHTML = '<i class="fas fa-info-circle"></i> The lowest recorded price was ' + fmt(minHistory) + ' (' + fmt(diff) + ' less than now).';
    }
  }

  // ── Price chart (only show real-priced stores)
  const pcc = document.getElementById('priceChartCompare');
  if (pcc) {
    if (realStores.length > 0) {
      var minP = realStores[0].price;
      var maxP = realStores[realStores.length - 1].price;
      var scale = function (v) { return 30 + ((v - minP) / Math.max(1, maxP - minP)) * 60; };

      var cHtml = '<div style="margin-bottom:.6rem;font-size:.9rem;font-weight:700;color:var(--text-main,#111827);">' +
        'Price comparison across stores</div>';

      realStores.forEach(function (s) {
        var w = Math.max(30, scale(s.price));
        var isBest = s.price === minP;
        cHtml += '<div class="chart-bar">' +
          '<div class="bar" style="width:' + w + '%;background:linear-gradient(90deg,' + s.store.barColor + ',' + s.store.barColor + 'bb);color:#fff;">' +
          fmt(s.price) + '</div>' +
          '<span class="label">' + s.store.label + (isBest ? ' \u2713 Best' : '') + '</span></div>';
      });

      pcc.innerHTML = cHtml;
    } else {
      pcc.innerHTML =
        '<p style="color:var(--text-muted,#64748b);font-size:0.9rem;">Price comparison not available. Click store links to check live prices.</p>';
    }
  }

  // ── Store comparison rows (Flipkart-style)
  var slc = document.getElementById('storeLinksCompare');
  if (slc) {
    var slcHtml = '';
    stores.forEach(function (s, idx) {
      var isBest = !s.isSearchLink && realStores.length > 0 && s.price === realStores[0].price;
      var priceLabel = s.isSearchLink ? 'Check Price' : fmt(s.price);
      var rowBg = isBest ? '#f0fdf4' : '#fff';
      var rowBorder = isBest ? '2px solid #22c55e' : '1px solid #f1f5f9';

      slcHtml += '<a href="' + s.link + '" target="_blank" rel="noopener noreferrer" style="display:flex;align-items:center;gap:.8rem;padding:.8rem 1rem;background:' + rowBg + ';border:' + rowBorder + ';border-radius:10px;text-decoration:none;transition:box-shadow .15s,transform .15s;"' +
        ' onmouseover="this.style.boxShadow=\'0 4px 16px rgba(0,0,0,.1)\';this.style.transform=\'translateY(-1px)\'"' +
        ' onmouseout="this.style.boxShadow=\'none\';this.style.transform=\'none\'">' +
        '<img src="' + s.store.logo + '" alt="' + s.store.label + '" style="width:32px;height:32px;object-fit:contain;border-radius:6px;border:1px solid #e2e8f0;padding:2px;" onerror="this.style.display=\'none\'" />' +
        '<div style="flex:1;">' +
        '<div style="font-weight:700;color:#212121;font-size:.9rem;">' + s.store.label + (isBest ? ' <span style="background:#22c55e;color:#fff;padding:1px 6px;border-radius:4px;font-size:.7rem;margin-left:6px;">BEST PRICE</span>' : '') + '</div>' +
        '<div style="font-size:.75rem;color:#878787;">' + (s.isSearchLink ? 'Click to check availability' : 'In stock • Free delivery') + '</div>' +
        '</div>' +
        '<div style="text-align:right;">' +
        '<div style="font-weight:800;color:' + (isBest ? '#16a34a' : '#212121') + ';font-size:1.05rem;">' + priceLabel + '</div>' +
        '</div>' +
        '<span style="background:' + s.store.barColor + ';color:#fff;padding:.35rem .7rem;border-radius:8px;font-size:.75rem;font-weight:700;white-space:nowrap;">GO →</span>' +
        '</a>';
    });
    slc.innerHTML = slcHtml;
  }

  // Update second buy button
  var buyBtn2 = document.getElementById('buyLowestBtn2');
  if (buyBtn2 && cheapest) {
    buyBtn2.href = cheapest.link || '#';
  }

  // ── Price history chart
  const historyData = generateSyntheticHistory(item);
  item.priceHistory = historyData;
  renderPriceHistory(item, item);
}

// ── Global back navigation (screen by screen) ──
function goBackView() {
  const comparePage = document.getElementById('comparePage');
  const searchPage = document.getElementById('searchPage');
  const wishlistPage = document.getElementById('wishlistPage');
  const cartPage = document.getElementById('cartPage');

  if (comparePage && comparePage.style.display !== 'none') {
    comparePage.style.display = 'none';
    searchPage.style.display = 'block';
    return;
  }

  if (wishlistPage && wishlistPage.style.display !== 'none') {
    wishlistPage.style.display = 'none';
    showHomePage();
    return;
  }

  if (cartPage && cartPage.style.display !== 'none') {
    cartPage.style.display = 'none';
    showHomePage();
    return;
  }

  showHomePage();
}

// Back button on PDP page
const backButton = document.getElementById('backButton');
if (backButton) {
  backButton.addEventListener('click', () => {
    goBackView();
  });
}

// ── Event listeners ────────────────────────────────────────────────────────
async function triggerSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    showHomePage();
    return;
  }
  showResultsPage();

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
  loadState();
  setTimeout(() => {
    hideSplash();
    showHomePage();
  }, 1000);
}

// Ensure DOM is loaded before running
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Last resort failsafe: hide splash after 3 seconds regardless
setTimeout(() => {
  const splash = document.getElementById('splashScreen');
  if (splash && !splash.classList.contains('hidden')) {
    console.log('🛡️ Failsafe triggered: hiding splash screen');
    hideSplash();
  }
}, 3000);

// ── Extract by URL Logic ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const extractBtn = document.getElementById('extractBtn');
  const linkInput = document.getElementById('linkInput');
  const extractStatus = document.getElementById('extractStatus');

  if (extractBtn && linkInput) {
    extractBtn.addEventListener('click', async () => {
      const url = linkInput.value.trim();
      if (!url) {
        extractStatus.textContent = 'Please paste a valid URL first.';
        extractStatus.style.color = '#ef4444';
        return;
      }

      if (!url.startsWith('http')) {
        extractStatus.textContent = 'Invalid URL. Must start with http:// or https://';
        extractStatus.style.color = '#ef4444';
        return;
      }

      extractStatus.textContent = '⏳ Fetching product details...';
      extractStatus.style.color = '#3b82f6';
      extractBtn.disabled = true;

      try {
        const res = await fetch(`${API_URL}/api/extract?url=${encodeURIComponent(url)}`);
        const data = await res.json();

        if (data.success && data.title) {
          extractStatus.textContent = `✅ Found: ${data.title}. Searching...`;
          extractStatus.style.color = '#10b981';

          // Trigger search with the extracted title
          setTimeout(() => {
            searchInput.value = data.title;
            fetchPrices(data.title);
            extractBtn.disabled = false;
            linkInput.value = '';
            extractStatus.textContent = '';
          }, 1500);
        } else {
          throw new Error(data.error || 'Could not find product on this page');
        }
      } catch (err) {
        extractStatus.textContent = `❌ Error: ${err.message}`;
        extractStatus.style.color = '#ef4444';
        extractBtn.disabled = false;
      }
    });
  }
});

// ── Storefront Logic (Flipkart Style) ──────────────────────────────────────
function getBrandEmoji(brand) {
  const b = brand.toLowerCase();
  if (b.includes('iphone') || b.includes('apple')) return '🍎';
  if (b.includes('samsung')) return '🌌';
  if (b.includes('oneplus')) return '➕';
  if (b.includes('redmi') || b.includes('xiaomi')) return '📱';
  if (b.includes('google') || b.includes('pixel')) return '🔍';
  if (b.includes('dell')) return '💻';
  if (b.includes('hp')) return '🎨';
  if (b.includes('lenovo')) return '📐';
  if (b.includes('asus')) return '⚡';
  return '📦';
}

function getBrandGradient(brand) {
  const b = brand.toLowerCase();
  if (b.includes('iphone') || b.includes('apple')) return 'linear-gradient(135deg, #1c1c1e, #3a3a3c)';
  if (b.includes('samsung')) return 'linear-gradient(135deg, #1428a0, #1e88e5)';
  if (b.includes('oneplus')) return 'linear-gradient(135deg, #eb0029, #ff4a5a)';
  if (b.includes('redmi') || b.includes('xiaomi')) return 'linear-gradient(135deg, #ff6900, #ffae3c)';
  if (b.includes('google') || b.includes('pixel')) return 'linear-gradient(135deg, #4285f4, #34a853)';
  if (b.includes('dell')) return 'linear-gradient(135deg, #007db8, #00b0ea)';
  if (b.includes('asus')) return 'linear-gradient(135deg, #1a1a2e, #ff3d00)';
  return 'linear-gradient(135deg, #334155, #475569)';
}

function buildStorefrontRow(title, items) {
  const catKey = title.toLowerCase().includes('mobile') ? 'mobiles' : 'laptops';
  let html = '<div class="storefront-row-title">' + title +
    '<span class="view-all-link" onclick="fetchCategory(\'' + catKey + '\')">View All &gt;</span></div>' +
    '<div class="horizontal-scroll-container">';

  items.slice(0, 10).forEach(item => {
    const storePrices = [item.amazon, item.flipkart, item.reliance, item.croma, item.tatacliq].filter(p => p && p > 0);
    const minPrice = storePrices.length > 0 ? Math.min(...storePrices) : (item.price || 0);
    const priceStr = '₹' + minPrice.toLocaleString('en-IN');
    const emoji = getBrandEmoji(item.brand);
    const gradient = getBrandGradient(item.brand);
    const safeBrand = item.brand.replace(/'/g, '');

    html += '<div class="storefront-product-card" onclick="searchQuery(\'' + safeBrand + '\')">' +
      '<div class="storefront-card-img" style="background: ' + gradient + ';">' +
      '<span class="storefront-card-emoji">' + emoji + '</span></div>' +
      '<div class="storefront-card-body">' +
      '<div class="storefront-card-name">' + item.brand + '</div>' +
      '<div class="storefront-card-price">From ' + priceStr + '</div>' +
      '</div></div>';
  });

  html += '</div>';
  return html;
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  loadState();

  // Handle Routing via Hash
  const hash = window.location.hash;
  if (hash === '#wishlist') {
    showWishlistPage();
  } else if (hash === '#cart') {
    showCartPage();
  } else {
    // Check for query param
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) {
      if (searchInput) searchInput.value = q;
      fetchPrices(q);
      showResultsPage();
    } else {
      showHomePage();
    }
  }

  // Listen for hash changes (for back button/navigation)
  window.addEventListener('hashchange', () => {
    const newHash = window.location.hash;
    if (newHash === '#wishlist') showWishlistPage();
    else if (newHash === '#cart') showCartPage();
    else if (newHash === '' || newHash === '#home') showHomePage();
  });

  // Theme Toggle Listener
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateBadges(); // Refresh icon
    });
  }
});

/**
 * Global search helper for category navigation
 */
window.searchQuery = function (q) {
  const input = document.getElementById('searchInput');
  const catFilter = document.getElementById('categoryFilter');

  if (input) input.value = q;

  if (catFilter) {
    const val = q.toLowerCase();
    // Map 'Television' or 'TVs' to 'television'
    if (val.includes('tv') || val.includes('television')) {
      catFilter.value = 'television';
    } else if (['mobiles', 'laptops', 'fashion', 'home', 'toys', 'grocery'].includes(val)) {
      catFilter.value = val;
    } else {
      catFilter.value = 'all';
    }
  }

  // Trigger search logic directly
  if (typeof triggerSearch === 'function') {
    triggerSearch();
  }
};


/**
 * Helper to update main image from gallery
 */
function updatePdpImage(src, thumb) {
  const mainImg = document.getElementById('compareProductImg');
  if (mainImg) mainImg.src = src;

  document.querySelectorAll('.pdp-thumb').forEach(t => t.classList.remove('active'));
  if (thumb) thumb.classList.add('active');
}

// -- Synthetic Data Helpers -----------------------------------------------
function generateSyntheticHistory(item) {
  const history = {};
  const now = new Date();
  
  STORES.forEach(store => {
    const prices = [];
    // Use the actual current price for this store if available in variants
    const variant = item.storeVariants ? item.storeVariants[store.key] : null;
    let basePrice = (variant && variant.price > 0) ? variant.price : (item.price || 50000);
    
    // Add some random offset if it's a fallback store (to differentiate the lines)
    if (!variant || variant.price <= 0 || variant.isSearchLink) {
      // Differentiate stores that don't have a real price yet
      const seed = store.key.length * 1000;
      const offset = (Math.sin(seed) * 2000); 
      basePrice += offset;
    }

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - (i * 12));
      
      // Seeded random for consistency within the same product
      const seed = (item.title.length + store.key.length + i) * 100;
      const variation = (Math.sin(seed) * 0.08); // -8% to +8%
      
      prices.push({
        date: date.toISOString().split('T')[0],
        price: Math.max(100, Math.round(basePrice * (1 + variation)))
      });
    }
    history[store.key] = prices;
  });
  return history;
}

function generateSyntheticReviews(title, baseRating, count) {
  const reviews = [];
  const authors = [
    { name: 'Aarav Sharma', initial: 'A' },
    { name: 'Priya Patel', initial: 'P' },
    { name: 'Rahul Kumar', initial: 'R' },
    { name: 'Sanya Gupta', initial: 'S' },
    { name: 'Vikram Singh', initial: 'V' }
  ];
  const templates = [
    'Excellent product, highly recommended!',
    'Good value for money. The performance is top-notch.',
    'Very happy with the purchase. Fast delivery too.',
    'Great features and sleek design. Five stars!',
    'Worth every penny. The build quality is amazing.'
  ];
  const stores = ['Amazon', 'Flipkart', 'Croma', 'Reliance Digital'];

  for (let i = 0; i < count; i++) {
    const author = authors[i % authors.length];
    reviews.push({
      author: author.name,
      initial: author.initial,
      rating: Math.floor(baseRating) + (Math.random() > 0.5 ? 0 : -1),
      date: '2024-04-' + (10 + i),
      text: templates[i % templates.length],
      store: stores[i % stores.length]
    });
  }
  return reviews;
}
