const fs = require('fs');
let content = fs.readFileSync('testp.js', 'utf8');

// Fix the broken transform - find and replace the damaged section
const oldTransform = `          // Transform API response to match expected format
          const shopping_results = data.results.map(product => ({
            title: product.title,
            link: product.link || '#',
            extracted_price: product.price,
            price: product.priceStr || '₹' + product.price.toLocaleString('en-IN'),
          });

          processAndRender(shopping_results);`;

const newTransform = `          // Transform API response to match expected format
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

          processAndRender(shopping_results);`;

// Normalize line endings for matching
const normalizedContent = content.replace(/\r\n/g, '\n');
const normalizedOld = oldTransform.replace(/\r\n/g, '\n');
const normalizedNew = newTransform.replace(/\r\n/g, '\n');

if (normalizedContent.includes(normalizedOld)) {
  content = normalizedContent.replace(normalizedOld, normalizedNew);
  // Restore CRLF
  content = content.replace(/\n/g, '\r\n');
  fs.writeFileSync('testp.js', content);
  console.log('✅ Transform fixed successfully');
} else {
  console.log('❌ Could not find the broken transform. Searching...');
  // Find the approximate location
  const idx = normalizedContent.indexOf('Transform API response');
  if (idx !== -1) {
    console.log('Found at index:', idx);
    console.log('Context:', normalizedContent.substring(idx, idx + 300));
  }
}
