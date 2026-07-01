// ── SHARED SITE JS ──

// Nav scroll effect + active links
const nav = document.querySelector('.site-nav');
window.addEventListener('scroll', () => {
  nav && nav.classList.toggle('scrolled', window.scrollY > 20);
});

// Mobile nav toggle
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');
if (toggle && navLinks) {
  toggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
    // Animate hamburger → X
    const spans = toggle.querySelectorAll('span');
    if (isOpen) {
      spans[0].style.transform = 'translateY(6.5px) rotate(45deg)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'translateY(-6.5px) rotate(-45deg)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });
  // Close nav when a link is tapped
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
  // Close nav when tapping outside
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      toggle.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// Mark active nav link
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === currentPage) a.classList.add('active');
});

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
revealEls.forEach(el => revealObserver.observe(el));

// FAQ accordion
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-q');
  const ans = item.querySelector('.faq-a');
  if (!btn || !ans) return;
  btn.addEventListener('click', () => {
    const open = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(o => {
      o.classList.remove('open');
      o.querySelector('.faq-a').style.maxHeight = '0';
    });
    if (!open) {
      item.classList.add('open');
      ans.style.maxHeight = ans.scrollHeight + 'px';
    }
  });
});

// Newsletter form
const newsForm = document.querySelector('.newsletter-form');
if (newsForm) {
  newsForm.addEventListener('submit', e => {
    e.preventDefault();
    const input = newsForm.querySelector('input');
    newsForm.innerHTML = '<p style="color:rgba(255,255,255,0.9);font-size:0.85rem;padding:0.9rem;letter-spacing:0.1em;">Thank you — you\'re on the list! ✦</p>';
  });
}

// Contact form
var contactForm = document.querySelector('.contact-form') || document.getElementById('contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var btn = contactForm.querySelector('button[type="submit"], input[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }
    var formData = new FormData(contactForm);
    var data = {};
    formData.forEach(function(val, key) { data[key] = val; });
    fetch('/api/send-contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(res) {
      if (res.ok) {
        contactForm.innerHTML = '<div style="text-align:center;padding:3rem 2rem"><h3 style="font-family:Cormorant Garamond,serif;font-size:2rem;color:var(--gold);margin-bottom:1rem">Thank You</h3><p style="color:var(--text-light);font-size:0.85rem">Your message has been received. Nelly will be in touch soon.</p></div>';
      } else {
        if (btn) { btn.textContent = 'Try Again'; btn.disabled = false; }
      }
    }).catch(function() {
      if (btn) { btn.textContent = 'Try Again'; btn.disabled = false; }
    });
  });
}







// ── HINT MODAL STYLING + FORM FIX ──
(function() {
  var s = document.createElement('style');
  s.textContent = '.hint-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;padding:1.5rem}.hint-modal-panel{background:#fff;max-width:480px;width:100%;padding:2.5rem;position:relative;max-height:90vh;overflow-y:auto}.hint-modal-close{position:absolute;top:1rem;right:1.2rem;background:none;border:none;font-size:1.8rem;cursor:pointer;color:#555;line-height:1}.hint-modal-subtitle{font-size:0.85rem;color:#555;margin-bottom:1.5rem}.hint-textarea{width:100%;min-height:80px;border:1px solid #E8E8E8;padding:0.8rem 1rem;font-family:Jost,sans-serif;font-size:0.85rem;resize:vertical;outline:none;margin-bottom:0.5rem}.hint-textarea:focus{border-color:#B8962E}.hint-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:0.8rem;margin-bottom:1.5rem}.hint-send-btn{display:flex;flex-direction:column;align-items:center;gap:0.5rem;padding:1rem;border:1px solid #E8E8E8;background:#fff;cursor:pointer;transition:border-color .2s,background .2s}.hint-send-btn:hover{border-color:#B8962E;background:#FAFAF8}.hint-divider{border-top:1px solid #E8E8E8;padding-top:1.5rem;margin-top:0.5rem}.hint-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:1rem}.hint-label{font-size:0.6rem;letter-spacing:0.18em;text-transform:uppercase;color:#555;display:block;margin-bottom:0.3rem}.hint-input{width:100%;height:44px;border:1px solid #E8E8E8;padding:0 1rem;font-family:Jost,sans-serif;font-size:0.85rem;outline:none}.hint-input:focus{border-color:#B8962E}.hint-submit{width:100%;height:48px;background:#0A0A0A;color:#fff;border:none;font-family:Jost,sans-serif;font-size:0.65rem;letter-spacing:0.25em;text-transform:uppercase;cursor:pointer;transition:background .2s}.hint-submit:hover{background:#B8962E}.hint-submit:disabled{background:#999;cursor:not-allowed}.hint-modal-success{display:none;font-size:0.85rem;color:#B8962E;margin-top:0.8rem;text-align:center}.pdp-hint-btn{display:inline-flex;align-items:center;gap:0.5rem;padding:0.7rem 1.5rem;border:1px solid #B8962E;background:#B8962E;color:#fff;font-family:Jost,sans-serif;font-size:0.6rem;letter-spacing:0.2em;text-transform:uppercase;cursor:pointer;transition:background .2s}.pdp-hint-btn:hover{background:#8A6E1C}@media(max-width:600px){.hint-grid-3{grid-template-columns:1fr}.hint-grid-2{grid-template-columns:1fr}.hint-modal-panel{padding:1.5rem}}';
  document.head.appendChild(s);

  // Intercept ALL form submits at document level in capturing phase
  // This fires BEFORE any inline handlers on the form itself
  document.addEventListener('submit', function(e) {
    var form = e.target;
    if (!form || form.id !== 'hint-form') return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    var msgEl = document.getElementById('hint-message-hidden');
    var noteEl = document.getElementById('hint-note');
    if (msgEl && noteEl) msgEl.value = noteEl.value;

    var btn = form.querySelector('[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

    var formData = new FormData(form);
    var data = {};
    formData.forEach(function(val, key) { data[key] = val; });

    var titleEl = document.querySelector('h1') || document.querySelector('.pdp-title');
    if (titleEl) data['product-name'] = titleEl.textContent.trim();
    data['product-url'] = window.location.href;

    fetch('/api/send-hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(res) {
      if (res.ok) {
        var c = document.getElementById('hint-sent-confirm');
        if (c) c.style.display = 'block';
        setTimeout(function() {
          var modal = document.getElementById('hint-modal');
          if (modal) modal.style.display = 'none';
          if (c) c.style.display = 'none';
          form.reset();
          if (btn) { btn.disabled = false; btn.textContent = 'Send via Nelly Creative Studios'; }
        }, 2500);
      } else {
        if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; }
      }
    }).catch(function() {
      if (btn) { btn.disabled = false; btn.textContent = 'Try Again'; }
    });
  }, true);
})();
