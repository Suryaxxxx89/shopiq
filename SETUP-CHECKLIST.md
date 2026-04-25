# ✅ Setup Checklist - Multi-Store Price Scraper

## What Was Done

Your PriceCompare app now has a **complete backend system** that searches across **5 major Indian e-commerce stores**:

- 🛒 **Amazon**
- 🛒 **Flipkart**  
- 🛒 **Croma**
- 🛒 **Reliance Digital**
- 🛒 **Tata CLiQ**

When users search for products, the backend:
1. **Scrapes all 5 stores in parallel**
2. **Extracts product titles, prices, and images**
3. **Returns results with the cheapest option highlighted**
4. **Caches results for 1 hour** (improves speed)

---

## 📥 Files Added/Modified

| File | Action | Purpose |
|------|--------|---------|
| `server.js` | ✨ NEW | Backend Node.js server with scrapers |
| `package.json` | 📝 UPDATED | Added dependencies (axios, cheerio, express) |
| `testp.js` | 📝 UPDATED | Changed from static data.json to API calls |
| `README.md` | ✨ NEW | Full documentation |
| `QUICKSTART.md` | ✨ NEW | Step-by-step setup guide |
| `start-server.bat` | ✨ NEW | Windows startup script |
| `start-server.sh` | ✨ NEW | Mac/Linux startup script |

---

## 🚀 How to Use (4 Steps)

### Step 1: Install Dependencies
```bash
npm install
```
This downloads: axios, cheerio, express, cors, node-cache  
**Time: ~2-3 minutes on first run**

---

### Step 2: Start the Backend Server

**Windows:**
```bash
# Double-click start-server.bat
# OR run in Command Prompt:
npm start
```

**Mac/Linux:**
```bash
npm start
# OR:
bash start-server.sh
```

**Expected Output:**
```
🚀 PriceCompare Server running on http://localhost:3000
📊 Search endpoint: http://localhost:3000/api/search?q=iPhone
💾 Cache enabled (1 hour TTL)
```

✅ **Keep this terminal window OPEN**

---

### Step 3: Open Your Frontend

In a **NEW** terminal/command prompt:

**Using Python (if installed):**
```bash
cd c:\Users\surya\OneDrive\Desktop\PriceCompare-v2
python -m http.server 5500
```

**OR use VS Code Live Server:**
1. Install "Live Server" extension
2. Right-click `index.html` → "Open with Live Server"

---

### Step 4: Test It!

1. Open browser: **http://localhost:5500**
2. Log in (use any email/password)
3. Search for: **"iPhone"** or **"Samsung"** or **"Laptop"**
4. See products from all 5 stores with prices & images! 🎉

---

## 🔑 Key Components

### Backend (server.js)
```javascript
// 5 scraper functions:
- scrapeAmazon(query)
- scrapeFlipkart(query)
- scrapeCroma(query)
- scrapeRelianceDigital(query)
- scrapeTataCliq(query)

// 3 API endpoints:
- GET /api/search?q=query
- GET /api/store/storeName?q=query
- GET /api/health
```

### Frontend Update (testp.js)
```javascript
// OLD: Loaded from data.json (static)
const res = await fetch('data.json');

// NEW: Calls backend API
const response = await fetch(`${API_URL}/api/search?q=${query}`);
```

---

## 💾 Caching System

Results are cached for **1 hour** to reduce server load:
```javascript
const cache = new NodeCache({ stdTTL: 3600 });
```

**Benefits:**
- ⚡ Faster repeated searches
- 📉 Reduced load on e-commerce sites
- 💰 Cost savings on API calls

**To clear cache:**
```bash
curl -X POST http://localhost:3000/api/cache/clear
```

---

## 🛠️ Configuration

### Change Server Port
Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;  // Change 3000 to your port
```

Or use environment variable:
```bash
PORT=3001 npm start
```

### Change API Server URL
Edit `testp.js`:
```javascript
// For development:
const API_URL = 'http://localhost:3000';

// For production:
const API_URL = 'https://your-domain.com';
```

---

## ⚠️ Important Notes

1. **Web Scraping Limitations**
   - E-commerce sites actively prevent scraping
   - Some requests may fail or return partial data
   - This is **normal behavior**
   - The app gracefully handles these cases

2. **Performance**
   - First search takes 5-10 seconds (parallel scraping)
   - Repeated searches are instant (cached results)
   - Cache expires after 1 hour

3. **Image URLs**
   - URLs work initially but may expire
   - Shows placeholder image if URL fails
   - This is **expected behavior**

---

## 🆘 Troubleshooting

### Issue: "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### Issue: "Module not found"
**Solution:** 
```bash
npm install
```

### Issue: "Port 3000 already in use"
**Solution:**
```bash
PORT=3001 npm start
```

### Issue: "Cannot reach API"
**Solution:**
1. Make sure backend server is running
2. Check `API_URL` in testp.js matches your server URL
3. Try http://localhost:3000/api/health in browser

### Issue: "No results showing up"
**Solution:**
1. Check browser console (F12)
2. Check terminal where server is running for errors
3. Try different search terms
4. E-commerce sites may be blocking the scraper (normal)

### Issue: "Images not showing"
**Solution:** This is normal! CDN URLs expire. Reload page to get fresh URLs.

---

## 📊 API Response Example

```json
{
  "success": true,
  "count": 15,
  "results": [
    {
      "title": "iPhone 15 Pro Max",
      "price": 139999,
      "priceStr": "₹139,999",
      "image": "https://...",
      "link": "https://amazon.in/...",
      "source": "Amazon",
      "store": "amazon",
      "rating": 4.5,
      "delivery": "Free delivery on eligible orders"
    },
    {
      "title": "iPhone 15 Pro Max",
      "price": 141999,
      "priceStr": "₹141,999",
      "image": "https://...",
      "link": "https://flipkart.com/...",
      "source": "Flipkart",
      "store": "flipkart",
      "rating": 4.3,
      "delivery": "Free delivery on orders above ₹500"
    }
    // ... more results from other stores
  ]
}
```

---

## ✨ Features Now Available

| Feature | Status | Notes |
|---------|--------|-------|
| Search across all 5 stores | ✅ | Parallel scraping |
| Product images | ✅ | Falls back to placeholder |
| Live prices | ✅ | Real-time from stores |
| Best deal highlighting | ✅ | Shows cheapest option |
| Price comparison chart | ✅ | Bar chart visualization |
| Results caching | ✅ | 1 hour TTL |
| Specific store search | ✅ | /api/store/:name |
| Health check | ✅ | /api/health endpoint |

---

## 🚀 Production Deployment

### Option 1: Heroku
```bash
npm install -g heroku
heroku create your-app-name
git push heroku main
heroku config:set ORIGIN=your-domain.com
```

### Option 2: Vercel
```bash
npm install -g vercel
vercel --prod
```

### Option 3: Your Own Server
```bash
npm install
npm start
```

---

## 📝 Next Steps

✅ **Immediate Actions:**
1. Run `npm install`
2. Run `npm start` to start backend
3. Open frontend and test

✅ **Testing:**
1. Search for common products: iPhone, Samsung, MacBook, Laptop
2. Verify prices from all 5 stores appear
3. Check images load
4. Try sorting by price

✅ **Customization (Optional):**
1. Change server port if needed
2. Adjust cache duration
3. Customize store list
4. Modify scraper selectors for better accuracy

---

## 📞 Support Resources

- **README.md** - Full documentation with API details
- **QUICKSTART.md** - Quick setup guide
- **Browser Console** - Press F12 for error messages
- **Server Output** - Check terminal for backend errors

---

## 🎉 You're All Set!

Your price comparison app now has:
- ✅ Live product scraping from 5 stores
- ✅ Product images included
- ✅ Real-time price comparison
- ✅ Caching for performance
- ✅ Clean, professional UI

**Start using it now!**

```bash
npm install
npm start
```

Then open: **http://localhost:5500**

---

**Happy Price Comparing! 🛍️**
