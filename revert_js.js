const fs = require('fs');
let js = fs.readFileSync('testp.js', 'utf8');

// ===== A. RESTORE renderCards =====
const rcStart = js.indexOf('function renderCards(items) {');
const rcEnd = js.indexOf('  // Handle view deal button clicks');

if (rcStart === -1 || rcEnd === -1) {
  console.log('renderCards markers not found:', rcStart, rcEnd);
  process.exit(1);
}

const originalRenderCards = `function renderCards(items) {
  if (!resultsList) {
    console.warn('Results list element not found');
    return;
  }

  // Store colors & logos for the price table
  const storeInfo = {};
  STORES.forEach(s => { storeInfo[s.key] = s; });

  let html = \`
    <div class="stack" style="margin-bottom:.75rem;">
      <span class="pill">Results: \${items.length}</span>
      <span class="pill">Comparing \${STORES.length} stores \\u00b7 sorted by lowest price</span>
    </div>
    <div class="results-grid">\`;

  items.forEach((item, idx) => {
    // Check if this product has price history data
    const pData = productDataMap[item.title];
    const hasHistory = pData && (pData.priceHistory || pData.amazon || pData.flipkart);

    // Build ALL 5 store price rows — sorted cheapest first
    const allStoreRows = [];
    STORES.forEach(store => {
      const variant = item.storeVariants?.[store.key];
      if (variant) {
        allStoreRows.push({
          key: store.key,
          label: store.label,
          price: variant.price,
          priceStr: variant.priceStr || fmt(variant.price),
          link: variant.link || '#',
          barColor: store.barColor,
          logo: store.logo,
          available: true,
        });
      } else {
        allStoreRows.push({
          key: store.key,
          label: store.label,
          price: Infinity,
          priceStr: '\\u2014',
          link: '#',
          barColor: store.barColor,
          logo: store.logo,
          available: false,
        });
      }
    });
    allStoreRows.sort((a, b) => a.price - b.price);

    const cheapestPrice = allStoreRows[0]?.price;
    const cheapestLink = allStoreRows[0]?.link || '#';
    const cheapestStore = allStoreRows[0]?.label || '';
    const availableCount = allStoreRows.filter(r => r.available).length;

    // Build price table HTML
    let priceTableHtml = \`
      <div style="margin-top:.6rem; border-top:1.5px solid #e2e8f0; padding-top:.6rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:.5rem;">
          <span style="font-size:.82rem; font-weight:700; color:#334155;">\\uD83D\\uDCB0 Price from all stores</span>
          <span style="font-size:.72rem; color:#64748b; background:#f1f5f9; padding:.15rem .5rem; border-radius:10px;">
            \${availableCount} of \${STORES.length} stores
          </span>
        </div>\`;

    allStoreRows.forEach(row => {
      const isCheapest = row.available && row.price === cheapestPrice;
      const rowBg = isCheapest
        ? 'background:linear-gradient(90deg,#d1fae5,#ecfdf5); border:1.5px solid #34d399;'
        : row.available
          ? 'background:#f8fafc; border:1px solid #e2e8f0;'
          : 'background:#f9fafb; border:1px solid #f1f5f9; opacity:.55;';

      const priceColor = isCheapest ? 'color:#047857; font-size:1rem;' : row.available ? 'color:#1e293b;' : 'color:#94a3b8;';
      const labelWeight = isCheapest ? 'font-weight:800;' : 'font-weight:500;';

      priceTableHtml += \`
        <div style="display:flex; align-items:center; justify-content:space-between; padding:.45rem .6rem;
                    border-radius:8px; margin-bottom:.35rem; \${rowBg} transition:transform .15s;"
             \${row.available ? \`onmouseenter="this.style.transform='scale(1.02)'" onmouseleave="this.style.transform='scale(1)'"\` : ''}>
          <div style="display:flex; align-items:center; gap:.45rem; min-width:0;">
            <img src="\${row.logo}" alt="\${row.label}" style="width:20px; height:20px; object-fit:contain; border-radius:3px; flex-shrink:0;" onerror="this.style.display='none'" />
            <span style="font-size:.82rem; \${labelWeight} color:#334155; white-space:nowrap;">\${row.label}</span>
            \${isCheapest ? '<span style="font-size:.65rem; background:#059669; color:white; padding:.1rem .4rem; border-radius:6px; font-weight:700; margin-left:.3rem;">LOWEST</span>' : ''}
          </div>
          <div style="display:flex; align-items:center; gap:.5rem;">
            <span style="font-weight:700; font-size:.88rem; \${priceColor}">
              \${row.available ? row.priceStr : 'N/A'}
            </span>
            \${row.available ? \`<a href="\${row.link}" target="_blank" rel="noopener noreferrer" class="store-visit-link"
               onclick="event.stopPropagation()"
               style="font-size:.7rem; color:#2563eb; text-decoration:none; font-weight:600; padding:.15rem .4rem;
                      border:1px solid #bfdbfe; border-radius:6px; white-space:nowrap;
                      transition:background .15s;"
               onmouseenter="this.style.background='#eff6ff'" onmouseleave="this.style.background='transparent'">
              Visit \\u2197
            </a>\` : ''}
          </div>
        </div>\`;
    });

    priceTableHtml += '</div>';

    // Savings badge
    const sortedAvailable = allStoreRows.filter(r => r.available);
    let savingsHtml = '';
    if (sortedAvailable.length >= 2) {
      const maxPrice = sortedAvailable[sortedAvailable.length - 1].price;
      const savings = maxPrice - cheapestPrice;
      if (savings > 0) {
        savingsHtml = \`<div style="margin-top:.4rem; padding:.35rem .6rem; background:linear-gradient(90deg,#fef3c7,#fffbeb);
                        border:1px solid #fbbf24; border-radius:8px; font-size:.78rem; color:#92400e; font-weight:600; text-align:center;">
          \\uD83D\\uDCB8 You save \${fmt(savings)} by buying from \${cheapestStore} vs \${sortedAvailable[sortedAvailable.length-1].label}
        </div>\`;
      }
    }

    // Product image with proxy
    let imgSrc = item.thumbnail || '';
    if (imgSrc && !imgSrc.startsWith('/api/image-proxy')) {
      imgSrc = '/api/image-proxy?url=' + encodeURIComponent(imgSrc);
    }

    html += \`
      <div class="product-card" data-index="\${idx}" style="position:relative;">
        <img class="product-thumb"
             src="\${imgSrc}"
             onerror="this.src='https://placehold.co/120x120/f1f5f9/94a3b8?text=No+Image'"
             alt="\${item.title}" loading="lazy" />
        <div class="product-card-body">
          <div class="product-card-title">\${item.title}</div>
          <div style="display:flex; align-items:center; gap:.5rem; margin-bottom:.3rem; flex-wrap:wrap;">
            <div class="product-card-price" style="margin:0;">\${fmt(cheapestPrice)}</div>
            <span style="font-size:.78rem; color:#059669; font-weight:700; background:#ecfdf5; padding:.15rem .5rem; border-radius:8px;">
              Lowest on \${cheapestStore}
            </span>
          </div>
          \${item.rating ? \`<div class="product-card-rating">\\u2B50 \${item.rating}\${item.reviews ? \` (\${item.reviews})\` : ''}</div>\` : ''}
          \${hasHistory ? \`<div class="price-history-badge">\\uD83D\\uDCC8 Price History Available</div>\` : ''}
          \${priceTableHtml}
          \${savingsHtml}
          <a class="view-deal-btn" href="\${cheapestLink}" target="_blank" rel="noopener noreferrer"
             style="margin-top:.6rem; text-align:center; background:linear-gradient(90deg,#059669,#10b981); font-weight:800;">
            \\uD83D\\uDED2 Buy at Lowest Price \\u2014 \${cheapestStore} \\u2192
          </a>
        </div>
      </div>\`;
  });

  html += '</div>';
  resultsList.innerHTML = html;

  // Click card \\u2192 compare page
  resultsList.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.view-deal-btn') || e.target.closest('.store-visit-link')) return;
      showComparePage(currentResults[Number(card.dataset.index)]);
    });
  });

`;

js = js.substring(0, rcStart) + originalRenderCards + js.substring(rcEnd);
console.log('renderCards restored');

// ===== B. RESTORE showComparePage =====
const scpStart = js.indexOf('// \\u2500\\u2500 Compare page');
const scpEnd = js.indexOf('// Back button with safety check');

if (scpStart === -1 || scpEnd === -1) {
  console.log('showComparePage markers not found:', scpStart, scpEnd);
  process.exit(1);
}

const originalShowCompare = `// \\u2500\\u2500 Compare page \\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500\\u2500
function showComparePage(item) {
  document.getElementById('searchPage').style.display = 'none';
  document.getElementById('comparePage').style.display = 'block';
  window.scrollTo(0, 0);

  document.getElementById('compareTitle').textContent = item.title;

  // Get prices for THIS specific item from its storeVariants
  var stores = [];
  STORES.forEach(function(store) {
    var variant = item.storeVariants ? item.storeVariants[store.key] : null;
    if (variant) {
      stores.push({ price: variant.price, priceStr: variant.priceStr || fmt(variant.price), link: variant.link || '#', store: store });
    }
  });
  if (stores.length === 0) {
    stores.push({ price: item.price || 0, priceStr: item.priceStr, link: item.link || '#', store: item.store });
  }
  stores.sort(function(a, b) { return a.price - b.price; });
  var cheapest = stores[0];
  
  document.getElementById('compareSummary').innerHTML = 
    'Best price: <strong style="color:#059669;">' + fmt(cheapest.price) + '</strong> on <strong>' + cheapest.store.label + '</strong>';

  // \\u2500\\u2500 Product Image with proxy
  var productData = productDataMap[item.title];
  var imgEl = document.getElementById('compareProductImg');
  var imgSrc = productData && productData.specs && productData.specs.image ? productData.specs.image : '';
  if (imgEl) {
    if (imgSrc) {
      imgEl.src = '/api/image-proxy?url=' + encodeURIComponent(imgSrc);
    } else {
      var emoji = getBrandEmoji(item.title);
      var gradient = getBrandGradient(item.title);
      imgEl.parentElement.innerHTML = '<div style="width:100%;height:200px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:' + gradient + ';"><span style="font-size:4rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>';
    }
  }

  // \\u2500\\u2500 Specs Table
  var specsWrap = document.getElementById('specsTableWrap');
  if (specsWrap) {
    if (productData && productData.specs && productData.specs.details) {
      var specParts = productData.specs.details.split(' \\u2022 ');
      var specHtml = '<table style="width:100%;border-collapse:collapse;font-size:0.9rem;">';
      specParts.forEach(function(part) {
        var kv = part.split(': ');
        if (kv.length >= 2) {
          specHtml += '<tr style="border-bottom:1px solid var(--border-color,#e2e8f0);">' +
            '<td style="padding:0.5rem 0.8rem;font-weight:700;color:var(--text-muted,#64748b);width:35%;">' + kv[0] + '</td>' +
            '<td style="padding:0.5rem 0.8rem;color:var(--text-main,#1e293b);font-weight:600;">' + kv.slice(1).join(': ') + '</td></tr>';
        }
      });
      specHtml += '</table>';
      specsWrap.innerHTML = specHtml;
    } else {
      specsWrap.innerHTML = '<p style="color:var(--text-muted,#64748b);font-size:0.9rem;">No detailed specs available.</p>';
    }
  }

  // \\u2500\\u2500 Buy at Lowest Price button
  var buyBtn = document.getElementById('buyLowestBtn');
  var lowestLabel = document.getElementById('lowestPriceLabel');
  if (buyBtn && cheapest) {
    buyBtn.href = cheapest.link || '#';
    lowestLabel.textContent = fmt(cheapest.price) + ' on ' + cheapest.store.label;
  }

  // \\u2500\\u2500 Price chart
  var minP = stores[0] ? stores[0].price : 0;
  var maxP = stores[stores.length - 1] ? stores[stores.length - 1].price : 1;
  var scale = function(v) { return 30 + ((v - minP) / Math.max(1, maxP - minP)) * 60; };

  var cHtml = '<div style="margin-bottom:.6rem;font-size:.9rem;font-weight:700;color:var(--text-main,#111827);">' +
    'Best price from each store</div>';

  stores.forEach(function(s) {
    var w = Math.max(30, scale(s.price));
    var isBest = s.price === minP;
    cHtml += '<div class="chart-bar">' +
      '<div class="bar" style="width:' + w + '%;background:linear-gradient(90deg,' + s.store.barColor + ',' + s.store.barColor + 'bb);color:#fff;">' +
      fmt(s.price) + '</div>' +
      '<span class="label">' + s.store.label + (isBest ? ' \\u2713 Best' : '') + '</span></div>';
  });

  document.getElementById('priceChartCompare').innerHTML = cHtml;

  // \\u2500\\u2500 Store link buttons
  var slc = document.getElementById('storeLinksCompare');
  var slcHtml = '<span class="store-links-area-title">View on store:</span>';
  stores.forEach(function(s) {
    slcHtml += '<a class="store-link-btn ' + s.store.cls + '" href="' + s.link + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + s.store.logo + '" alt="' + s.store.label + '" />' +
      '<span>' + s.store.label + ' \\u2014 ' + fmt(s.price) + '</span></a>';
  });
  slc.innerHTML = slcHtml;
  slc.style.display = 'flex';

  // \\u2500\\u2500 Price history chart
  if (productData) {
    if (!productData.priceHistory) {
      productData.priceHistory = generateSyntheticHistory(productData);
    }
    renderPriceHistory(productData, item);
  } else {
    var historyCard = document.getElementById('priceHistoryCard');
    if (historyCard) historyCard.style.display = 'none';
  }

  // \\u2500\\u2500 Customer Reviews (use REAL reviews from data.json first, then synthetic fallback)
  var reviewsContainer = document.getElementById('reviewsList');
  if (reviewsContainer) {
    var reviewsHtml = '';
    var storeNames = {amazon: 'Amazon', flipkart: 'Flipkart', reliance: 'Reliance Digital', croma: 'Croma'};
    var hasRealReviews = false;
    
    if (productData && productData.reviews) {
      Object.keys(productData.reviews).forEach(function(storeKey) {
        var storeReviews = productData.reviews[storeKey];
        if (storeReviews && storeReviews.length > 0) {
          hasRealReviews = true;
          storeReviews.forEach(function(reviewText, idx) {
            var rating = Math.floor(Math.random() * 2) + 4;
            var names = ['Aarav S.', 'Priya M.', 'Rahul K.', 'Anita D.', 'Vikram T.', 'Neha R.', 'Arjun P.', 'Meera B.'];
            var name = names[(reviewText.length + idx) % names.length];
            var stars = '';
            for (var i = 0; i < rating; i++) stars += '\\u2B50';
            reviewsHtml += '<div class="review-item">' +
              '<div class="review-header">' +
              '<div class="review-author">' +
              '<div class="review-author-avatar">' + name.charAt(0) + '</div>' +
              '<span>' + name + '</span>' +
              '<span class="review-store-badge">via ' + (storeNames[storeKey] || storeKey) + '</span>' +
              '</div></div>' +
              '<div class="review-rating">' + stars + '</div>' +
              '<div class="review-text">' + reviewText + '</div></div>';
          });
        }
      });
    }
    
    // Fallback to synthetic reviews if no real ones
    if (!hasRealReviews) {
      var avgRating = item.rating || 4.5;
      var syntheticReviews = generateSyntheticReviews(item.title, avgRating, 3);
      syntheticReviews.forEach(function(rev) {
        var stars = '';
        for (var i = 0; i < rev.rating; i++) stars += '\\u2B50';
        reviewsHtml += '<div class="review-item">' +
          '<div class="review-header"><div class="review-author">' +
          '<div class="review-author-avatar">' + rev.initial + '</div>' +
          '<span>' + rev.author + '</span>' +
          '<span class="review-store-badge">via ' + rev.store + '</span>' +
          '</div><div class="review-date">' + rev.date + '</div></div>' +
          '<div class="review-rating">' + stars + '</div>' +
          '<div class="review-text">' + rev.text + '</div></div>';
      });
    }
    reviewsContainer.innerHTML = reviewsHtml;
  }
}

`;

js = js.substring(0, scpStart) + originalShowCompare + js.substring(scpEnd);
console.log('showComparePage restored');

// ===== C. Verify the search-from-compare fix is still there =====
if (js.includes('comparePage').indexOf('triggerSearch') !== -1 || 
    js.includes("document.getElementById('comparePage').style.display = 'none'")) {
  console.log('Search-from-compare fix is still present');
} else {
  console.log('Note: Search-from-compare fix may need re-applying');
}

fs.writeFileSync('testp.js', js);
console.log('JS revert complete!');
