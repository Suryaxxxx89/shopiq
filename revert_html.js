const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const originalCompareHTML = `  <!-- ==================== COMPARE PAGE ==================== -->
  <div id="comparePage" class="page" style="display:none;">

    <button id="backButton" class="back-btn back-to-search">\u2190 Back to Search</button>

    <!-- Product Hero -->
    <div id="compareHeader" class="card compare-header-card" style="padding:2rem;">
      <div style="display:flex;gap:2rem;align-items:flex-start;flex-wrap:wrap;">
        <!-- Product Image -->
        <div id="compareImage" style="flex:0 0 220px;">
          <div style="background:var(--card-bg,#fff);border-radius:16px;padding:1rem;border:1px solid var(--border-color,#e2e8f0);">
            <img id="compareProductImg" src="" alt="Product" style="width:100%;height:200px;object-fit:contain;" onerror="this.src='https://placehold.co/220x200/f1f5f9/94a3b8?text=No+Image'">
          </div>
        </div>
        <!-- Product Info -->
        <div style="flex:1;min-width:0;">
          <h2 id="compareTitle" class="compare-title" style="margin-bottom:0.5rem;"></h2>
          <div id="compareSummary" class="compare-summary" style="margin-bottom:1rem;"></div>
          
          <!-- Specs Table -->
          <div id="specsTableWrap" style="margin-bottom:1.2rem;"></div>

          <!-- Buy Now CTA -->
          <a id="buyLowestBtn" href="#" target="_blank" rel="noopener noreferrer" style="
            display:inline-flex;align-items:center;gap:0.5rem;
            background:linear-gradient(135deg,#059669,#10b981);color:#fff;
            padding:0.8rem 2rem;border-radius:10px;font-weight:800;font-size:1rem;
            text-decoration:none;box-shadow:0 4px 15px rgba(5,150,105,0.3);
            transition:transform 0.2s;
          " onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
            \uD83D\uDED2 Buy at Lowest Price \u2014 <span id="lowestPriceLabel"></span>
          </a>
        </div>
      </div>
    </div>

    <!-- Store Price Comparison -->
    <div id="graphCardCompare" class="chart-card">
      <div class="chart-title">\uD83D\uDCB0 Price Comparison Across Stores</div>
      <div id="priceChartCompare" class="chart-box"></div>
      <div id="storeLinksCompare" class="store-links-area" style="display:none;"></div>
    </div>

    <!-- Price History -->
    <div id="priceHistoryCard" class="chart-card">
      <div class="chart-title">\uD83D\uDCC8 Price History (Last 2 Months)</div>
      <div id="priceHistoryChart" class="chart-box">
        <svg id="historyChartSvg" class="history-chart-svg"></svg>
      </div>
      <div class="price-insights-box">
        <div class="insights-title">\uD83D\uDCA1 Price Insights</div>
        <div id="priceInsight" class="insights-content"></div>
      </div>
    </div>

    <!-- Customer Reviews Card -->
    <div id="reviewsCard" class="chart-card">
      <div class="chart-title">\uD83D\uDDE3\uFE0F Customer Reviews</div>
      <div id="reviewsList" class="reviews-container"></div>
    </div>

  </div><!-- /comparePage -->`;

const startIdx = html.indexOf('  <!-- ==================== COMPARE PAGE');
const endIdx = html.indexOf('</div><!-- /comparePage -->') + '</div><!-- /comparePage -->'.length;

if (startIdx !== -1 && endIdx !== -1) {
  html = html.substring(0, startIdx) + originalCompareHTML + html.substring(endIdx);
  fs.writeFileSync('index.html', html);
  console.log('index.html restored');
} else {
  console.log('Error restoring index.html');
}
