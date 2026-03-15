// Nelly Creative Studios — main.js

// ── NAV state ──
(function(){
  const nav = document.querySelector('.nav');
  if(!nav) return;

  const isDark = nav.classList.contains('nav--dark');

  function update(){
    if(window.scrollY > 60){
      nav.classList.remove('nav--dark','nav--light');
      nav.classList.add('nav--scrolled');
    } else {
      nav.classList.remove('nav--scrolled');
      if(isDark) nav.classList.add('nav--dark');
      else nav.classList.add('nav--light');
    }
  }
  update();
  window.addEventListener('scroll', update, {passive:true});

  // Burger / drawer
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.nav-drawer');
  if(burger && drawer){
    burger.addEventListener('click',()=>{
      const open = drawer.classList.toggle('open');
      burger.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // close on link click
    drawer.querySelectorAll('a').forEach(a=>{
      a.addEventListener('click',()=>{
        drawer.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow='';
      });
    });
  }
})();

// ── Reveal on scroll ──
(function(){
  const els = document.querySelectorAll('.reveal');
  if(!els.length) return;
  if(!('IntersectionObserver' in window)){
    els.forEach(el=>el.classList.add('in')); return;
  }
  const io = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
    });
  },{threshold:0, rootMargin:'0px 0px -50px 0px'});
  els.forEach(el=>io.observe(el));
  // Fallback: show all after 1.5s in case observer doesn't fire
  setTimeout(function(){ els.forEach(el=>el.classList.add('in')); }, 1500);
})();

// ── Hero image pan ──
(function(){
  const img = document.querySelector('.hero__bg img');
  if(!img) return;
  const load = ()=>img.classList.add('loaded');
  if(img.complete) load(); else img.addEventListener('load',load);
})();

// ── FAQ accordion ──
(function(){
  document.querySelectorAll('.faq-q').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const item = btn.closest('.faq-item');
      const body = item.querySelector('.faq-a');
      const open = item.classList.contains('open');
      // close all
      document.querySelectorAll('.faq-item.open').forEach(o=>{
        o.classList.remove('open');
        o.querySelector('.faq-a').style.maxHeight='0';
        // icon handled by CSS
      });
      if(!open){
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight+'px';
        // icon handled by CSS
      }
    });
  });
})();

// ── Boutique filter ──
(function(){
  const btns = document.querySelectorAll('.filter-btn');
  const items = document.querySelectorAll('.product-item');
  if(!btns.length) return;
  btns.forEach(btn=>{
    btn.addEventListener('click',()=>{
      btns.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      items.forEach(item=>{
        if(f==='all'||(' '+item.dataset.cat+' ').indexOf(' '+f+' ')!==-1) item.classList.remove('hidden');
        else item.classList.add('hidden');
      });
    });
  });
})();

// ── Logo swap on scroll ──
(function(){
  const nav = document.querySelector('.nav');
  if(!nav) return;
  // The CSS handles it via class — no extra JS needed.
  // But we need to ensure the initial hidden state is right:
  const whites = document.querySelectorAll('.nav-logo-img.white');
  const defaults = document.querySelectorAll('.nav-logo-img.default');
  // Initial state set by CSS based on nav--dark/nav--light class already applied
})();

// ── FAQ jump nav active highlight ──
(function(){
  var sections = ['faq-studio','faq-purchasing','faq-bespoke','faq-care'];
  var links = document.querySelectorAll('.faq-jump');
  if(!links.length) return;
  window.addEventListener('scroll', function(){
    var current = sections[0];
    sections.forEach(function(id){
      var el = document.getElementById(id);
      if(el && window.scrollY >= el.getBoundingClientRect().top + window.scrollY - 160) current = id;
    });
    links.forEach(function(l){
      l.classList.toggle('active', l.getAttribute('href') === '#'+current);
    });
  }, {passive:true});
})();

// ── STRIPE CHECKOUT ──
async function stripeCheckout(btn) {
  var productId  = btn.getAttribute('data-item-id');
  var productName = btn.getAttribute('data-item-name');
  var price      = parseFloat(btn.getAttribute('data-item-price'));
  var image      = btn.getAttribute('data-item-image');

  btn.disabled = true;
  btn.textContent = 'Loading…';

  try {
    var res = await fetch('/.netlify/functions/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, productName, price, image })
    });
    var data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Something went wrong. Please try again or email nelly@jewelrybynelly.com');
      btn.disabled = false;
      btn.textContent = 'Buy Now';
    }
  } catch(e) {
    alert('Something went wrong. Please try again or email nelly@jewelrybynelly.com');
    btn.disabled = false;
    btn.textContent = 'Buy Now';
  }
}
