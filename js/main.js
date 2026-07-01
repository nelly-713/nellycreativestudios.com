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


// ── MEGA MENU (injected via JS — no CSS file changes) ──
(function() {
  if (window.innerWidth < 900) return;

  var boutiqueLink = null;
  document.querySelectorAll('.nav-links a').forEach(function(a) {
    var txt = a.textContent.trim().toUpperCase();
    if (txt === 'THE BOUTIQUE' || txt === 'BOUTIQUE') boutiqueLink = a;
  });
  if (!boutiqueLink) return;

  // Inject CSS
  var css = document.createElement('style');
  css.textContent = [
    '.ncs-mega{position:fixed;top:0;left:0;right:0;z-index:9999;background:#FAFAF8;border-bottom:1px solid rgba(0,0,0,0.06);box-shadow:0 8px 40px rgba(0,0,0,0.08);opacity:0;visibility:hidden;transform:translateY(-6px);transition:opacity .3s,transform .3s,visibility .3s;pointer-events:none}',
    '.ncs-mega.open{opacity:1;visibility:visible;transform:translateY(0);pointer-events:auto}',
    '.ncs-mega-inner{max-width:1000px;margin:0 auto;padding:2.2rem 2rem 1.8rem;display:flex;gap:1.8rem;justify-content:center;align-items:flex-start}',
    '.ncs-mega-cat{text-decoration:none;text-align:center;flex:0 0 150px;transition:transform .3s}',
    '.ncs-mega-cat:hover{transform:translateY(-3px)}',
    '.ncs-mega-cat .img{width:150px;height:150px;overflow:hidden;background:#F0EDE8}',
    '.ncs-mega-cat .img img{width:100%;height:100%;object-fit:cover;transition:transform .5s;filter:saturate(.9)}',
    '.ncs-mega-cat:hover .img img{transform:scale(1.05);filter:saturate(1.1)}',
    '.ncs-mega-cat .lbl{font-family:Jost,sans-serif;font-size:.6rem;letter-spacing:.26em;text-transform:uppercase;color:#1B2A4A;display:block;margin-top:.6rem}',
    '.ncs-mega-all{display:block;width:100%;text-align:center;margin-top:1.2rem;padding-top:1rem;border-top:1px solid rgba(0,0,0,0.06);font-family:Jost,sans-serif;font-size:.58rem;letter-spacing:.26em;text-transform:uppercase;color:#B8962E;text-decoration:none;transition:color .3s}',
    '.ncs-mega-all:hover{color:#1B2A4A}',
    '@media(max-width:900px){.ncs-mega{display:none!important}}'
  ].join('');
  document.head.appendChild(css);

  // Build menu
  var href = boutiqueLink.getAttribute('href') || 'pages/boutique.html';
  var cats = [
    {name:'Earrings', img:'/images/new-golden-south-sea-pearl-huggies.jpg', filter:'earrings'},
    {name:'Necklaces', img:'/images/22k-gold-organic-gothic-cross-necklace.jpg', filter:'necklaces'},
    {name:'Bracelets', img:'/images/small-gold-diamond-links-bracelet.jpg', filter:'bracelets'},
    {name:'Rings', img:'/images/white-gold-oval-eternity-ring.jpg', filter:'rings'},
    {name:'Brooches', img:'/images/champagne-gold-peony-flower-brooch.jpg', filter:'brooches'}
  ];

  var el = document.createElement('div');
  el.className = 'ncs-mega';
  var html = '<div class="ncs-mega-inner">';
  cats.forEach(function(c) {
    html += '<a href="' + href + '" class="ncs-mega-cat" data-filter="' + c.filter + '">' +
      '<div class="img"><img src="' + c.img + '" alt="' + c.name + '" loading="lazy"></div>' +
      '<span class="lbl">' + c.name + '</span></a>';
  });
  html += '</div><a href="' + href + '" class="ncs-mega-all">View All Pieces</a>';
  el.innerHTML = html;
  document.body.appendChild(el);

  // Show/hide
  var timer;
  function show() {
    clearTimeout(timer);
    var r = boutiqueLink.getBoundingClientRect();
    el.style.top = r.bottom + 'px';
    el.classList.add('open');
  }
  function hide() { timer = setTimeout(function() { el.classList.remove('open'); }, 180); }

  boutiqueLink.addEventListener('mouseenter', show);
  boutiqueLink.addEventListener('mouseleave', hide);
  el.addEventListener('mouseenter', function() { clearTimeout(timer); });
  el.addEventListener('mouseleave', hide);
})();
