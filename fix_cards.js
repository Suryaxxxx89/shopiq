const fs = require('fs');
let content = fs.readFileSync('testp.js', 'utf8');

// Find renderCards function and replace the card HTML generation
const startMarker = 'function renderCards(items) {';
const endMarker = "  // Handle view deal button clicks";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find markers:', startIdx, endIdx);
  process.exit(1);
}

const newFn = `function renderCards(items) {
  if (!resultsList) { console.warn('Results list element not found'); return; }

  const storeInfo = {};
  STORES.forEach(function(s) { storeInfo[s.key] = s; });

  var html = '<div class="stack" style="margin-bottom:.75rem;">' +
    '<span class="pill">Results: ' + items.length + '</span>' +
    '<span class="pill">Comparing ' + STORES.length + ' stores</span></div>' +
    '<div class="results-grid">';

  items.forEach(function(item, idx) {
    var pData = productDataMap[item.title];

    // Build store price rows
    var allStoreRows = [];
    STORES.forEach(function(store) {
      var variant = item.storeVariants ? item.storeVariants[store.key] : null;
      if (variant) {
        allStoreRows.push({ key: store.key, label: store.label, price: variant.price, priceStr: variant.priceStr || fmt(variant.price), link: variant.link || '#', barColor: store.barColor, logo: store.logo, available: true });
      } else {
        allStoreRows.push({ key: store.key, label: store.label, price: Infinity, priceStr: '\\u2014', link: '#', barColor: store.barColor, logo: store.logo, available: false });
      }
    });
    allStoreRows.sort(function(a, b) { return a.price - b.price; });

    var cheapestPrice = allStoreRows[0] ? allStoreRows[0].price : 0;
    var cheapestLink = allStoreRows[0] ? allStoreRows[0].link : '#';
    var cheapestStore = allStoreRows[0] ? allStoreRows[0].label : '';
    var availableStores = allStoreRows.filter(function(r) { return r.available; });

    // MRP (highest price across stores for strikethrough)
    var mrpPrice = 0;
    availableStores.forEach(function(r) { if (r.price > mrpPrice && r.price !== Infinity) mrpPrice = r.price; });
    var discount = mrpPrice > cheapestPrice ? Math.round(((mrpPrice - cheapestPrice) / mrpPrice) * 100) : 0;

    // Product image - use emoji gradient fallback
    var imgSrc = item.thumbnail || '';
    var emoji = getBrandEmoji(item.title);
    var gradient = getBrandGradient(item.title);
    var imgHtml = imgSrc ? 
      '<img class="product-thumb" src="' + imgSrc + '" onerror="this.style.display=\\x27none\\x27;this.nextElementSibling.style.display=\\x27flex\\x27;" alt="' + item.title + '" loading="lazy" />' +
      '<div class="product-thumb-fallback" style="display:none;width:100%;height:180px;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>'
      :
      '<div style="width:100%;height:180px;display:flex;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>';

    // Store price mini-list (top 3)
    var storePriceHtml = '<div class="card-store-prices">';
    availableStores.slice(0, 3).forEach(function(r, i) {
      var isBest = i === 0;
      storePriceHtml += '<div class="card-store-row' + (isBest ? ' card-store-best' : '') + '">' +
        '<img src="' + r.logo + '" alt="" style="width:16px;height:16px;object-fit:contain;border-radius:2px;" onerror="this.style.display=\\x27none\\x27" />' +
        '<span class="card-store-name">' + r.label + '</span>' +
        '<span class="card-store-price">' + r.priceStr + '</span>' +
        '</div>';
    });
    if (availableStores.length > 3) {
      storePriceHtml += '<div style="font-size:.7rem;color:var(--text-muted,#64748b);text-align:center;padding-top:.2rem;">+' + (availableStores.length - 3) + ' more stores</div>';
    }
    storePriceHtml += '</div>';

    html += '<div class="product-card" data-index="' + idx + '">' +
      imgHtml +
      '<div class="product-card-body">' +
      '<div class="product-card-title">' + item.title + '</div>' +
      '<div class="product-price-row">' +
      '<span class="product-card-price">' + fmt(cheapestPrice) + '</span>' +
      (discount > 0 ? '<span class="product-mrp">' + fmt(mrpPrice) + '</span><span class="product-discount">' + discount + '% off</span>' : '') +
      '</div>' +
      '<div class="product-lowest-badge">Lowest on ' + cheapestStore + '</div>' +
      storePriceHtml +
      '<a class="view-deal-btn" href="' + cheapestLink + '" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">' +
      '\\uD83D\\uDED2 Buy Now \\u2014 ' + cheapestStore + '</a>' +
      '</div></div>';
  });

  html += '</div>';
  resultsList.innerHTML = html;

  // Click card -> compare page
  resultsList.querySelectorAll('.product-card').forEach(function(card) {
    card.addEventListener('click', function(e) {
      if (e.target.closest('.view-deal-btn') || e.target.closest('.store-visit-link')) return;
      showComparePage(currentResults[Number(card.dataset.index)]);
    });
  });

`;

content = content.substring(0, startIdx) + newFn + content.substring(endIdx);
fs.writeFileSync('testp.js', content);
console.log('renderCards replaced!');
