# 🛍️ PriceCompare-v2 - Multi-Store Price Comparison Platform

## Overview
PriceCompare-v2 (ShopIQ) is a real-time price comparison platform that searches across multiple Indian e-commerce stores:
- **Amazon** 
- **Flipkart**
- **Croma**
- **Reliance Digital**
- **Tata CLiQ**

When you search for any product, it fetches results from all stores with **live prices and product images**.

---

## 📋 Features
✅ Real-time product search across 5 major e-commerce platforms  
✅ Product images displayed for each listing  
✅ Live price comparison between stores  
✅ Best deal highlights  
✅ Price history tracking  
✅ Responsive UI design  
✅ User authentication (Login/Signup)  
✅ Result caching (1 hour) to reduce server load  

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- A modern web browser

### Step 1: Install Dependencies
Open a terminal in the project directory and run:
```bash
npm install
```

### Step 2: Start the Backend Server
```bash
npm start
```

You should see:
```
🚀 PriceCompare Server running on http://localhost:3000
📊 Search endpoint: http://localhost:3000/api/search?q=iPhone
💾 Cache enabled (1 hour TTL)
```

### Step 3: Open the Website
1. Open your browser and go to: **http://localhost:5500** (or use Live Server)
2. Or navigate to the `index.html` file in your workspace
3. Log in with any credentials (demo mode doesn't validate)
4. Search for any product!

---

## 🔧 Configuration

### Change API Server URL
If you're deploying to a different server, update the `API_URL` in `testp.js`:

```javascript
// For local development
const API_URL = 'http://localhost:3000';

// For production
const API_URL = 'https://your-production-server.com';
```

### Change Server Port
To run the server on a different port, edit `server.js`:

```javascript
const PORT = process.env.PORT || 3000;  // Change 3000 to your desired port
```

Or set the environment variable:
```bash
PORT=5000 npm start
```

---

## 📡 API Endpoints

### Search Products
**GET** `/api/search?q=iPhone`

Query Parameters:
- `q` (required): Search query (e.g., "iPhone 15", "MacBook Air")
- `category` (optional): Filter by category (not implemented in current scraper)

**Response:**
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
    }
  ]
}
```

### Search Specific Store
**GET** `/api/store/:storeName?q=iPhone`

Supported store names: `amazon`, `flipkart`, `croma`, `reliance`, `tatacliq`

**Example:**
```
GET http://localhost:3000/api/store/amazon?q=iPhone
```

### Health Check
**GET** `/api/health`

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

### Clear Cache
**POST** `/api/cache/clear`

This clears all cached search results.

---

## 🛠️ Troubleshooting

### "Cannot find module" error
Make sure you've installed dependencies:
```bash
npm install
```

### Port already in use
If port 3000 is already in use, either:
1. Close the application using that port
2. Use a different port:
   ```bash
   PORT=3001 npm start
   ```

### Search returns no results
- The scraper might be blocked by the e-commerce site (they have anti-scraping measures)
- Check the browser console for error messages
- Some sites may require JavaScript rendering (current scraper uses basic HTTP)

### Images not loading
- The backend successfully scraped the URLs but they might be expired
- This is normal as e-commerce sites frequently change their CDN URLs
- Reload the page to get fresh images

### API Connection Error
Make sure:
1. The backend server is running (`npm start`)
2. The server is on the correct port (default: 3000)
3. The frontend's `API_URL` in `testp.js` matches the server's address

---

## 📦 Project Structure

```
PriceCompare-v2/
├── server.js              # Node.js backend server with scrapers
├── testp.js              # Frontend JavaScript logic
├── testp.css             # Frontend styling
├── auth.js               # Authentication logic
├── auth.css              # Auth page styling
├── index.html            # Main search page
├── login.html            # Login page
├── signup.html           # Signup page
├── data.json             # Static backup data (optional)
├── package.json          # Node.js dependencies
└── README.md             # This file
```

---

## 🔐 Security Notes

⚠️ **For Development Only**: The current setup includes:
- CORS enabled for all origins
- No API key authentication
- Basic caching

For production deployment:
1. Implement proper authentication
2. Restrict CORS to your domain
3. Add rate limiting
4. Use environment variables for secrets
5. Implement more sophisticated caching strategies
6. Consider using a database for price history

---

## 🚀 Deployment

### Deploy on Vercel
```bash
npm install -g vercel
vercel
```

### Deploy on Heroku
```bash
npm install -g heroku
heroku create your-app-name
git push heroku main
```

### Deploy on your own server
```bash
npm install
npm start
```

Then access via your domain.

---

## ⚠️ Important Notes

1. **Web Scraping**: These e-commerce platforms actively prevent scraping. The current solution provides fallback data and graceful error handling.

2. **Rate Limiting**: Consider implementing rate limiting to avoid excessive requests to e-commerce sites.

3. **Terms of Service**: Ensure your use complies with the terms of service of each e-commerce platform.

4. **Performance**: Results are cached for 1 hour to reduce load. Adjust in `server.js` if needed:
   ```javascript
   const cache = new NodeCache({ stdTTL: 3600 }); // Change 3600 to desired seconds
   ```

---

## 📞 Support

For issues or improvements:
1. Check the browser console (F12) for error messages
2. Check the terminal running the server for backend errors
3. Ensure all dependencies are installed: `npm install`

---

## 📄 License
MIT License - Feel free to use and modify

---

## 🎯 Future Enhancements
- [ ] Implement real API integrations with stores
- [ ] Add advanced filtering (price range, brand, specs)
- [ ] Store price history in database
- [ ] Add notification for price drops
- [ ] Mobile app version
- [ ] Product reviews aggregation
- [ ] Wishlist feature

---

**Happy Shopping! 🎉**
