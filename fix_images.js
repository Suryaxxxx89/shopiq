const fs = require('fs');

// 1. ADD PROXY ENDPOINT TO SERVER.JS
let serverJS = fs.readFileSync('server.js', 'utf8');

const proxyRoute = `
// ============ IMAGE PROXY TO BYPASS CORS ============
app.get('/api/image-proxy', async (req, res) => {
  const imageUrl = req.query.url;
  if (!imageUrl) return res.status(400).send('URL required');
  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': new URL(imageUrl).origin // Spoof referer to bypass hotlink protection
      },
      timeout: 5000
    });
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 24 hours in browser
    response.data.pipe(res);
  } catch (error) {
    res.status(500).send('Error fetching image');
  }
});
`;

if (!serverJS.includes('/api/image-proxy')) {
  const insertIndex = serverJS.indexOf('app.get(\'/api/health\'');
  if (insertIndex > -1) {
    serverJS = serverJS.substring(0, insertIndex) + proxyRoute + '\n' + serverJS.substring(insertIndex);
    fs.writeFileSync('server.js', serverJS);
    console.log('Added image proxy to server.js');
  }
}

// 2. UPDATE TESTP.JS TO USE PROXY
let testpJS = fs.readFileSync('testp.js', 'utf8');

// The replacement in renderCards (lines where we create the product image)
const rcTarget = `    var imgSrc = item.thumbnail || '';
    var emoji = getBrandEmoji(item.title);
    var gradient = getBrandGradient(item.title);
    var imgHtml = imgSrc ? 
      '<img class="product-thumb" src="' + imgSrc + '" onerror="this.style.display=\\x27none\\x27;this.nextElementSibling.style.display=\\x27flex\\x27;" alt="' + item.title + '" loading="lazy" />' +
      '<div class="product-thumb-fallback" style="display:none;width:100%;height:180px;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>'
      :
      '<div style="width:100%;height:180px;display:flex;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>';`;

const rcNew = `    var imgSrc = item.thumbnail || '';
    if (imgSrc && !imgSrc.startsWith('/api/image-proxy')) {
      imgSrc = '/api/image-proxy?url=' + encodeURIComponent(imgSrc);
    }
    var emoji = getBrandEmoji(item.title);
    var gradient = getBrandGradient(item.title);
    var imgHtml = imgSrc ? 
      '<img class="product-thumb" src="' + imgSrc + '" onerror="this.style.display=\\x27none\\x27;this.nextElementSibling.style.display=\\x27flex\\x27;" alt="' + item.title + '" loading="lazy" />' +
      '<div class="product-thumb-fallback" style="display:none;width:100%;height:180px;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>'
      :
      '<div style="width:100%;height:180px;display:flex;align-items:center;justify-content:center;background:' + gradient + ';"><span style="font-size:3.5rem;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));">' + emoji + '</span></div>';`;

if (testpJS.includes(rcTarget)) {
  testpJS = testpJS.replace(rcTarget, rcNew);
  console.log('Updated renderCards image proxy in testp.js');
}

// The replacement in showComparePage
const scpTarget = `  var imgEl = document.getElementById('compareProductImg');
  var imgSrc = productData && productData.specs && productData.specs.image ? productData.specs.image : '';
  if (imgEl) {
    if (imgSrc) {
      imgEl.src = imgSrc;
    } else {`;

const scpNew = `  var imgEl = document.getElementById('compareProductImg');
  var imgSrc = productData && productData.specs && productData.specs.image ? productData.specs.image : '';
  if (imgEl) {
    if (imgSrc) {
      imgEl.src = '/api/image-proxy?url=' + encodeURIComponent(imgSrc);
    } else {`;

if (testpJS.includes(scpTarget)) {
  testpJS = testpJS.replace(scpTarget, scpNew);
  console.log('Updated showComparePage image proxy in testp.js');
}

fs.writeFileSync('testp.js', testpJS);

// Update product image URLs to use the proxy endpoint
function updateImageUrls(products) {
  return products.map(product => {
    if (product.image && !product.image.startsWith('/api/image-proxy')) {
      product.image = `/api/image-proxy?url=${encodeURIComponent(product.image)}`;
    }
    return product;
  });
}

// Example usage
const updatedProducts = updateImageUrls(products);
console.log('Updated product images:', updatedProducts);
