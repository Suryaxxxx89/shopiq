const fs = require('fs');
let js = fs.readFileSync('testp.js', 'utf8');

// Find the renderHomeContent function start
const fnStart = js.indexOf('async function renderHomeContent()');
if (fnStart === -1) { console.log('ERROR: renderHomeContent not found'); process.exit(1); }

// Find the closing brace of the function (next occurrence of \n}\n after the try/catch)
const afterFn = js.indexOf('\n}\n\n// Generate synthetic', fnStart);
if (afterFn === -1) { console.log('ERROR: end of function not found'); process.exit(1); }

const newFn = `async function renderHomeContent() {
  const dealsContainer = document.getElementById('dealsContainer');
  const brandsContainer = document.getElementById('brandsContainer');
  if (!dealsContainer || !brandsContainer) return;

  // Reliable brand-specific fallback images from Wikipedia (allow hotlinking)
  const brandFallbacks = {
    'samsung': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Samsung_wordmark.svg/320px-Samsung_wordmark.svg.png',
    'apple': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/120px-Apple_logo_black.svg.png',
    'iphone': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/120px-Apple_logo_black.svg.png',
    'oneplus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/OnePlus_logo.svg/320px-OnePlus_logo.svg.png',
    'xiaomi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/320px-Xiaomi_logo_%282021-%29.svg.png',
    'redmi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/320px-Xiaomi_logo_%282021-%29.svg.png',
    'dell': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Dell_Logo.svg/320px-Dell_Logo.svg.png',
    'hp': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/180px-HP_logo_2012.svg.png',
    'lenovo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Lenovo_logo_2015.svg/320px-Lenovo_logo_2015.svg.png',
    'asus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/320px-ASUS_Logo.svg.png',
    'acer': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Acer_2011.svg/320px-Acer_2011.svg.png',
    'msi': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/MSI_Logo_2022.svg/320px-MSI_Logo_2022.svg.png',
  };

  function getBrandFallback(brand) {
    const b = brand.toLowerCase();
    for (const key of Object.keys(brandFallbacks)) {
      if (b.includes(key)) return brandFallbacks[key];
    }
    return '';
  }

  try {
    const res = await fetch(API_URL + '/api/data');
    const data = await res.json();
    
    // Render Deals
    const all = [...(data.mobiles || []), ...(data.laptops || [])];
    const cards = all.slice(0, 10).map(function(item) {
      const prices = [item.amazon, item.flipkart, item.reliance, item.croma, item.tatacliq].filter(function(p) { return p > 0; });
      const minP = prices.length ? Math.min.apply(null, prices) : (item.price || 50000);
      const rawImg = (item.specs && item.specs.image) ? item.specs.image : '';
      const fallbackImg = getBrandFallback(item.brand);
      const emoji = getBrandEmoji(item.brand);
      const brandSafe = item.brand.replace(/'/g, "\\'");
      
      let imgHtml;
      if (rawImg) {
        imgHtml = '<img src="' + rawImg + '" data-fallback="' + fallbackImg + '" onerror="imgError(this)" style="max-width:100%;max-height:140px;object-fit:contain;" />'
                + '<div style="display:none;align-items:center;justify-content:center;font-size:3rem;height:140px;">' + emoji + '</div>';
      } else {
        imgHtml = '<div style="display:flex;align-items:center;justify-content:center;font-size:3rem;height:140px;">' + emoji + '</div>';
      }

      return '<div class="deal-card" onclick="searchQuery(\\'' + brandSafe + '\\')">'
           + '<div style="height:150px;display:flex;align-items:center;justify-content:center;margin-bottom:12px;">' + imgHtml + '</div>'
           + '<div style="font-weight:700;font-size:13px;margin-bottom:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + item.brand + '">' + item.brand + '</div>'
           + '<div style="color:var(--primary);font-weight:800;font-size:1rem;">From ' + fmt(minP) + '</div>'
           + '</div>';
    });
    dealsContainer.innerHTML = cards.join('');

    // Render Brands
    const brands = [
      { name: 'Apple', logo: brandFallbacks['apple'] },
      { name: 'Samsung', logo: brandFallbacks['samsung'] },
      { name: 'Dell', logo: brandFallbacks['dell'] },
      { name: 'HP', logo: brandFallbacks['hp'] },
      { name: 'OnePlus', logo: brandFallbacks['oneplus'] },
      { name: 'Asus', logo: brandFallbacks['asus'] },
    ];
    brandsContainer.innerHTML = brands.map(function(b) {
      return '<div class="brand-item" onclick="searchQuery(\\'' + b.name + '\\')" style="min-width:120px;text-align:center;cursor:pointer;">'
           + '<div style="width:90px;height:90px;margin:0 auto 10px;background:#f8fafc;border-radius:50%;display:flex;align-items:center;justify-content:center;border:1px solid #eee;padding:12px;">'
           + '<img src="' + b.logo + '" style="max-width:100%;max-height:100%;object-fit:contain;" onerror="this.style.display=\'none\';this.parentElement.textContent=\'' + getBrandEmoji(b.name) + '\';" />'
           + '</div>'
           + '<div style="font-weight:600;font-size:13px;">' + b.name + '</div>'
           + '</div>';
    }).join('');

  } catch (e) {
    console.error('Home content error:', e);
  }
}`;

const updated = js.slice(0, fnStart) + newFn + js.slice(afterFn + 1); // keep the \n}
fs.writeFileSync('testp.js', updated);
console.log('OK: renderHomeContent replaced. New length: ' + updated.length);
