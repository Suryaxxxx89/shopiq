const fs = require('fs');
let css = fs.readFileSync('testp.css', 'utf8');

// Find and replace the product card CSS block
const startMarker = '.results-grid {';
const endMarker = '.view-deal-btn {';

const startIdx = css.indexOf(startMarker);
const endIdx = css.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.log('Could not find CSS markers:', startIdx, endIdx);
  process.exit(1);
}

const newCSS = `.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 1.2rem;
}

.product-card {
  position: relative;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
}

.product-card:hover {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  transform: translateY(-3px);
  border-color: #d1d5db;
}

.product-thumb {
  width: 100%;
  height: 180px;
  object-fit: contain;
  background: #fafafa;
  padding: 1rem;
}

.product-card-body {
  padding: 0.8rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  flex: 1;
}

.product-card-title {
  font-size: 0.85rem;
  color: #1f2937;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-weight: 500;
  min-height: 2.4em;
}

.product-price-row {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-top: 0.3rem;
}

.product-card-price {
  font-size: 1.3rem;
  font-weight: 900;
  color: #111827;
}

.product-mrp {
  font-size: 0.85rem;
  color: #9ca3af;
  text-decoration: line-through;
}

.product-discount {
  font-size: 0.78rem;
  color: #059669;
  font-weight: 700;
}

.product-lowest-badge {
  font-size: 0.75rem;
  color: #059669;
  font-weight: 600;
  margin-bottom: 0.3rem;
}

.card-store-prices {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.4rem;
  padding-top: 0.5rem;
  border-top: 1px solid #f3f4f6;
}

.card-store-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.25rem 0.4rem;
  border-radius: 6px;
  font-size: 0.78rem;
}

.card-store-best { background: #ecfdf5; }
.card-store-name { flex: 1; color: #4b5563; font-weight: 500; }
.card-store-price { font-weight: 700; color: #1f2937; }
.card-store-best .card-store-price { color: #059669; }

/* Dark mode card overrides */
[data-theme="dark"] .product-card { background: var(--card-bg); border-color: var(--border-color); }
[data-theme="dark"] .product-card-title { color: var(--text-main); }
[data-theme="dark"] .product-card-price { color: var(--text-main); }
[data-theme="dark"] .product-thumb { background: var(--bg-color); }
[data-theme="dark"] .card-store-prices { border-color: var(--border-color); }
[data-theme="dark"] .card-store-name { color: var(--text-muted); }
[data-theme="dark"] .card-store-price { color: var(--text-main); }
[data-theme="dark"] .card-store-best { background: rgba(5,150,105,0.1); }
[data-theme="dark"] .product-mrp { color: #6b7280; }

`;

css = css.substring(0, startIdx) + newCSS + css.substring(endIdx);
fs.writeFileSync('testp.css', css);
console.log('CSS updated!');
