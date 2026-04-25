const fs = require('fs');
let js = fs.readFileSync('testp.js', 'utf8');

const scpStart = js.indexOf('// \u2500\u2500 Compare page');
const scpEnd = js.indexOf('// Back button');

if (scpStart === -1 || scpEnd === -1) {
  console.log('markers not found:', scpStart, scpEnd);
  process.exit(1);
}

const originalShowCompare = `// \u2500\u2500 Compare page \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

  // Product Image with proxy
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

  // Specs Table
  var specsWrap = document.getElementById('specsTableWrap');
  if (specsWrap) {
    if (productData && productData.specs && productData.specs.details) {
      var specParts = productData.specs.details.split(' \u2022 ');
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

  // Buy at Lowest Price button
  var buyBtn = document.getElementById('buyLowestBtn');
  var lowestLabel = document.getElementById('lowestPriceLabel');
  if (buyBtn && cheapest) {
    buyBtn.href = cheapest.link || '#';
    lowestLabel.textContent = fmt(cheapest.price) + ' on ' + cheapest.store.label;
  }

  // Price chart
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
      '<span class="label">' + s.store.label + (isBest ? ' \u2713 Best' : '') + '</span></div>';
  });

  document.getElementById('priceChartCompare').innerHTML = cHtml;

  // Store link buttons
  var slc = document.getElementById('storeLinksCompare');
  var slcHtml = '<span class="store-links-area-title">View on store:</span>';
  stores.forEach(function(s) {
    slcHtml += '<a class="store-link-btn ' + s.store.cls + '" href="' + s.link + '" target="_blank" rel="noopener noreferrer">' +
      '<img src="' + s.store.logo + '" alt="' + s.store.label + '" />' +
      '<span>' + s.store.label + ' \u2014 ' + fmt(s.price) + '</span></a>';
  });
  slc.innerHTML = slcHtml;
  slc.style.display = 'flex';

  // Price history chart
  if (productData) {
    if (!productData.priceHistory) {
      productData.priceHistory = generateSyntheticHistory(productData);
    }
    renderPriceHistory(productData, item);
  } else {
    var historyCard = document.getElementById('priceHistoryCard');
    if (historyCard) historyCard.style.display = 'none';
  }

  // Customer Reviews
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
            for (var i = 0; i < rating; i++) stars += '\u2B50';
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
    
    if (!hasRealReviews) {
      var avgRating = item.rating || 4.5;
      var syntheticReviews = generateSyntheticReviews(item.title, avgRating, 3);
      syntheticReviews.forEach(function(rev) {
        var stars = '';
        for (var i = 0; i < rev.rating; i++) stars += '\u2B50';
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
fs.writeFileSync('testp.js', js);
console.log('showComparePage restored!');
