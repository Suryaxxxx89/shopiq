const fs = require('fs');
let lines = fs.readFileSync('testp.js', 'utf8').split('\n');

// Find the line numbers to replace (getBrandGradient incomplete + broken buildStorefrontRow)
// We need to replace from line 193 (function getBrandGradient) to line 242 (closing }) 
// with clean versions of both functions

const cleanCode = `function getBrandGradient(brand) {
  const b = brand.toLowerCase();
  if (b.includes('iphone') || b.includes('apple') || b.includes('macbook')) return 'linear-gradient(135deg, #1c1c1e, #3a3a3c)';
  if (b.includes('samsung')) return 'linear-gradient(135deg, #1428a0, #1e88e5)';
  if (b.includes('oneplus')) return 'linear-gradient(135deg, #eb0029, #ff4a5a)';
  if (b.includes('redmi') || b.includes('xiaomi') || b.includes('poco')) return 'linear-gradient(135deg, #ff6900, #ffae3c)';
  if (b.includes('vivo')) return 'linear-gradient(135deg, #415fff, #7b8cff)';
  if (b.includes('oppo')) return 'linear-gradient(135deg, #1a1a2e, #16213e)';
  if (b.includes('motorola') || b.includes('moto')) return 'linear-gradient(135deg, #5c20e5, #8b5cf6)';
  if (b.includes('realme')) return 'linear-gradient(135deg, #ffd700, #ff8c00)';
  if (b.includes('google') || b.includes('pixel')) return 'linear-gradient(135deg, #4285f4, #34a853)';
  if (b.includes('dell')) return 'linear-gradient(135deg, #007db8, #00b0ea)';
  if (b.includes('hp')) return 'linear-gradient(135deg, #0096d6, #00b2e3)';
  if (b.includes('lenovo') || b.includes('thinkpad')) return 'linear-gradient(135deg, #e2231a, #ff5f57)';
  if (b.includes('asus') || b.includes('rog')) return 'linear-gradient(135deg, #1a1a2e, #ff3d00)';
  if (b.includes('acer') || b.includes('nitro')) return 'linear-gradient(135deg, #83b81a, #5d8f00)';
  if (b.includes('msi')) return 'linear-gradient(135deg, #ff0000, #990000)';
  return 'linear-gradient(135deg, #334155, #475569)';
}

function buildStorefrontRow(title, items) {
  var catKey = title.toLowerCase().includes('mobile') ? 'mobiles' : 'laptops';
  var html = '<div class="storefront-row-title">' + title +
    '<span class="view-all-link" onclick="fetchCategory(\\x27' + catKey + '\\x27)">View All &gt;</span></div>' +
    '<div class="horizontal-scroll-container">';
  items.slice(0, 8).forEach(function(item) {
    var minPrice = Infinity;
    STORES.forEach(function(s) { if (item[s.key] && item[s.key] < minPrice) minPrice = item[s.key]; });
    if (minPrice === Infinity) return;
    var priceStr = '\\u20B9' + minPrice.toLocaleString('en-IN');
    var emoji = getBrandEmoji(item.brand);
    var gradient = getBrandGradient(item.brand);
    var safeBrand = item.brand.replace(/'/g, '');
    html += '<div class="product-card storefront-product-card" onclick="fetchCategory(\\x27' + safeBrand + '\\x27)">' +
      '<div class="storefront-card-img" style="background: ' + gradient + ';">' +
      '<span class="storefront-card-emoji">' + emoji + '</span></div>' +
      '<div class="storefront-card-body">' +
      '<div class="storefront-card-name">' + item.brand + '</div>' +
      '<div class="storefront-card-price">From ' + priceStr + '</div>' +
      '</div></div>';
  });
  html += '</div>';
  return html;
}`;

// Line numbers are 1-indexed in the viewer, but 0-indexed in the array
// Replace lines 193-242 (0-indexed: 192-241)
const before = lines.slice(0, 192);  // lines 1-192
const after = lines.slice(242);       // lines 243+

const result = before.join('\n') + '\n' + cleanCode + '\n' + after.join('\n');
fs.writeFileSync('testp.js', result);
console.log('Fixed! Lines 193-242 replaced with clean code.');
