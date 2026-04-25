const axios = require('axios');
const cheerio = require('cheerio');

async function debugAll() {
  // FLIPKART
  console.log('=== FLIPKART ===');
  try {
    const r = await axios.get('https://www.flipkart.com/search?q=iPhone+15', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 8000
    });
    const $ = cheerio.load(r.data);
    // Find price elements
    let prices = [];
    $('div, span').each((i, el) => {
      const t = $(el).text().trim();
      const cls = $(el).attr('class') || '';
      if (/^₹[\d,]+$/.test(t) && t.length < 12) {
        prices.push({ cls: cls.split(' ')[0], text: t });
      }
    });
    // Find the most common price class
    const classCounts = {};
    prices.forEach(p => { classCounts[p.cls] = (classCounts[p.cls]||0) + 1; });
    console.log('Price classes:', JSON.stringify(classCounts));
    
    // Find product container by looking for elements with both title and price
    const containers = ['._1sdMkc', '.tUxRFH', '.cPHDOP', '.DOjaWF', '.yKfJKb', '.slAVV4', '.CGtC98', '._75nlfW', '.KzDlHZ', '.wjcEIp', '.Nx9bqj'];
    containers.forEach(s => {
      const count = $(s).length;
      if (count > 0) console.log(`  ${s}: ${count} elements`);
    });
  } catch(e) { console.log('Error:', e.message); }

  // CROMA
  console.log('\n=== CROMA ===');
  try {
    const r = await axios.get('https://api.croma.com/search/v1/search?q=iPhone+15:relevance&text=iPhone+15&pageSize=10&currentPage=0', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json', 'Origin': 'https://www.croma.com', 'x-api-key': '87661026-6815-4672-b7e9-38b824209995' },
      timeout: 5000
    });
    console.log('Status:', r.status, '| Products:', r.data?.products?.length || 0);
  } catch(e) { console.log('API Error:', e.response?.status, e.message); }
  // Try Croma HTML
  try {
    const r = await axios.get('https://www.croma.com/search/?q=iPhone+15%3Arelevance&text=iPhone+15', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
      timeout: 8000
    });
    const $ = cheerio.load(r.data);
    // Check for product data in script tags
    let found = false;
    $('script').each((i, el) => {
      const text = $(el).html() || '';
      if (text.includes('productName') || text.includes('product_name') || text.includes('searchResult')) {
        console.log('Croma script tag has product data, length:', text.length);
        found = true;
      }
    });
    if (!found) console.log('No product data in Croma HTML scripts');
  } catch(e) { console.log('Croma HTML Error:', e.message); }

  // RELIANCE
  console.log('\n=== RELIANCE ===');
  try {
    const r = await axios.get('https://www.reliancedigital.in/rcomapi/search/getProducts?searchTerm=iPhone+15&pageNo=0&pageSize=10', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json' },
      timeout: 5000
    });
    console.log('Status:', r.status, '| Type:', typeof r.data);
    if (r.data?.data?.results) console.log('Results:', r.data.data.results.length);
    else console.log('Keys:', Object.keys(r.data).slice(0, 5).join(', '));
  } catch(e) { console.log('API Error:', e.response?.status, e.message); }

  // TATA CLIQ
  console.log('\n=== TATA CLIQ ===');
  try {
    const r = await axios.get('https://www.tatacliq.com/marketplacewebservices/v2/mpl/products/search?searchText=iPhone+15&isSearchText=true&categoryCode=all&pageSize=10&currPage=0', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Accept': 'application/json', 'x-client-id': 'mpl' },
      timeout: 5000
    });
    console.log('Status:', r.status, '| Products:', r.data?.products?.length || 0);
  } catch(e) { console.log('API Error:', e.response?.status, e.message); }
}

debugAll();
