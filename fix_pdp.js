const fs = require('fs');

// ===== 1. UPDATE HTML =====
let html = fs.readFileSync('index.html', 'utf8');

const htmlOld = `  <!-- ==================== COMPARE PAGE ==================== -->
  <div id="comparePage" class="page" style="display:none;">

    <button id="backButton" class="back-btn back-to-search">\u2190 Back to Search</button>

    <!-- Product Hero -->
    <div id="compareHeader" class="card compare-header-card" style="padding:2rem;">
      <div style="display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap;">
        <!-- Product Image -->
        <div id="compareImage" style="flex:0 0 220px;">
          <div style="background:var(--card-bg,#fff);border-radius:16px;padding:1rem;border:1px solid var(--border-color,#e2e8f0);">
            <img id="compareProductImg" src="" alt="Product" style="width:100%;height:200px;object-fit:contain;" onerror="this.src='https://placehold.co/220x200/f1f5f9/94a3b8?text=No+Image'">
          </div>
        </div>
        <!-- Product Info -->
        <div style="flex:1;min-width:0;">
          <h2 id="compareTitle" class="compare-title" style="margin-bottom:0.5rem;"></h2>
          <div id="compareSummary" class="compare-summary" style="margin-bottom:1rem;"></div>
          
          <!-- Specs Table -->
          <div id="specsTableWrap" style="margin-bottom:1.2rem;"></div>

          <!-- Buy Now CTA -->
          <a id="buyLowestBtn" href="#" target="_blank" rel="noopener noreferrer" style="
            display:inline-flex;align-items:center;gap:0.5rem;
            background:linear-gradient(135deg,#059669,#10b981);color:#fff;
            padding:0.8rem 2rem;border-radius:10px;font-weight:800;font-size:1rem;
            text-decoration:none;box-shadow:0 4px 15px rgba(5,150,105,0.3);
            transition:transform 0.2s;
          " onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
            \uD83D\uDED2 Buy at Lowest Price \u2014 <span id="lowestPriceLabel"></span>
          </a>
        </div>
      </div>
    </div>

    <!-- Store Price Comparison -->
    <div id="graphCardCompare" class="chart-card">
      <div class="chart-title">\uD83D\uDCB0 Price Comparison Across Stores</div>
      <div id="priceChartCompare" class="chart-box"></div>
      <div id="storeLinksCompare" class="store-links-area" style="display:none;"></div>
    </div>

    <!-- Price History -->
    <div id="priceHistoryCard" class="chart-card">
      <div class="chart-title">\uD83D\uDCC8 Price History (Last 2 Months)</div>
      <div id="priceHistoryChart" class="chart-box">
        <svg id="historyChartSvg" class="history-chart-svg"></svg>
      </div>
      <div class="price-insights-box">
        <div class="insights-title">\uD83D\uDCA1 Price Insights</div>
        <div id="priceInsight" class="insights-content"></div>
      </div>
    </div>

    <!-- Customer Reviews Card -->
    <div id="reviewsCard" class="chart-card">
      <div class="chart-title">\uD83D\uDDE3\uFE0F Customer Reviews</div>
      <div id="reviewsList" class="reviews-container"></div>
    </div>

  </div><!-- /comparePage -->`;

const htmlNew = `  <!-- ==================== COMPARE PAGE (Flipkart-style) ==================== -->
  <div id="comparePage" class="page" style="display:none;">

    <button id="backButton" class="back-btn back-to-search">\u2190 Back to Search</button>

    <div class="pdp-container">
      <!-- LEFT: Product Image -->
      <div class="pdp-left">
        <div class="pdp-image-box">
          <img id="compareProductImg" src="" alt="Product" onerror="this.src='https://placehold.co/400x400/f8fafc/94a3b8?text=No+Image'">
        </div>
        <div class="pdp-actions">
          <a id="buyLowestBtn" href="#" target="_blank" rel="noopener noreferrer" class="pdp-buy-btn">
            \uD83D\uDED2 Buy at Lowest Price
          </a>
        </div>
      </div>

      <!-- RIGHT: Product Details -->
      <div class="pdp-right">
        <h1 id="compareTitle" class="pdp-title"></h1>
        <div id="pdpRating" class="pdp-rating"></div>
        <div id="pdpPriceRow" class="pdp-price-row"></div>

        <!-- Store Price Comparison -->
        <div class="pdp-section">
          <div class="pdp-section-title">\uD83C\uDFE2 Available at</div>
          <div id="storeLinksCompare" class="pdp-store-list"></div>
        </div>

        <!-- Product Highlights -->
        <div class="pdp-section">
          <div class="pdp-section-title">Product highlights</div>
          <div id="specsTableWrap" class="pdp-highlights"></div>
        </div>

        <!-- Price Chart -->
        <div class="pdp-section">
          <div class="pdp-section-title">\uD83D\uDCB0 Price Comparison</div>
          <div id="priceChartCompare"></div>
        </div>
      </div>
    </div>

    <!-- Price History -->
    <div id="priceHistoryCard" class="chart-card" style="margin-top:1rem;">
      <div class="chart-title">\uD83D\uDCC8 Price History (Last 2 Months)</div>
      <div id="priceHistoryChart" class="chart-box">
        <svg id="historyChartSvg" class="history-chart-svg"></svg>
      </div>
      <div class="price-insights-box">
        <div class="insights-title">\uD83D\uDCA1 Price Insights</div>
        <div id="priceInsight" class="insights-content"></div>
      </div>
    </div>

    <!-- Customer Reviews -->
    <div id="reviewsCard" class="chart-card">
      <div class="chart-title">\uD83D\uDDE3\uFE0F Customer Reviews</div>
      <div id="reviewsList" class="reviews-container"></div>
    </div>

  </div><!-- /comparePage -->`;

if (html.includes('<!-- ==================== COMPARE PAGE ====================')) {
  const startIdx = html.indexOf('  <!-- ==================== COMPARE PAGE');
  const endIdx = html.indexOf('</div><!-- /comparePage -->') + '</div><!-- /comparePage -->'.length;
  html = html.substring(0, startIdx) + htmlNew + html.substring(endIdx);
  fs.writeFileSync('index.html', html);
  console.log('HTML updated!');
} else {
  console.log('Could not find compare page HTML');
}

// ===== 2. UPDATE CSS - Append PDP styles =====
let css = fs.readFileSync('testp.css', 'utf8');
const pdpCSS = `
/* ===== Product Detail Page (Flipkart-style) ===== */
.pdp-container {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  background: var(--card-bg, #fff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 12px;
  padding: 0;
  overflow: hidden;
}

.pdp-left {
  flex: 0 0 360px;
  position: sticky;
  top: 80px;
  padding: 1.5rem;
  border-right: 1px solid var(--border-color, #f1f5f9);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.pdp-image-box {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
}

[data-theme="dark"] .pdp-image-box { background: #1e293b; border-color: #334155; }

.pdp-image-box img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

.pdp-actions {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.pdp-buy-btn {
  display: block;
  width: 100%;
  padding: 0.9rem;
  text-align: center;
  background: linear-gradient(135deg, #fb641b, #ff9f00);
  color: #fff;
  font-weight: 800;
  font-size: 1rem;
  border-radius: 8px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(251,100,27,0.3);
  transition: transform 0.2s, box-shadow 0.2s;
}
.pdp-buy-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(251,100,27,0.4); }

.pdp-right {
  flex: 1;
  min-width: 0;
  padding: 1.5rem 1.5rem 1.5rem 0;
}

.pdp-title {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--text-main, #111827);
  line-height: 1.5;
  margin: 0 0 0.5rem 0;
}

.pdp-rating {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
}

.pdp-rating-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  background: #388e3c;
  color: #fff;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
}

.pdp-rating-count {
  font-size: 0.85rem;
  color: var(--text-muted, #64748b);
}

.pdp-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.pdp-price-current {
  font-size: 1.8rem;
  font-weight: 900;
  color: var(--text-main, #111827);
}

.pdp-price-mrp {
  font-size: 1rem;
  color: #9ca3af;
  text-decoration: line-through;
}

.pdp-price-discount {
  font-size: 0.9rem;
  color: #388e3c;
  font-weight: 700;
}

.pdp-section {
  margin-bottom: 1.2rem;
  padding-bottom: 1.2rem;
  border-bottom: 1px solid var(--border-color, #f1f5f9);
}

.pdp-section-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-main, #111827);
  margin-bottom: 0.7rem;
}

.pdp-store-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.pdp-store-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0.8rem;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--card-bg, #fafafa);
  transition: box-shadow 0.2s;
}
.pdp-store-item:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
.pdp-store-item-best { border-color: #34d399; background: #ecfdf5; }
[data-theme="dark"] .pdp-store-item-best { background: rgba(52,211,153,0.1); border-color: #059669; }

.pdp-store-left {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.pdp-store-logo { width: 22px; height: 22px; object-fit: contain; border-radius: 4px; }
.pdp-store-name { font-weight: 600; font-size: 0.88rem; color: var(--text-main, #334155); }
.pdp-store-badge { font-size: 0.65rem; background: #059669; color: #fff; padding: 0.1rem 0.4rem; border-radius: 4px; font-weight: 700; }
.pdp-store-price { font-weight: 800; font-size: 1rem; color: var(--text-main, #111827); }

.pdp-store-visit {
  font-size: 0.78rem;
  color: #2563eb;
  font-weight: 600;
  text-decoration: none;
  padding: 0.3rem 0.7rem;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  transition: background 0.15s;
}
.pdp-store-visit:hover { background: #eff6ff; }

.pdp-highlights ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.pdp-highlights li {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-main, #333);
  border-bottom: 1px solid var(--border-color, #f5f5f5);
}

.pdp-highlights li:last-child { border-bottom: none; }

.pdp-highlight-icon {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 0.85rem;
}
[data-theme="dark"] .pdp-highlight-icon { background: #334155; }

@media (max-width: 768px) {
  .pdp-container { flex-direction: column; }
  .pdp-left { flex: none; width: 100%; position: static; border-right: none; border-bottom: 1px solid var(--border-color, #f1f5f9); }
  .pdp-right { padding: 1rem; }
}
`;

if (!css.includes('.pdp-container')) {
  css += pdpCSS;
  fs.writeFileSync('testp.css', css);
  console.log('CSS updated!');
} else {
  console.log('PDP CSS already exists, skipping.');
}

// ===== 3. UPDATE JS - showComparePage =====
let js = fs.readFileSync('testp.js', 'utf8');

const jsStart = '// \u2500\u2500 Compare page';
const jsEnd = '// Back button with safety check';

const jsStartIdx = js.indexOf(jsStart);
const jsEndIdx = js.indexOf(jsEnd);

if (jsStartIdx === -1 || jsEndIdx === -1) {
  console.log('JS markers not found:', jsStartIdx, jsEndIdx);
  process.exit(1);
}

const newJS = `// \u2500\u2500 Compare page (Flipkart-style PDP) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
function showComparePage(item) {
  document.getElementById('searchPage').style.display = 'none';
  document.getElementById('comparePage').style.display = 'block';
  window.scrollTo(0, 0);

  // Title
  document.getElementById('compareTitle').textContent = item.title;

  // Stores sorted by price
  var stores = Object.values(bestPerStore).sort(function(a, b) { return a.price - b.price; });
  var cheapest = stores[0];
  var productData = productDataMap[item.title];

  // Product Image
  var imgEl = document.getElementById('compareProductImg');
  var imgSrc = productData && productData.specs && productData.specs.image ? productData.specs.image : '';
  if (imgEl) {
    if (imgSrc) {
      imgEl.src = imgSrc;
    } else {
      var emoji = getBrandEmoji(item.title);
      var gradient = getBrandGradient(item.title);
      imgEl.parentElement.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:' + gradient + ';border-radius:12px;"><span style="font-size:5rem;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));">' + emoji + '</span></div>';
    }
  }

  // Rating
  var ratingEl = document.getElementById('pdpRating');
  if (ratingEl) {
    var rating = item.rating || '4.5';
    var reviews = item.reviews || '112';
    ratingEl.innerHTML = '<span class="pdp-rating-badge">' + rating + ' \\u2605</span>' +
      '<span class="pdp-rating-count">' + reviews + ' Ratings & Reviews</span>';
  }

  // Price row
  var priceRowEl = document.getElementById('pdpPriceRow');
  if (priceRowEl && cheapest) {
    var mrp = stores.length > 1 ? stores[stores.length - 1].price : cheapest.price;
    var discount = mrp > cheapest.price ? Math.round(((mrp - cheapest.price) / mrp) * 100) : 0;
    priceRowEl.innerHTML = (discount > 0 ? '<span class="pdp-price-discount">\\u2193' + discount + '%</span>' : '') +
      (discount > 0 ? '<span class="pdp-price-mrp">' + fmt(mrp) + '</span>' : '') +
      '<span class="pdp-price-current">' + fmt(cheapest.price) + '</span>';
  }

  // Buy button
  var buyBtn = document.getElementById('buyLowestBtn');
  if (buyBtn && cheapest) {
    buyBtn.href = cheapest.link || '#';
    buyBtn.innerHTML = '\\uD83D\\uDED2 Buy at ' + fmt(cheapest.price) + ' on ' + cheapest.store.label;
  }

  // Store list
  var slc = document.getElementById('storeLinksCompare');
  if (slc) {
    var slcHtml = '';
    stores.forEach(function(s, i) {
      var isBest = i === 0;
      slcHtml += '<div class="pdp-store-item' + (isBest ? ' pdp-store-item-best' : '') + '">' +
        '<div class="pdp-store-left">' +
        '<img class="pdp-store-logo" src="' + s.store.logo + '" alt="' + s.store.label + '" onerror="this.style.display=\\x27none\\x27" />' +
        '<span class="pdp-store-name">' + s.store.label + '</span>' +
        (isBest ? '<span class="pdp-store-badge">LOWEST</span>' : '') +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:0.8rem;">' +
        '<span class="pdp-store-price">' + fmt(s.price) + '</span>' +
        '<a class="pdp-store-visit" href="' + s.link + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">Visit \\u2197</a>' +
        '</div></div>';
    });
    slc.innerHTML = slcHtml;
  }

  // Product Highlights (Specs)
  var specsWrap = document.getElementById('specsTableWrap');
  if (specsWrap) {
    var specIcons = { 'Display': '\\uD83D\\uDCF1', 'CPU': '\\u2699\\uFE0F', 'RAM': '\\uD83E\\uDDE0', 'Storage': '\\uD83D\\uDCBE', 'Camera': '\\uD83D\\uDCF7', 'Rear Camera': '\\uD83D\\uDCF7', 'Battery': '\\uD83D\\uDD0B', 'OS': '\\uD83D\\uDCBB', 'GPU': '\\uD83C\\uDFAE', 'Weight': '\\u2696\\uFE0F' };
    if (productData && productData.specs && productData.specs.details) {
      var specParts = productData.specs.details.split(' \\u2022 ');
      var specHtml = '<ul>';
      specParts.forEach(function(part) {
        var kv = part.split(': ');
        if (kv.length >= 2) {
          var icon = specIcons[kv[0]] || '\\uD83D\\uDD39';
          specHtml += '<li><span class="pdp-highlight-icon">' + icon + '</span><div><strong>' + kv[0] + '</strong><br>' + kv.slice(1).join(': ') + '</div></li>';
        }
      });
      specHtml += '</ul>';
      specsWrap.innerHTML = specHtml;
    } else {
      specsWrap.innerHTML = '<p style="color:var(--text-muted,#64748b);font-size:0.9rem;">Specs not available for this product.</p>';
    }
  }

  // Price chart
  var minP = stores[0] ? stores[0].price : 0;
  var maxP = stores[stores.length - 1] ? stores[stores.length - 1].price : 1;
  var scale = function(v) { return 30 + ((v - minP) / Math.max(1, maxP - minP)) * 60; };
  var cHtml = '';
  stores.forEach(function(s) {
    var w = Math.max(30, scale(s.price));
    var isBest = s.price === minP;
    cHtml += '<div class="chart-bar"><div class="bar" style="width:' + w + '%;background:linear-gradient(90deg,' + s.store.barColor + ',' + s.store.barColor + 'bb);color:#fff;">' + fmt(s.price) + '</div><span class="label">' + s.store.label + (isBest ? ' \\u2713 Best' : '') + '</span></div>';
  });
  document.getElementById('priceChartCompare').innerHTML = cHtml;

  // Price history
  if (productData) {
    if (!productData.priceHistory) { productData.priceHistory = generateSyntheticHistory(productData); }
    renderPriceHistory(productData, item);
  } else {
    var hCard = document.getElementById('priceHistoryCard');
    if (hCard) hCard.style.display = 'none';
  }

  // Customer Reviews
  var reviewsContainer = document.getElementById('reviewsList');
  if (reviewsContainer) {
    var reviewsHtml = '';
    var storeNames = {amazon:'Amazon',flipkart:'Flipkart',reliance:'Reliance Digital',croma:'Croma'};
    var hasReal = false;
    if (productData && productData.reviews) {
      Object.keys(productData.reviews).forEach(function(storeKey) {
        var sr = productData.reviews[storeKey];
        if (sr && sr.length > 0) {
          hasReal = true;
          sr.forEach(function(txt, idx) {
            var rating = Math.floor(Math.random() * 2) + 4;
            var names = ['Aarav S.','Priya M.','Rahul K.','Anita D.','Vikram T.','Neha R.','Arjun P.','Meera B.'];
            var name = names[(txt.length + idx) % names.length];
            var stars = ''; for(var i=0;i<rating;i++) stars+='\\u2B50';
            reviewsHtml += '<div class="review-item"><div class="review-header"><div class="review-author"><div class="review-author-avatar">'+name.charAt(0)+'</div><span>'+name+'</span><span class="review-store-badge">via '+(storeNames[storeKey]||storeKey)+'</span></div></div><div class="review-rating">'+stars+'</div><div class="review-text">'+txt+'</div></div>';
          });
        }
      });
    }
    if (!hasReal) {
      var synth = generateSyntheticReviews(item.title, item.rating||4.5, 3);
      synth.forEach(function(rev) {
        var stars=''; for(var i=0;i<rev.rating;i++) stars+='\\u2B50';
        reviewsHtml += '<div class="review-item"><div class="review-header"><div class="review-author"><div class="review-author-avatar">'+rev.initial+'</div><span>'+rev.author+'</span><span class="review-store-badge">via '+rev.store+'</span></div></div><div class="review-rating">'+stars+'</div><div class="review-text">'+rev.text+'</div></div>';
      });
    }
    reviewsContainer.innerHTML = reviewsHtml;
  }
}

`;

js = js.substring(0, jsStartIdx) + newJS + js.substring(jsEndIdx);
fs.writeFileSync('testp.js', js);
console.log('JS updated!');
