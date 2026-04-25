// account.js — Flipkart-style Account Center Logic

document.addEventListener('DOMContentLoaded', () => {
  if (localStorage.getItem('isLoggedIn') !== 'true') {
    window.location.href = 'login.html';
    return;
  }

  // ── Load user data ──
  const firstName = localStorage.getItem('userFirstName') || 'Jane';
  const lastName = localStorage.getItem('userLastName') || 'Doe';
  const email = localStorage.getItem('userEmail') || 'jane.doe@example.com';
  const phone = localStorage.getItem('userPhone') || '';
  const gender = localStorage.getItem('userGender') || '';

  function refreshUI() {
    const fn = localStorage.getItem('userFirstName') || 'Jane';
    const ln = localStorage.getItem('userLastName') || 'Doe';
    const em = localStorage.getItem('userEmail') || 'jane.doe@example.com';
    const ph = localStorage.getItem('userPhone') || '';
    const gn = localStorage.getItem('userGender') || '';
    document.getElementById('sidebarAvatar').textContent = fn.charAt(0).toUpperCase();
    document.getElementById('sidebarName').textContent = fn + ' ' + ln;
    document.getElementById('profileAvatar').textContent = fn.charAt(0).toUpperCase();
    document.getElementById('profileFullName').textContent = fn + ' ' + ln;
    document.getElementById('profileEmail2').textContent = em;
    document.getElementById('dispFirstName').textContent = fn;
    document.getElementById('dispLastName').textContent = ln;
    document.getElementById('dispEmail').textContent = em;
    document.getElementById('dispPhone').textContent = ph || 'Not set';
    document.getElementById('dispGender').textContent = gn || 'Not set';
    updateBadges();
  }

  function updateBadges() {
    const wishlist = JSON.parse(localStorage.getItem('shopiq_wishlist') || '[]');
    const cart = JSON.parse(localStorage.getItem('shopiq_cart') || '[]');
    const wlBadge = document.getElementById('wishlistCount');
    const cartBadge = document.getElementById('cartCount');
    if (wlBadge) {
      wlBadge.textContent = wishlist.length;
      wlBadge.style.display = wishlist.length > 0 ? 'inline-block' : 'none';
    }
    if (cartBadge) {
      cartBadge.textContent = cart.length;
      cartBadge.style.display = cart.length > 0 ? 'inline-block' : 'none';
    }

    // Update Header Account link
    const loginLink = document.querySelector('a[href="account.html"]');
    if (loginLink) {
      const fn = localStorage.getItem('userFirstName') || 'User';
      loginLink.innerHTML = `<i class="fas fa-user-circle"></i> ${fn}`;
    }

    // Update theme toggle icon
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      const isDark = document.documentElement.classList.contains('dark-theme');
      themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
  }
  refreshUI();

  // ── Header Search Logic ──
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn && searchInput) {
    const doSearch = () => {
      const q = searchInput.value.trim();
      if (q) window.location.href = `index.html?q=${encodeURIComponent(q)}`;
    };
    searchBtn.addEventListener('click', doSearch);
    searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') doSearch(); });
  }

  // Theme Toggle Listener
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.classList.toggle('dark-theme');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      updateBadges(); // Refresh icon
    });
  }

  // ── Sidebar navigation ──
  document.querySelectorAll('.acc-menu-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.acc-menu-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.acc-section').forEach(s => s.classList.remove('active'));
      const sec = document.getElementById('sec-' + item.dataset.section);
      if (sec) sec.classList.add('active');
    });
  });

  // ── Profile edit ──
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const profileFields = document.getElementById('profileFields');
  const profileEditForm = document.getElementById('profileEditForm');

  editBtn.addEventListener('click', () => {
    document.getElementById('editFirstName').value = localStorage.getItem('userFirstName') || 'Jane';
    document.getElementById('editLastName').value = localStorage.getItem('userLastName') || 'Doe';
    document.getElementById('editEmail').value = localStorage.getItem('userEmail') || 'jane.doe@example.com';
    document.getElementById('editPhone').value = localStorage.getItem('userPhone') || '';
    document.getElementById('editGender').value = localStorage.getItem('userGender') || '';
    profileFields.style.display = 'none';
    profileEditForm.style.display = 'block';
    editBtn.style.display = 'none';
  });

  cancelBtn.addEventListener('click', () => {
    profileFields.style.display = 'block';
    profileEditForm.style.display = 'none';
    editBtn.style.display = 'block';
  });

  saveBtn.addEventListener('click', () => {
    localStorage.setItem('userFirstName', document.getElementById('editFirstName').value.trim());
    localStorage.setItem('userLastName', document.getElementById('editLastName').value.trim());
    localStorage.setItem('userEmail', document.getElementById('editEmail').value.trim());
    localStorage.setItem('userPhone', document.getElementById('editPhone').value.trim());
    localStorage.setItem('userGender', document.getElementById('editGender').value);
    refreshUI();
    profileFields.style.display = 'block';
    profileEditForm.style.display = 'none';
    editBtn.style.display = 'block';
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = '#2e7d32';
    setTimeout(() => { saveBtn.textContent = 'Save'; saveBtn.style.background = '#2874f0'; }, 1500);
  });

  // ── Orders (demo data) ──
  const orders = [
    { id: 'SIQ-2026-0412', name: 'Apple iPhone 15 (128GB, Blue)', price: '₹62,999', date: 'Apr 12, 2026', status: 'delivered', emoji: '📱' },
    { id: 'SIQ-2026-0328', name: 'Samsung Galaxy Buds2 Pro', price: '₹12,999', date: 'Mar 28, 2026', status: 'delivered', emoji: '🎧' },
    { id: 'SIQ-2026-0415', name: 'MacBook Air M3 (256GB)', price: '₹1,09,990', date: 'Apr 15, 2026', status: 'transit', emoji: '💻' },
    { id: 'SIQ-2026-0220', name: 'OnePlus Nord CE 3 Lite', price: '₹17,999', date: 'Feb 20, 2026', status: 'cancelled', emoji: '📱' },
    { id: 'SIQ-2026-0410', name: 'Sony WH-1000XM5 Headphones', price: '₹24,990', date: 'Apr 10, 2026', status: 'delivered', emoji: '🎧' },
  ];

  const statusLabel = { delivered: 'Delivered', transit: 'In Transit', cancelled: 'Cancelled' };
  let ordersHtml = '';
  orders.forEach(o => {
    ordersHtml += `<div class="order-card">
      <div class="order-top">
        <span class="order-id">Order #${o.id} · ${o.date}</span>
        <span class="order-status ${o.status}">${statusLabel[o.status]}</span>
      </div>
      <div class="order-body">
        <div class="order-img-placeholder">${o.emoji}</div>
        <div class="order-info">
          <div class="order-name">${o.name}</div>
          <div class="order-meta">Bought via ShopIQ price comparison</div>
        </div>
        <div class="order-price">${o.price}</div>
      </div>
    </div>`;
  });
  document.getElementById('ordersList').innerHTML = ordersHtml;

  // ── Wishlist ──
  let wishlist = JSON.parse(localStorage.getItem('shopiq_wishlist') || '[]');
  if (wishlist.length === 0) {
    wishlist = [
      { title: 'iPhone 15 Pro Max (256GB)', price: 159900, priceStr: '₹1,59,900', thumbnail: '', emoji: '📱' },
      { title: 'Samsung Galaxy S24 Ultra', price: 129999, priceStr: '₹1,29,999', thumbnail: '', emoji: '📱' },
      { title: 'Dell XPS 15 Laptop', price: 149990, priceStr: '₹1,49,990', thumbnail: '', emoji: '💻' },
      { title: 'Sony WF-1000XM5 Earbuds', price: 19990, priceStr: '₹19,990', thumbnail: '', emoji: '🎧' },
    ];
  }

  function renderWishlist() {
    const grid = document.getElementById('wishGrid');
    document.getElementById('wishCount').textContent = wishlist.length + ' items';
    document.getElementById('wishBadge').textContent = wishlist.length;
    if (wishlist.length === 0) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">❤️</div><div class="empty-state-title">Your wishlist is empty</div><div class="empty-state-desc">Save items you love while comparing prices</div><button class="empty-state-btn" onclick="window.location.href=\'index.html\'">Start Shopping</button></div>';
      return;
    }
    let html = '';
    wishlist.forEach((item, i) => {
      const displayTitle = item.title || item.name;
      const displayPrice = item.priceStr || (item.price ? '₹' + item.price.toLocaleString('en-IN') : 'N/A');
      const thumbnail = item.thumbnail || (item.specs && item.specs.image) || '';
      
      html += `<div class="wish-card" onclick="window.location.href='index.html?q=${encodeURIComponent(displayTitle)}'">
        <div class="wish-img-placeholder">${thumbnail ? `<img src="${thumbnail}" style="width:100%;height:100%;object-fit:contain;">` : (item.emoji || '🛒')}</div>
        <div class="wish-body">
          <div class="wish-name" title="${displayTitle}">${displayTitle}</div>
          <div class="wish-price">${displayPrice}</div>
          <span class="wish-remove" data-idx="${i}" onclick="event.stopPropagation()">✕</span>
        </div>
      </div>`;
    });
    grid.innerHTML = html;
    grid.querySelectorAll('.wish-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(btn.dataset.idx);
        wishlist.splice(idx, 1);
        localStorage.setItem('shopiq_wishlist', JSON.stringify(wishlist));
        renderWishlist();
        updateBadges();
      });
    });
  }
  renderWishlist();

  // ── Addresses ──
  let addresses = JSON.parse(localStorage.getItem('shopiq_addresses') || '[]');
  if (addresses.length === 0) {
    addresses = [
      { type: 'Home', name: firstName + ' ' + lastName, addr: '123, MG Road, Koramangala\nBengaluru, Karnataka 560095', phone: '+91 98765 43210', default: true },
      { type: 'Office', name: firstName + ' ' + lastName, addr: 'Tower B, 5th Floor, IT Park\nPune, Maharashtra 411057', phone: '+91 87654 32109', default: false },
    ];
  }

  function renderAddresses() {
    const grid = document.getElementById('addrGrid');
    let html = '';
    addresses.forEach((a, i) => {
      html += `<div class="addr-card ${a.default ? 'default' : ''}">
        <span class="addr-type">${a.type}${a.default ? ' · Default' : ''}</span>
        <div class="addr-name">${a.name}</div>
        <div class="addr-detail">${a.addr.replace(/\n/g, '<br>')}</div>
        <div class="addr-phone">📞 ${a.phone}</div>
        <div class="addr-actions">
          ${!a.default ? '<button onclick="setDefaultAddr(' + i + ')">Set as Default</button>' : ''}
          <button class="del" onclick="removeAddr(${i})">Remove</button>
        </div>
      </div>`;
    });
    html += '<div class="addr-add-card" onclick="addNewAddr()"><span style="font-size:2rem;">+</span><span style="font-weight:600;margin-top:.5rem;">Add New Address</span></div>';
    grid.innerHTML = html;
  }
  renderAddresses();

  window.setDefaultAddr = function(i) {
    addresses.forEach(a => a.default = false);
    addresses[i].default = true;
    localStorage.setItem('shopiq_addresses', JSON.stringify(addresses));
    renderAddresses();
  };
  window.removeAddr = function(i) {
    addresses.splice(i, 1);
    localStorage.setItem('shopiq_addresses', JSON.stringify(addresses));
    renderAddresses();
  };
  window.addNewAddr = function() {
    const name = prompt('Full Name:');
    if (!name) return;
    const addr = prompt('Address (line 1, line 2):');
    const ph = prompt('Phone number:');
    const type = prompt('Type (Home/Office/Other):') || 'Home';
    addresses.push({ type, name, addr: addr || '', phone: ph || '', default: false });
    localStorage.setItem('shopiq_addresses', JSON.stringify(addresses));
    renderAddresses();
  };

  // ── Notifications ──
  const notifications = [
    { icon: 'price', emoji: '📉', text: '<strong>Price Drop!</strong> iPhone 15 dropped to ₹62,999 on Amazon', time: '2 hours ago' },
    { icon: 'order', emoji: '📦', text: '<strong>Order Update:</strong> MacBook Air M3 is out for delivery', time: '5 hours ago' },
    { icon: 'promo', emoji: '🎉', text: '<strong>Flash Sale:</strong> Up to 40% off on electronics this weekend', time: '1 day ago' },
    { icon: 'price', emoji: '📉', text: '<strong>Price Alert:</strong> Samsung Galaxy S24 Ultra is at its lowest ever!', time: '2 days ago' },
    { icon: 'promo', emoji: '🏷️', text: '<strong>New Feature:</strong> Compare prices across Tata CLiQ now available', time: '3 days ago' },
  ];

  let notifHtml = '';
  notifications.forEach(n => {
    notifHtml += `<div class="notif-item">
      <div class="notif-icon ${n.icon}">${n.emoji}</div>
      <div><div class="notif-text">${n.text}</div><div class="notif-time">${n.time}</div></div>
    </div>`;
  });
  document.getElementById('notifList').innerHTML = notifHtml;
  document.getElementById('notifBadge').textContent = notifications.length;

  // Member since
  document.getElementById('memberSince').textContent = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
});

function logout() {
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userFirstName');
  localStorage.removeItem('userLastName');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userPhone');
  localStorage.removeItem('userGender');
  window.location.href = 'login.html';
}
