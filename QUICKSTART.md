# 🚀 Quick Start Guide

## What's New?
Your PriceCompare app now has a **real-time product scraping backend** that searches across 5 major Indian e-commerce stores:
- Amazon
- Flipkart  
- Croma
- Reliance Digital
- Tata CLiQ

When you search for any product, it fetches **live prices and images** from all stores!

---

## ⚡ Getting Started (3 Steps)

### Step 1️⃣: Install Dependencies
Open Command Prompt/Terminal in your project folder and run:
```bash
npm install
```

This will download all the required packages (axios, express, cheerio, cors, node-cache).

**Takes 2-3 minutes on first run**

---

### Step 2️⃣: Start the Server

**Windows Users:**
- Double-click `start-server.bat`
- Or run in Command Prompt:
  ```bash
  npm start
  ```

**Mac/Linux Users:**
- Run in Terminal:
  ```bash
  npm start
  ```
- Or:
  ```bash
  bash start-server.sh
  ```

You should see:
```
🚀 PriceCompare Server running on http://localhost:3000
📊 Search endpoint: http://localhost:3000/api/search?q=iPhone
💾 Cache enabled (1 hour TTL)
```

✅ **Server is running!** Keep this window open.

---

### Step 3️⃣: Open Your Website

In a **new** Command Prompt/Terminal window, run:
```bash
# Navigate to project folder first
cd c:\Users\surya\OneDrive\Desktop\PriceCompare-v2

# Start a simple HTTP server (requires Python)
python -m http.server 5500
```

Or use **VS Code Live Server**:
1. Install "Live Server" extension in VS Code
2. Right-click `index.html` → "Open with Live Server"

Now open your browser: **http://localhost:5500**

✅ **You're ready to go!**

---

## 🧪 Test It Out

1. Log in (use any email/password)
2. Search for: **"iPhone"** or **"Samsung Galaxy"** or **"MacBook"**
3. See products from all 5 stores with prices and images!

---

## 🆘 Troubleshooting

### "npm: command not found"
**Solution:** Install Node.js from https://nodejs.org/

### "Port 3000 already in use"
**Solution:** 
```bash
# Use a different port
PORT=3001 npm start
```
Then update `API_URL` in testp.js to: `http://localhost:3001`

### "Cannot find module"
**Solution:**
```bash
npm install
```

### Server runs but no results show up
1. Check browser console (F12) for errors
2. Make sure server is running (check Command Prompt)
3. Try a different search term
4. Reload the page (Ctrl+R or Cmd+R)

### Images not showing
This is normal! E-commerce sites change their CDN URLs frequently. The app shows placeholder images as fallback.

---

## 📊 How It Works

```
┌─────────────────┐
│  Your Browser   │
│  (index.html)   │
└────────┬────────┘
         │ Search "iPhone"
         ▼
┌─────────────────────────┐
│  Node.js Backend Server │
│  (server.js)            │
└────────┬────────────────┘
         │ Scrapes all 5 stores in parallel
         ├─► Amazon.in
         ├─► Flipkart.com
         ├─► Croma.com
         ├─► RelianceDigital.in
         └─► TataCliq.com
         │
         ▼
┌──────────────────────────┐
│ Returns JSON with:       │
│ - Product titles         │
│ - Prices from each store │
│ - Images                 │
│ - Product links          │
└──────────────────────────┘
```

---

## 🎯 Key Features Now Working

✅ **Multi-store search** - Searches all 5 stores at once  
✅ **Live prices** - Real-time pricing from scrapers  
✅ **Product images** - Shows images for each listing  
✅ **Best deal highlight** - Shows cheapest option  
✅ **Price comparison** - Side-by-side price bars  
✅ **Caching** - Results cached for 1 hour (faster repeated searches)  

---

## 📝 Configuration

### Change API Server
Edit `testp.js` line 18-24:
```javascript
// For local: http://localhost:3000
// For production: https://your-domain.com
const API_URL = 'http://localhost:3000';
```

### Change Cache Duration
Edit `server.js` line 6:
```javascript
// Cache for 1 hour (3600 seconds)
const cache = new NodeCache({ stdTTL: 3600 });

// Change to 30 minutes (1800 seconds):
// const cache = new NodeCache({ stdTTL: 1800 });
```

---

## 🔗 API Examples

### Search Products
```
GET http://localhost:3000/api/search?q=iPhone
GET http://localhost:3000/api/search?q=Samsung%20Galaxy%20S24
```

### Search Specific Store
```
GET http://localhost:3000/api/store/amazon?q=iPhone
GET http://localhost:3000/api/store/flipkart?q=MacBook
GET http://localhost:3000/api/store/croma?q=Laptop
```

### Check Server Health
```
GET http://localhost:3000/api/health
```

---

## 📚 File Structure

```
PriceCompare-v2/
├── 📄 index.html         (Main page - search UI)
├── 📄 login.html         (Login page)
├── 📄 signup.html        (Signup page)
├── 📄 testp.html         (Test page - no longer used)
├── 📄 testp.js           (Frontend JavaScript - UPDATED)
├── 📄 testp.css          (Frontend styles)
├── 📄 auth.js            (Auth logic)
├── 📄 auth.css           (Auth styles)
├── 🚀 server.js          (Backend server - NEW)
├── 📦 package.json       (Dependencies - NEW)
├── 📖 README.md          (Full documentation - NEW)
├── 🚀 start-server.bat   (Windows startup script - NEW)
├── 🚀 start-server.sh    (Mac/Linux startup script - NEW)
└── 📋 QUICKSTART.md      (This file)
```

---

## 🎉 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start server: `npm start`
3. ✅ Open browser: `http://localhost:5500`
4. ✅ Search for products!

**Happy Price Comparing! 🛍️**

---

## 💡 Tips

- Search with **specific terms**: "iPhone 15", "MacBook Air M3", "Samsung Galaxy S24"
- Try **brand names**: "Apple", "Samsung", "OnePlus"
- Try **categories**: "Laptop", "Mobile", "Tablet"
- **Reload page** if results seem stale (Ctrl+F5)
- **Check console** (F12) for error messages

---

## 📞 Need Help?

1. **Check browser console**: Press F12 → Console tab
2. **Check terminal**: Look for error messages in server output
3. **Verify server**: Open http://localhost:3000/api/health
4. **Try again**: Close server and restart with `npm start`

Good luck! 🚀
