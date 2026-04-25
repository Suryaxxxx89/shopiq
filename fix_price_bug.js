const fs = require('fs');
let js = fs.readFileSync('testp.js', 'utf8');

const target = '  // Stores sorted by price\n  var stores = Object.values(bestPerStore).sort(function(a, b) { return a.price - b.price; });';
const target2 = '  // Stores sorted by price\r\n  var stores = Object.values(bestPerStore).sort(function(a, b) { return a.price - b.price; });';

const replacement = `  // Stores sorted by price for this specific item
  var stores = [];
  STORES.forEach(function(store) {
    var variant = item.storeVariants ? item.storeVariants[store.key] : null;
    if (variant) {
      stores.push({ price: variant.price, priceStr: variant.priceStr || fmt(variant.price), link: variant.link || '#', store: store });
    }
  });
  if (stores.length === 0) {
    // fallback if storeVariants missing
    stores.push({ price: item.price || 0, priceStr: item.priceStr, link: item.link || '#', store: item.store });
  }
  stores.sort(function(a, b) { return a.price - b.price; });`;

if (js.includes(target)) {
  fs.writeFileSync('testp.js', js.replace(target, replacement));
  console.log('Fixed (LF)');
} else if (js.includes(target2)) {
  fs.writeFileSync('testp.js', js.replace(target2, replacement));
  console.log('Fixed (CRLF)');
} else {
  console.log('Target not found');
}
