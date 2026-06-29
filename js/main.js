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
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    contactForm.innerHTML = '<div style="text-align:center;padding:3rem 2rem"><h3 style="font-family:Cormorant Garamond,serif;font-size:2rem;color:var(--gold);margin-bottom:1rem">Thank You</h3><p style="color:var(--text-light);font-size:0.85rem">Your message has been received. Nelly will be in touch soon.</p></div>';
  });
}


// ── MEGA MENU ──
document.addEventListener('DOMContentLoaded', function() {
  var boutiqueLink = null;
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    if (a.textContent.trim().toUpperCase() === 'THE BOUTIQUE' || 
        a.textContent.trim().toUpperCase() === 'BOUTIQUE' ||
        a.getAttribute('href')?.includes('boutique')) {
      boutiqueLink = a;
    }
  });
  if (!boutiqueLink) return;

  // Wrap the link's parent li for positioning
  var li = boutiqueLink.parentElement;
  li.style.position = 'relative';

  // Create mega menu
  var mega = document.createElement('div');
  mega.className = 'mega-menu';
  mega.innerHTML = '<div class="mega-inner">' +
    '<a href="' + boutiqueLink.getAttribute('href') + '#earrings" class="mega-cat" data-filter="earrings">' +
      '<div class="mega-img"><img src="/images/new-golden-south-sea-pearl-huggies.jpg" alt="Earrings" loading="lazy"></div>' +
      '<span class="mega-label">Earrings</span>' +
    '</a>' +
    '<a href="' + boutiqueLink.getAttribute('href') + '#necklaces" class="mega-cat" data-filter="necklaces">' +
      '<div class="mega-img"><img src="/images/22k-gold-organic-gothic-cross-necklace.jpg" alt="Necklaces" loading="lazy"></div>' +
      '<span class="mega-label">Necklaces</span>' +
    '</a>' +
    '<a href="' + boutiqueLink.getAttribute('href') + '#bracelets" class="mega-cat" data-filter="bracelets">' +
      '<div class="mega-img"><img src="/images/small-gold-diamond-links-bracelet.jpg" alt="Bracelets" loading="lazy"></div>' +
      '<span class="mega-label">Bracelets</span>' +
    '</a>' +
    '<a href="' + boutiqueLink.getAttribute('href') + '#rings" class="mega-cat" data-filter="rings">' +
      '<div class="mega-img"><img src="/images/white-gold-oval-eternity-ring.jpg" alt="Rings" loading="lazy"></div>' +
      '<span class="mega-label">Rings</span>' +
    '</a>' +
    '<a href="' + boutiqueLink.getAttribute('href') + '#brooches" class="mega-cat" data-filter="brooches">' +
      '<div class="mega-img"><img src="/images/champagne-gold-peony-flower-brooch.jpg" alt="Brooches" loading="lazy"></div>' +
      '<span class="mega-label">Brooches</span>' +
    '</a>' +
    '<a href="' + boutiqueLink.getAttribute('href') + '" class="mega-view-all">View All Pieces</a>' +
  '</div>';

  document.body.appendChild(mega);

  // Position and show/hide
  var showTimer, hideTimer;

  function showMega() {
    clearTimeout(hideTimer);
    var rect = boutiqueLink.getBoundingClientRect();
    mega.style.top = rect.bottom + 'px';
    mega.style.left = '0';
    mega.style.right = '0';
    mega.classList.add('mega-open');
  }

  function hideMega() {
    hideTimer = setTimeout(function() {
      mega.classList.remove('mega-open');
    }, 200);
  }

  boutiqueLink.addEventListener('mouseenter', showMega);
  boutiqueLink.addEventListener('mouseleave', hideMega);
  mega.addEventListener('mouseenter', function() { clearTimeout(hideTimer); });
  mega.addEventListener('mouseleave', hideMega);

  // Don't show on mobile
  if (window.innerWidth < 900) {
    mega.style.display = 'none';
  }
  window.addEventListener('resize', function() {
    mega.style.display = window.innerWidth < 900 ? 'none' : '';
  });
});
