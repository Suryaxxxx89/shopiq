const fs = require('fs');

// Read the CSS file, handle encoding issues
let css = fs.readFileSync('testp.css', 'utf8');

// Remove null bytes if any
css = css.replace(/\0/g, '');

// Add responsive and PDP styles
const newStyles = `

/* ============================================================
   PDP (FLIPKART-STYLE PRODUCT DETAIL PAGE)
   ============================================================ */
@media (max-width: 780px) {
  #pdpGrid {
    grid-template-columns: 1fr !important;
  }
  #pdpGrid > div:first-child {
    position: static !important;
  }
  #pdpBuyBtns {
    flex-direction: column;
  }
}

/* PDP Buy Buttons */
#buyLowestBtn:hover, #buyLowestBtn2:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,.25);
}

/* Review Items */
.review-item {
  padding: 1rem;
  border-bottom: 1px solid #f1f5f9;
  transition: background .15s;
}
.review-item:last-child { border-bottom: none; }
.review-item:hover { background: #fafbfc; }

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: .4rem;
}

.review-author {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.review-author-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2874f0, #5b9eff);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: .85rem;
}

.review-store-badge {
  font-size: .7rem;
  background: #f1f5f9;
  color: #64748b;
  padding: .15rem .5rem;
  border-radius: 4px;
  font-weight: 600;
}

.review-rating {
  font-size: .8rem;
  margin-bottom: .3rem;
}

.review-text {
  font-size: .88rem;
  color: #374151;
  line-height: 1.55;
}

.review-date {
  font-size: .75rem;
  color: #9ca3af;
}
`;

css += newStyles;
fs.writeFileSync('testp.css', css, 'utf8');
console.log('✅ PDP styles added to testp.css');
