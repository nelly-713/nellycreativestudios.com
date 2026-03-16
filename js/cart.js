/* ═══════════════════════════════════════
   NELLY CREATIVE STUDIOS — CART SYSTEM
═══════════════════════════════════════ */
(function() {
  'use strict';

  var CART_KEY = 'ncs_cart';

  // ── Cart State ──
  var Cart = {
    items: [],

    load: function() {
      try {
        this.items = JSON.parse(localStorage.getItem(CART_KEY)) || [];
      } catch(e) {
        this.items = [];
      }
    },

    save: function() {
      localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    },

    add: function(product) {
      var existing = this.items.find(function(i) { return i.id === product.id; });
      if (existing) {
        existing.qty = Math.min(10, existing.qty + 1);
      } else {
        this.items.push({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price),
          image: product.image,
          qty: 1
        });
      }
      this.save();
    },

    remove: function(id) {
      this.items = this.items.filter(function(i) { return i.id !== id; });
      this.save();
    },

    updateQty: function(id, delta) {
      var item = this.items.find(function(i) { return i.id === id; });
      if (!item) return;
      item.qty = Math.max(1, Math.min(10, item.qty + delta));
      this.save();
    },

    total: function() {
      return this.items.reduce(function(sum, i) { return sum + i.price * i.qty; }, 0);
    },

    count: function() {
      return this.items.reduce(function(sum, i) { return sum + i.qty; }, 0);
    },

    clear: function() {
      this.items = [];
      this.save();
    }
  };

  // ── Format price ──
  function fmt(n) {
    return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // ── Inject cart drawer HTML ──
  function injectCart() {
    var html = [
      '<div class="cart-overlay" id="cart-overlay"></div>',
      '<div class="cart-drawer" id="cart-drawer">',
      '  <div class="cart-header">',
      '    <div><span class="cart-header-title">Your Cart</span><span class="cart-count-badge" id="cart-header-count"></span></div>',
      '    <button class="cart-close-btn" id="cart-close-btn" aria-label="Close cart">',
      '      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      '    </button>',
      '  </div>',
      '  <div class="cart-items" id="cart-items-container"></div>',
      '  <div class="cart-footer" id="cart-footer">',
      '    <div class="cart-subtotal">',
      '      <span class="cart-subtotal-label">Subtotal</span>',
      '      <span class="cart-subtotal-value" id="cart-total-display">$0.00</span>',
      '    </div>',
      '    <div class="cart-note">Shipping and taxes calculated at checkout</div>',
      '    <button class="cart-checkout-btn" id="cart-checkout-btn">',
      '      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      '      Checkout',
      '    </button>',
      '    <button class="cart-continue-btn" id="cart-continue-btn">Continue Shopping</button>',
      '  </div>',
      '</div>'
    ].join('');

    var wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper.firstElementChild);
    document.body.appendChild(wrapper.lastElementChild);
  }

  // ── Render cart items ──
  function renderCart() {
    var container = document.getElementById('cart-items-container');
    if (!container) return;

    Cart.load();
    var items = Cart.items;
    var count = Cart.count();
    var total = Cart.total();

    // Update badge
    updateBadge(count);

    // Update header count
    var headerCount = document.getElementById('cart-header-count');
    if (headerCount) {
      headerCount.textContent = count > 0 ? count + ' ' + (count === 1 ? 'item' : 'items') : '';
    }

    // Update total
    var totalDisplay = document.getElementById('cart-total-display');
    if (totalDisplay) totalDisplay.textContent = fmt(total);

    // Checkout button
    var checkoutBtn = document.getElementById('cart-checkout-btn');
    if (checkoutBtn) checkoutBtn.disabled = items.length === 0;

    if (items.length === 0) {
      container.innerHTML = [
        '<div class="cart-empty">',
        '  <div class="cart-empty-icon">',
        '    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>',
        '  </div>',
        '  <div class="cart-empty-text">Your cart is empty</div>',
        '  <a href="/pages/boutique.html" class="cart-empty-link">Explore the Boutique</a>',
        '</div>'
      ].join('');
      return;
    }

    var html = items.map(function(item) {
      return [
        '<div class="cart-item" data-id="' + item.id + '">',
        '  <div class="cart-item-img">',
        '    <img src="' + item.image + '" alt="' + item.name + '">',
        '  </div>',
        '  <div class="cart-item-details">',
        '    <div class="cart-item-name">' + item.name + '</div>',
        '    <div class="cart-item-price">' + fmt(item.price * item.qty) + '</div>',
        '    <div class="cart-item-qty">',
        '      <button class="cart-item-qty-btn" data-id="' + item.id + '" data-delta="-1">−</button>',
        '      <div class="cart-item-qty-val">' + item.qty + '</div>',
        '      <button class="cart-item-qty-btn" data-id="' + item.id + '" data-delta="1">+</button>',
        '    </div>',
        '  </div>',
        '  <button class="cart-item-remove" data-id="' + item.id + '" aria-label="Remove item">',
        '    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        '  </button>',
        '</div>'
      ].join('');
    }).join('');

    container.innerHTML = html;

    // Qty buttons
    container.querySelectorAll('.cart-item-qty-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-id');
        var delta = parseInt(btn.getAttribute('data-delta'));
        Cart.updateQty(id, delta);
        renderCart();
      });
    });

    // Remove buttons
    container.querySelectorAll('.cart-item-remove').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var id = btn.getAttribute('data-id');
        Cart.remove(id);
        renderCart();
      });
    });
  }

  // ── Update nav badge ──
  function updateBadge(count) {
    var badges = document.querySelectorAll('.cart-count-badge');
    badges.forEach(function(badge) {
      badge.textContent = count;
      if (count > 0) {
        badge.classList.add('visible');
      } else {
        badge.classList.remove('visible');
      }
    });
  }

  // ── Open / Close cart ──
  function openCart() {
    renderCart();
    document.getElementById('cart-drawer').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    document.getElementById('cart-drawer').classList.remove('active');
    document.getElementById('cart-overlay').classList.remove('active');
    document.body.style.overflow = '';
  }

  // ── Add to cart (replaces stripeCheckout for "Add to Cart" flow) ──
  window.addToCart = function(btn) {
    var product = {
      id: btn.getAttribute('data-item-id'),
      name: btn.getAttribute('data-item-name'),
      price: btn.getAttribute('data-item-price'),
      image: btn.getAttribute('data-item-image') || ''
    };

    Cart.load();
    Cart.add(product);

    // Button feedback
    var originalText = btn.textContent;
    btn.textContent = '✓ Added';
    btn.classList.add('added');
    setTimeout(function() {
      btn.textContent = originalText;
      btn.classList.remove('added');
    }, 1500);

    // Update badge
    updateBadge(Cart.count());

    // Open cart after short delay
    setTimeout(openCart, 300);
  };

  // ── Checkout with all cart items ──
  async function cartCheckout() {
    Cart.load();
    if (Cart.items.length === 0) return;

    var btn = document.getElementById('cart-checkout-btn');
    btn.disabled = true;
    btn.textContent = 'Loading...';

    // Build items string for URL
    var params = new URLSearchParams({
      cart: JSON.stringify(Cart.items),
      total: Cart.total().toFixed(2)
    });

    window.location.href = '/pages/checkout.html?' + params.toString();
  }

  // ── Inject cart button into nav ──
  function injectCartButton() {
    var navs = document.querySelectorAll('.nav');
    navs.forEach(function(nav) {
      if (nav.querySelector('.nav-cart-btn')) return;
      var burger = nav.querySelector('.nav-burger');
      if (!burger) return;

      var cartBtn = document.createElement('button');
      cartBtn.className = 'nav-cart-btn';
      cartBtn.setAttribute('aria-label', 'Open cart');
      cartBtn.innerHTML = [
        '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">',
        '  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>',
        '  <line x1="3" y1="6" x2="21" y2="6"/>',
        '  <path d="M16 10a4 4 0 01-8 0"/>',
        '</svg>',
        '<span class="cart-count-badge" id="cart-badge-' + Math.random().toString(36).substr(2,5) + '"></span>'
      ].join('');
      cartBtn.addEventListener('click', openCart);
      nav.insertBefore(cartBtn, burger);
    });
  }

  // ── Init ──
  document.addEventListener('DOMContentLoaded', function() {
    injectCart();
    injectCartButton();

    Cart.load();
    updateBadge(Cart.count());

    // Close handlers
    document.getElementById('cart-overlay').addEventListener('click', closeCart);
    document.getElementById('cart-close-btn').addEventListener('click', closeCart);
    document.getElementById('cart-continue-btn').addEventListener('click', closeCart);

    // Checkout
    document.getElementById('cart-checkout-btn').addEventListener('click', cartCheckout);

    // Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeCart();
    });
  });
})();
