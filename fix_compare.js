const fs = require('fs');
let content = fs.readFileSync('testp.js', 'utf8');

// Find the showComparePage function and replace it entirely
const startMarker = '// ── Compare page';
const endMarker = '// Back button with safety check';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find markers. Start:', startIdx, 'End:', endIdx);
  process.exit(1);
}

const newFn = `// ── Compare page ───────────────────────────────────────────────────────────
function showComparePage(item) {
  document.getElementById('searchPage').style.display = 'none';
  document.getElementById('comparePage').style.display = 'block';

  document.getElementById('compareTitle').textContent = item.title;

  // Find cheapest store info
  var stores = Object.values(bestPerStore).sort(function(a, b) { return a.price - b.price; });
  var cheapest = stores[0];
  
  document.getElementById('compareSummary').innerHTML = 
    'Best price: <strong style="color:#059669;">' + item.priceStr + '</strong> on <strong>' + item.store.label + '</strong>';

  // ── Product Image (use emoji gradient as reliable fallback)
  var productData = productDataMap[item.title];
  var imgEl = document.getElementById('compareProductImg');
  var imgSrc = productData && productData.specs && productData.specs.image ? productData.specs.image : '';
  if (imgEl) {
    if (imgSrc) {
      imgEl.src = imgSrc;
    } else {
      var emoji = getBrandEmoji(item.title);
      var gradient = getBrandGradient(item.title);
      imgEl.parentElement.innerHTML = '<div style="width:100%;height:200px;display:flex;align-items:center;justify-content:center;border-radius:12px;background:' + gradient + ';"><span style="font-size:4rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>';
    }
  }

  // ── Specs Table
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

  // ── Buy at Lowest Price button
  var buyBtn = document.getElementById('buyLowestBtn');
  var lowestLabel = document.getElementById('lowestPriceLabel');
  if (buyBtn && cheapest) {
    buyBtn.href = cheapest.link || '#';
    lowestLabel.textContent = fmt(cheapest.price) + ' on ' + cheapest.store.label;
  }

  // ── Price chart
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

  // ── Store link buttons
  var slc = document.getElementById('storeLinksCompare');
  var slcHtml = '<span class="store-links-area-title">View on store:</span>';
  stores.forEach(function(s) {
    slcHtml += '<a class="store-link-btn ' + s.store.cls + '" href="' + s.link + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + s.store.logo + '" alt="' + s.store.label + '" />' +
      '<span>' + s.store.label + ' \\u2014 ' + fmt(s.price) + '</span></a>';
  });
  slc.innerHTML = slcHtml;
  slc.style.display = 'flex';

  // ── Price history chart
  if (productData) {
    if (!productData.priceHistory) {
      productData.priceHistory = generateSyntheticHistory(productData);
    }
    renderPriceHistory(productData, item);
  } else {
    var historyCard = document.getElementById('priceHistoryCard');
    if (historyCard) historyCard.style.display = 'none';
  }

  // ── Customer Reviews (use REAL reviews from data.json first, then synthetic fallback)
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

content = content.substring(0, startIdx) + newFn + content.substring(endIdx);
fs.writeFileSync('testp.js', content);
console.log('showComparePage replaced successfully');
