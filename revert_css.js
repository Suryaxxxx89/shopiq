const fs = require('fs');
let css = fs.readFileSync('testp.css', 'utf8');

// 1. Remove the PDP styles we added
const pdpStart = css.indexOf('/* ===== Product Detail Page (Flipkart-style) =====');
if (pdpStart !== -1) {
  // Find the end - it's the last rule in the PDP block (the @media query closing brace)
  const pdpEnd = css.indexOf('@media (max-width: 768px) {', pdpStart);
  if (pdpEnd !== -1) {
    // Find the closing brace of that media query
    let braceCount = 0;
    let endIdx = pdpEnd;
    for (let i = pdpEnd; i < css.length; i++) {
      if (css[i] === '{') braceCount++;
      if (css[i] === '}') { braceCount--; if (braceCount === 0) { endIdx = i + 1; break; } }
    }
    css = css.substring(0, pdpStart) + css.substring(endIdx);
    console.log('Removed PDP styles');
  }
}

// 2. Replace the current card styles with the original glassmorphism ones
const gridStart = css.indexOf('.results-grid {');
const gridEnd = css.indexOf('.view-deal-btn {');

if (gridStart !== -1 && gridEnd !== -1) {
  const originalCardCSS = `.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.product-card {
  position: relative;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.product-card:hover {
  box-shadow: 0 20px 40px rgba(37, 99, 235, 0.15);
  transform: translateY(-6px) scale(1.01);
  border-color: rgba(59, 130, 246, 0.5);
}

.best-deal-card {
  border-color: #2563eb;
  box-shadow: 0 4px 16px rgba(37, 99, 235, .18);
}

.best-deal-badge {
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  color: #fff;
  font-size: .72rem;
  font-weight: 700;
  padding: .28rem .7rem;
  letter-spacing: .2px;
}

.product-thumb {
  width: 100%;
  height: 160px;
  object-fit: contain;
  background: #f8fafc;
  padding: .6rem;
  border-bottom: 1px solid #f1f5f9;
}

.product-card-body {
  padding: .8rem .85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: .3rem;
  flex: 1;
}

/* Store badge – uses CSS variable --sc set inline */
.store-badge {
  display: inline-block;
  font-size: .72rem;
  font-weight: 700;
  padding: .18rem .55rem;
  border-radius: 999px;
  border: 1px solid var(--sc, #94a3b8);
  color: var(--sc, #475569);
  background: color-mix(in srgb, var(--sc, #94a3b8) 12%, transparent);
  align-self: flex-start;
}

.product-card-title {
  font-size: .82rem;
  color: #1e293b;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.product-card-price {
  font-size: 1.25rem;
  font-weight: 900;
  color: #0f172a;
  letter-spacing: .1px;
}

.product-card-delivery {
  font-size: .75rem;
  color: #16a34a;
  font-weight: 600;
}

.product-card-rating {
  font-size: .75rem;
  color: #64748b;
}

`;
  css = css.substring(0, gridStart) + originalCardCSS + css.substring(gridEnd);
  console.log('Restored original card CSS');
}

// 3. Also add dark mode overrides for the cards
if (!css.includes('[data-theme="dark"] .product-card {')) {
  const darkCardCSS = `
/* Dark mode card overrides */
[data-theme="dark"] .product-card { background: var(--card-bg); border-color: var(--border-color); }
[data-theme="dark"] .product-card-title { color: var(--text-main); }
[data-theme="dark"] .product-card-price { color: var(--text-main); }
[data-theme="dark"] .product-thumb { background: var(--bg-color); border-color: var(--border-color); }
[data-theme="dark"] .product-card-rating { color: var(--text-muted); }
`;
  // Append before the last closing content
  css += darkCardCSS;
  console.log('Added dark mode card overrides');
}

fs.writeFileSync('testp.css', css);
console.log('CSS revert complete!');
