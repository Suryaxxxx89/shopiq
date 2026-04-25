const express = require('express');
const cors = require('cors');
const NodeCache = require('node-cache');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Load fallback data from data.json
let fallbackData = [];
try {
  const dataPath = path.join(__dirname, 'data.json');
  const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  Object.keys(data).forEach(category => {
    if (Array.isArray(data[category])) {
      fallbackData = fallbackData.concat(data[category]);
    }
  });
  console.log(`✅ Loaded ${fallbackData.length} products for fallback mechanism.`);
} catch (e) {
  console.error('Error loading fallback data:', e.message);
}

// Fallback search function (Fuzzy matching)
function getFallbackProducts(query, storeKey, storeLabel) {
  const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1); // Only match terms > 1 char
  if (searchTerms.length === 0) return [];

  const importantTerms = searchTerms.filter(t => t.length >= 3); // Words like "lipstick", "mac", "iphone"

  const scoredMatched = fallbackData.map(product => {
    const brandLower = (product.brand || '').toLowerCase();
    const specsLower = (product.specs?.details || '').toLowerCase();
    const catLower = (product.category || '').toLowerCase();
    const combinedText = `${brandLower} ${specsLower} ${catLower}`;

    let score = 0;
    let importantMatches = 0;

    // Special boost for category matching (e.g. searching "Mobiles" should match category: "mobiles")
    if (catLower && query.toLowerCase().includes(catLower.slice(0, -1))) { // match "mobile" in "mobiles"
      score += 5;
      importantMatches += 1;
    }

    searchTerms.forEach(term => {
      if (combinedText.includes(term)) {
        score += 1;
        if (brandLower.includes(term) || catLower.includes(term)) score += 1;
        if (importantTerms.includes(term)) importantMatches++;
      }
    });

    return { product, score, importantMatches };
  })
    .filter(item => {
      // 1. Relaxed score threshold for broader coverage
      const minScore = searchTerms.length * 0.5;
      // 2. At least 70% of important terms must match
      const importantThreshold = Math.ceil(importantTerms.length * 0.7);
      const matchedEnoughImportant = importantTerms.length === 0 || item.importantMatches >= importantThreshold;

      return item.score >= minScore && matchedEnoughImportant;
    })
    .sort((a, b) => b.score - a.score);

  const matched = scoredMatched.map(item => item.product).slice(0, 10);
  const products = [];

  matched.forEach(product => {
    const price = product[storeKey];
    if (price) {
      const urlKey = storeKey === 'tatacliq' ? 'tataCliqUrl' : `${storeKey}Url`;
      let link = product[urlKey];
      if (!link) {
        if (storeKey === 'amazon') link = `https://www.amazon.in/s?k=${encodeURIComponent(query)}`;
        if (storeKey === 'flipkart') link = `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`;
        if (storeKey === 'croma') link = `https://www.croma.com/search?q=${encodeURIComponent(query)}`;
        if (storeKey === 'reliance') link = `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`;
        if (storeKey === 'tatacliq') link = `https://www.tatacliq.com/search?q=${encodeURIComponent(query)}`;
      }

      products.push({
        title: product.brand,
        price: price,
        priceStr: '₹' + price.toLocaleString('en-IN'),
        image: product.specs?.image || '',
        link: link || '#',
        source: storeLabel,
        store: storeKey,
        rating: 4.8,
        delivery: 'Free delivery (Fallback Data)',
        isFallback: true
      });
    }
  });
  return products;
}

const app = express();
const cache = new NodeCache({ stdTTL: 3600 }); // Cache for 1 hour

// Middleware
app.use(cors());
app.use(express.json());

// In production (Vercel), static files are handled by vercel.json
// This middleware is only needed for local development
if (process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname)));
}

app.get('/api/data', (req, res) => {
  try {
    const dataPath = path.join(__dirname, 'data.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load storefront data' });
  }
});

// User-Agent rotation to avoid blocking
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

const COMMON_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
  'Cache-Control': 'max-age=0',
  'Connection': 'keep-alive',
  'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'Sec-Ch-Ua-Mobile': '?0',
  'Sec-Ch-Ua-Platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1'
};

// ============ SCRAPERS FOR EACH STORE ============

// 1. AMAZON SCRAPER
async function scrapeAmazon(query) {
  try {
    const response = await axios.get(
      `https://www.amazon.in/s?k=${encodeURIComponent(query)}`,
      {
        headers: { ...COMMON_HEADERS, 'User-Agent': getRandomUserAgent() },
        timeout: 8000
      }
    );

    const $ = cheerio.load(response.data);
    const products = [];

    $('[data-component-type="s-search-result"]').each((i, elem) => {
      if (products.length >= 50) return;

      const title = $(elem).find('h2 span, .a-size-medium, .a-size-base-plus').first().text().trim();
      const priceRaw = $(elem).find('.a-price-whole').first().text();
      const priceMatch = priceRaw.match(/[\d,]+/);
      const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
      const image = $(elem).find('.s-image').attr('src');
      let link = $(elem).find('h2 a, a.a-link-normal').first().attr('href');
      if (link && !link.startsWith('http')) link = 'https://www.amazon.in' + link;
      const rating = $(elem).find('.a-icon-star-small .a-icon-alt, span[aria-label*="out of 5 stars"], .a-icon-star').first().text().trim();

      if (title && price && !isNaN(price)) {
        products.push({
          title: title,
          price: price,
          priceStr: '₹' + price.toLocaleString('en-IN'),
          image: image || '',
          link: link,
          source: 'Amazon',
          store: 'amazon',
          rating: parseFloat(rating) || null,
          delivery: 'Check Amazon for delivery details',
        });
      }
    });

    if (products.length === 0) {
      console.log(`Amazon live scrape empty for "${query}", using fallback.`);
      return getFallbackProducts(query, 'amazon', 'Amazon');
    }
    return products;
  } catch (error) {
    console.error('Amazon scraping error:', error.message);
    return getFallbackProducts(query, 'amazon', 'Amazon');
  }
}

// 2. FLIPKART SCRAPER (Updated selectors for 2026)
async function scrapeFlipkart(query) {
  try {
    const response = await axios.get(
      `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`,
      {
        headers: { ...COMMON_HEADERS, 'User-Agent': getRandomUserAgent() },
        timeout: 8000
      }
    );

    const $ = cheerio.load(response.data);
    const products = [];

    // Strategy 1: Find all price elements and walk up to product containers
    const priceSelectors = '.Nx9bqj, .oFEPlD, ._30jeq3, .nxS7TM, ._16J69e';
    const titleSelectors = 'a[title], .KzDlHZ, .wjcEIp, .WKTcLC, .KzYVwS, .IRpwTa, ._4rR01T, .s1Q9rs, .Gyq3Dp';

    // Try container-based approach first
    $('div[data-id], .cPHDOP, .tUxRFH, .slAVV4, .DOjaWF, .yKfJKb, ._75nlfW, .CGtC98, ._1AtVbE, ._13oc-S, .cPHD_L').slice(0, 50).each((i, elem) => {
      const title = $(elem).find(titleSelectors).first().text().trim()
        || $(elem).find('a[title]').first().attr('title')
        || $(elem).find('img').first().attr('alt');
      const priceRaw = $(elem).find(priceSelectors).first().text();
      const priceMatch = priceRaw.match(/[\d,]+/);
      const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
      const image = $(elem).find('img').first().attr('src');
      let link = $(elem).find('a[href*="/p/"], a[href*="/dl/"]').first().attr('href') || $(elem).find('a').first().attr('href');

      if (title && price && !isNaN(price) && price > 100 && link) {
        products.push({
          title: title,
          price: price,
          priceStr: '₹' + price.toLocaleString('en-IN'),
          image: image || '',
          link: link.startsWith('http') ? link : 'https://www.flipkart.com' + link,
          source: 'Flipkart',
          store: 'flipkart',
          rating: null,
          delivery: 'Free delivery available',
        });
      }
    });

    // Strategy 2: If container approach failed, try generic price-element walk-up
    if (products.length === 0) {
      $(priceSelectors).slice(0, 50).each((i, el) => {
        const priceRaw = $(el).text();
        const priceMatch = priceRaw.match(/[\d,]+/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
        if (!price || isNaN(price) || price < 100) return;

        // Walk up to find parent product card
        const card = $(el).closest('div[data-id], a[href*="/p/"]').first();
        if (!card.length) return;

        const title = card.find('a[title]').attr('title') || card.find('img').attr('alt') || card.text().substring(0, 80).trim();
        let link = card.find('a[href*="/p/"]').attr('href') || card.attr('href') || '';
        const image = card.find('img').first().attr('src');

        if (title && link) {
          products.push({
            title, price,
            priceStr: '₹' + price.toLocaleString('en-IN'),
            image: image || '',
            link: link.startsWith('http') ? link : 'https://www.flipkart.com' + link,
            source: 'Flipkart', store: 'flipkart',
            rating: null, delivery: 'Free delivery available',
          });
        }
      });
    }

    if (products.length === 0) {
      console.log(`Flipkart live scrape empty for "${query}", using fallback.`);
      return getFallbackProducts(query, 'flipkart', 'Flipkart');
    }
    console.log(`✅ Flipkart: ${products.length} products scraped`);
    return products;
  } catch (error) {
    console.error('Flipkart scraping error:', error.message);
    return getFallbackProducts(query, 'flipkart', 'Flipkart');
  }
}

// 3. CROMA SCRAPER (HTML scraping - API is dead)
async function scrapeCroma(query) {
  try {
    // Try HTML scraping since the API returns 404
    const response = await axios.get(
      `https://www.croma.com/searchB?q=${encodeURIComponent(query)}%3Arelevance&text=${encodeURIComponent(query)}`,
      {
        headers: { ...COMMON_HEADERS, 'User-Agent': getRandomUserAgent() },
        timeout: 8000,
        maxRedirects: 5
      }
    );

    const $ = cheerio.load(response.data);
    const products = [];

    // Try to extract from JSON-LD structured data
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        if (json['@type'] === 'Product' || (json.itemListElement)) {
          const items = json.itemListElement || [json];
          items.forEach(item => {
            const p = item.item || item;
            if (p.name && p.offers) {
              const price = p.offers.price || p.offers.lowPrice;
              products.push({
                title: p.name, price: parseInt(price),
                priceStr: '₹' + parseInt(price).toLocaleString('en-IN'),
                image: p.image || '', link: p.url || `https://www.croma.com/search?q=${encodeURIComponent(query)}`,
                source: 'Croma', store: 'croma', rating: 4.2, delivery: 'Free shipping',
              });
            }
          });
        }
      } catch (e) { }
    });

    // Try meta/product card selectors
    if (products.length === 0) {
      $('[class*="product"], [class*="Product"], .product-item, .plp-prod-list li').slice(0, 40).each((i, elem) => {
        const title = $(elem).find('[class*="name"], [class*="title"], h3, h2').first().text().trim();
        const priceRaw = $(elem).find('[class*="price"], [class*="Price"]').first().text();
        const priceMatch = priceRaw.match(/[\d,]+/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
        const link = $(elem).find('a').first().attr('href');
        const image = $(elem).find('img').first().attr('src');
        if (title && price && !isNaN(price) && price > 100) {
          products.push({
            title, price, priceStr: '₹' + price.toLocaleString('en-IN'),
            image: image || '', link: link ? (link.startsWith('http') ? link : 'https://www.croma.com' + link) : '#',
            source: 'Croma', store: 'croma', rating: 4.2, delivery: 'Free shipping',
          });
        }
      });
    }

    if (products.length === 0) {
      return getFallbackProducts(query, 'croma', 'Croma');
    }
    console.log(`✅ Croma: ${products.length} products scraped`);
    return products;
  } catch (error) {
    console.error('Croma scraping error:', error.message);
    return getFallbackProducts(query, 'croma', 'Croma');
  }
}

// 4. RELIANCE DIGITAL SCRAPER (HTML + API fallback)
async function scrapeRelianceDigital(query) {
  try {
    // Try the search page HTML
    const response = await axios.get(
      `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`,
      {
        headers: { ...COMMON_HEADERS, 'User-Agent': getRandomUserAgent() },
        timeout: 8000,
        maxRedirects: 5
      }
    );

    const $ = cheerio.load(response.data);
    const products = [];

    // Try JSON-LD structured data
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const json = JSON.parse($(el).html());
        const items = json.itemListElement || (json['@type'] === 'Product' ? [json] : []);
        items.forEach(item => {
          const p = item.item || item;
          if (p.name && p.offers) {
            const price = p.offers.price || p.offers.lowPrice;
            if (price) {
              products.push({
                title: p.name, price: parseInt(price),
                priceStr: '₹' + parseInt(price).toLocaleString('en-IN'),
                image: p.image || '', link: p.url || `https://www.reliancedigital.in/search?q=${encodeURIComponent(query)}`,
                source: 'Reliance Digital', store: 'reliance', rating: 4.5, delivery: 'Free delivery',
              });
            }
          }
        });
      } catch (e) { }
    });

    // Try __NEXT_DATA__ or inline JSON
    if (products.length === 0) {
      $('script').each((i, el) => {
        const text = $(el).html() || '';
        if (text.includes('"products"') && text.includes('"price"')) {
          try {
            // Try to find product array in inline scripts
            const match = text.match(/"products"\s*:\s*(\[[\s\S]*?\])/);
            if (match) {
              const arr = JSON.parse(match[1]);
              arr.slice(0, 40).forEach(p => {
                const title = p.name || p.productName;
                const price = p.price?.offerPrice || p.price?.mrp || p.offerPrice || p.mrp;
                if (title && price) {
                  products.push({
                    title, price: parseInt(price),
                    priceStr: '₹' + parseInt(price).toLocaleString('en-IN'),
                    image: p.imageUrl || p.image || '', link: p.url ? `https://www.reliancedigital.in${p.url}` : '#',
                    source: 'Reliance Digital', store: 'reliance', rating: 4.5, delivery: 'Free delivery',
                  });
                }
              });
            }
          } catch (e) { }
        }
      });
    }

    // Try product card selectors
    if (products.length === 0) {
      $('[class*="product"], [class*="Product"], .sp__product').slice(0, 40).each((i, elem) => {
        const title = $(elem).find('[class*="name"], [class*="title"], h3, h2, p').first().text().trim();
        const priceRaw = $(elem).find('[class*="price"], [class*="Price"]').first().text();
        const priceMatch = priceRaw.match(/[\d,]+/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
        const link = $(elem).find('a').first().attr('href');
        const image = $(elem).find('img').first().attr('src');
        if (title && price && !isNaN(price) && price > 100) {
          products.push({
            title, price, priceStr: '₹' + price.toLocaleString('en-IN'),
            image: image || '', link: link ? (link.startsWith('http') ? link : 'https://www.reliancedigital.in' + link) : '#',
            source: 'Reliance Digital', store: 'reliance', rating: 4.5, delivery: 'Free delivery',
          });
        }
      });
    }

    if (products.length === 0) {
      return getFallbackProducts(query, 'reliance', 'Reliance Digital');
    }
    console.log(`✅ Reliance: ${products.length} products scraped`);
    return products;
  } catch (error) {
    console.error('Reliance Digital scraping error:', error.message);
    return getFallbackProducts(query, 'reliance', 'Reliance Digital');
  }
}

// 5. TATA CLIQ SCRAPER (HTML scraping - API returns 400)
async function scrapeTataCliq(query) {
  try {
    const response = await axios.get(
      `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`,
      {
        headers: { ...COMMON_HEADERS, 'User-Agent': getRandomUserAgent() },
        timeout: 8000,
        maxRedirects: 5
      }
    );

    const $ = cheerio.load(response.data);
    const products = [];

    // Try __NEXT_DATA__ for SSR data
    const nextDataEl = $('script#__NEXT_DATA__');
    if (nextDataEl.length) {
      try {
        const nextData = JSON.parse(nextDataEl.html());
        const searchData = nextData?.props?.pageProps?.searchData?.products
          || nextData?.props?.pageProps?.products
          || [];
        searchData.slice(0, 40).forEach(p => {
          const title = p.productName || p.name || p.title;
          const price = p.price?.value || p.salePrice || p.price;
          if (title && price) {
            products.push({
              title, price: parseInt(price),
              priceStr: '₹' + parseInt(price).toLocaleString('en-IN'),
              image: p.imageURL || p.image || '',
              link: p.url ? `https://www.tatacliq.com${p.url}` : `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(query)}`,
              source: 'Tata CLiQ', store: 'tatacliq', rating: 4.0, delivery: 'Express delivery',
            });
          }
        });
      } catch (e) { console.error('TataCliq NEXT_DATA parse error:', e.message); }
    }

    // Try JSON-LD
    if (products.length === 0) {
      $('script[type="application/ld+json"]').each((i, el) => {
        try {
          const json = JSON.parse($(el).html());
          const items = json.itemListElement || (json['@type'] === 'Product' ? [json] : []);
          items.forEach(item => {
            const p = item.item || item;
            if (p.name && p.offers) {
              const price = p.offers.price || p.offers.lowPrice;
              if (price) {
                products.push({
                  title: p.name, price: parseInt(price),
                  priceStr: '₹' + parseInt(price).toLocaleString('en-IN'),
                  image: p.image || '', link: p.url || '#',
                  source: 'Tata CLiQ', store: 'tatacliq', rating: 4.0, delivery: 'Express delivery',
                });
              }
            }
          });
        } catch (e) { }
      });
    }

    // Try product card selectors
    if (products.length === 0) {
      $('[class*="ProductModule"], [class*="product-card"], [class*="ProductCard"]').slice(0, 40).each((i, elem) => {
        const title = $(elem).find('[class*="name"], [class*="title"], [class*="Name"], h3').first().text().trim();
        const priceRaw = $(elem).find('[class*="price"], [class*="Price"]').first().text();
        const priceMatch = priceRaw.match(/[\d,]+/);
        const price = priceMatch ? parseInt(priceMatch[0].replace(/,/g, '')) : 0;
        const link = $(elem).find('a').first().attr('href');
        const image = $(elem).find('img').first().attr('src');
        if (title && price && !isNaN(price) && price > 100) {
          products.push({
            title, price, priceStr: '₹' + price.toLocaleString('en-IN'),
            image: image || '', link: link ? (link.startsWith('http') ? link : 'https://www.tatacliq.com' + link) : '#',
            source: 'Tata CLiQ', store: 'tatacliq', rating: 4.0, delivery: 'Express delivery',
          });
        }
      });
    }

    if (products.length === 0) {
      return getFallbackProducts(query, 'tatacliq', 'Tata CLiQ');
    }
    console.log(`✅ TataCliq: ${products.length} products scraped`);
    return products;
  } catch (error) {
    console.error('Tata CLiQ scraping error:', error.message);
    return getFallbackProducts(query, 'tatacliq', 'Tata CLiQ');
  }
}

// ============ API ENDPOINTS ============

// Main search endpoint
app.get('/api/search', async (req, res) => {
  const { q, category } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' });
  }

  // Check cache first
  const cacheKey = `search:${q}:${category || 'all'}`;
  const cachedResults = cache.get(cacheKey);
  if (cachedResults) {
    return res.json(cachedResults);
  }

  try {
    // Scrape all stores in parallel
    const [amazonProducts, flipkartProducts, cromaProducts, relianceProducts, tataProducts] =
      await Promise.allSettled([
        scrapeAmazon(q),
        scrapeFlipkart(q),
        scrapeCroma(q),
        scrapeRelianceDigital(q),
        scrapeTataCliq(q),
      ]).then(results =>
        results.map(r => r.status === 'fulfilled' ? r.value : [])
      );

    // Combine all results
    let allProducts = [
      ...amazonProducts,
      ...flipkartProducts,
      ...cromaProducts,
      ...relianceProducts,
      ...tataProducts,
    ].filter(p => !p.isFallback); // Start with only live results

    // --- Recursive Discovery (Deep Search) ---
    const storesWithResults = new Set(allProducts.map(p => p.store));
    const emptyStores = ['amazon', 'flipkart', 'croma', 'reliance', 'tatacliq'].filter(s => !storesWithResults.has(s));

    if (emptyStores.length > 0 && allProducts.length > 0) {
      const topProduct = allProducts[0];
      const deepQuery = topProduct.title;
      console.log(`🔄 Deep Search: Attempting to find "${deepQuery}" in empty stores: ${emptyStores.join(', ')}`);

      const deepSearchPromises = emptyStores.map(store => {
        if (store === 'amazon') return scrapeAmazon(deepQuery);
        if (store === 'flipkart') return scrapeFlipkart(deepQuery);
        if (store === 'croma') return scrapeCroma(deepQuery);
        if (store === 'reliance') return scrapeRelianceDigital(deepQuery);
        if (store === 'tatacliq') return scrapeTataCliq(deepQuery);
        return Promise.resolve([]);
      });

      const deepResultsArr = await Promise.all(deepSearchPromises);
      deepResultsArr.flat().forEach(p => {
        if (!p.isFallback) allProducts.push(p);
      });
    }

    // Add fallback data ONLY if a store is still empty after deep search
    const finalStoresWithResults = new Set(allProducts.map(p => p.store));
    ['amazon', 'flipkart', 'croma', 'reliance', 'tatacliq'].forEach(s => {
      if (!finalStoresWithResults.has(s)) {
        const fallbacks = getFallbackProducts(q, s, s.charAt(0).toUpperCase() + s.slice(1));
        allProducts = allProducts.concat(fallbacks);
      }
    });

    console.log(`🔍 Search for "${q}" returned ${allProducts.length} final results`);

    // Deduplicate by store + title (so we don't delete other stores' items)
    const seen = new Set();
    allProducts = allProducts.filter(product => {
      const key = `${product.store}:${product.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // ── Relevance scoring: sort products by how well title matches the search query ──
    const queryTerms = q.toLowerCase().split(/\s+/).filter(t => t.length > 1);

    allProducts.forEach(product => {
      if (product.isSearchLink) { product._relevance = -1; return; }
      const titleLower = (product.title || '').toLowerCase();
      let score = 0;
      let matchCount = 0;

      queryTerms.forEach(term => {
        if (titleLower.includes(term)) {
          matchCount++;
          score += 20;
          // Bonus if term appears at the start of the title
          if (titleLower.startsWith(term) || titleLower.indexOf(' ' + term) < 15) score += 10;
        }
      });

      // Percentage of query terms matched
      const matchRatio = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
      score += matchRatio * 30;

      // STRICTER FILTERING: If query has 2+ terms, and result matches < 60% of them, penalize heavily
      // This stops "Lakme Lipstick" from appearing high when searching "MAC Lipstick"
      if (queryTerms.length >= 2 && matchRatio < 0.6) {
        score -= 60;
      }

      // Penalty for very short titles
      if (titleLower.length < 8) score -= 10;

      // Strict penalty for accessories if user didn't explicitly search for them
      const isAccessorySearch = queryTerms.some(t => ['case', 'cover', 'glass', 'protector', 'cable', 'charger', 'adapter'].includes(t));
      if (!isAccessorySearch) {
        if (titleLower.includes('case') || titleLower.includes('cover') || titleLower.includes('protector') || titleLower.includes('glass') || titleLower.includes('cable')) {
          score -= 100;
        }
      }

      product._relevance = score;
    });

    // Drop products that were heavily penalized or have very low matching
    allProducts = allProducts.filter(p => p._relevance > 0);

    // Sort by relevance (highest first), then by price
    allProducts.sort((a, b) => {
      if (b._relevance !== a._relevance) return b._relevance - a._relevance;
      return (a.price || 0) - (b.price || 0);
    });

    // GUARANTEE all 5 stores have results: inject "Search on [Store]" cards for any store still missing
    const storeConfigs = [
      { key: 'amazon', label: 'Amazon', url: `https://www.amazon.in/s?k=${encodeURIComponent(q)}` },
      { key: 'flipkart', label: 'Flipkart', url: `https://www.flipkart.com/search?q=${encodeURIComponent(q)}` },
      { key: 'croma', label: 'Croma', url: `https://www.croma.com/searchB?q=${encodeURIComponent(q)}%3Arelevance&text=${encodeURIComponent(q)}` },
      { key: 'reliance', label: 'Reliance Digital', url: `https://www.reliancedigital.in/products?q=${encodeURIComponent(q)}` },
      { key: 'tatacliq', label: 'Tata CLiQ', url: `https://www.tatacliq.com/search/?searchCategory=all&text=${encodeURIComponent(q)}` }
    ];

    const coveredStores = new Set(allProducts.map(p => p.store));
    storeConfigs.forEach(config => {
      if (!coveredStores.has(config.key)) {
        console.log(`🔗 Injecting search-link card for ${config.label} (no results found)`);
        allProducts.push({
          title: `Search "${q}" on ${config.label}`,
          price: 0,
          priceStr: 'View on Store →',
          image: '',
          link: config.url,
          source: config.label,
          store: config.key,
          rating: null,
          delivery: `Click to see results on ${config.label}`,
          isSearchLink: true
        });
      }
    });

    // Cache results
    cache.set(cacheKey, { success: true, results: allProducts, count: allProducts.length });

    res.json({
      success: true,
      results: allProducts,
      count: allProducts.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// URL extraction endpoint (for pasting links)
app.get('/api/extract', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL parameter required' });
  }

  try {
    const response = await axios.get(url, {
      headers: { ...COMMON_HEADERS, 'User-Agent': getRandomUserAgent() },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);
    let title = $('title').text().trim();

    // Try to get more specific product title if possible
    const metaTitle = $('meta[property="og:title"]').attr('content');
    const h1Title = $('h1').first().text().trim();

    title = metaTitle || h1Title || title;

    res.json({ success: true, title: title });
  } catch (error) {
    console.error('Extraction error:', error.message);
    res.status(500).json({ error: 'Failed to extract title from URL' });
  }
});

// Alias for legacy support
app.get('/extract', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const response = await axios.get(url, {
      headers: { ...COMMON_HEADERS, 'User-Agent': getRandomUserAgent() },
      timeout: 8000
    });
    const $ = cheerio.load(response.data);
    const title = $('title').text().trim();
    res.json({ title });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Get products by specific store
app.get('/api/store/:storeName', async (req, res) => {
  const { storeName } = req.params;
  const { q } = req.query;

  if (!q || q.length < 2) {
    return res.status(400).json({ error: 'Query required' });
  }

  const cacheKey = `store:${storeName}:${q}`;
  const cachedResults = cache.get(cacheKey);
  if (cachedResults) {
    return res.json(cachedResults);
  }

  try {
    let products = [];

    switch (storeName.toLowerCase()) {
      case 'amazon':
        products = await scrapeAmazon(q);
        break;
      case 'flipkart':
        products = await scrapeFlipkart(q);
        break;
      case 'croma':
        products = await scrapeCroma(q);
        break;
      case 'reliance':
        products = await scrapeRelianceDigital(q);
        break;
      case 'tatacliq':
      case 'tata':
        products = await scrapeTataCliq(q);
        break;
      default:
        return res.status(400).json({ error: 'Invalid store name' });
    }

    cache.set(cacheKey, products);
    res.json({ store: storeName, results: products });
  } catch (error) {
    console.error(`${storeName} error:`, error);
    res.status(500).json({ error: `Failed to search ${storeName}` });
  }
});

// Clear cache endpoint (for admin)
app.post('/api/cache/clear', (req, res) => {
  cache.flushAll();
  res.json({ message: 'Cache cleared' });
});

// HTML routes for Auth and Account
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/account', (req, res) => {
  res.sendFile(path.join(__dirname, 'account.html'));
});

// Export for Vercel
module.exports = app;

// Start server (only if not running as a serverless function)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 PriceCompare Server running on http://localhost:${PORT}`);
    console.log(`📊 Search endpoint: http://localhost:${PORT}/api/search?q=iPhone`);
    console.log(`💾 Cache enabled (1 hour TTL)`);
  });
}

// Ensure the image proxy endpoint is robust and handles errors gracefully
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
    console.error('Error fetching image:', error.message);
    res.status(500).send('Error fetching image');
  }
});
