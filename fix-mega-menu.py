#!/usr/bin/env python3
"""Makes the boutique mega-menu categories work (Earrings, Necklaces, ...). Run from the website root. Safe to re-run."""
p = 'js/main.js'
s = open(p, encoding='utf-8').read()
if 'NCS MEGA FIX' in s:
    print('Already applied.'); raise SystemExit
a = """    html += '<a href="' + href + '" class="ncs-mega-cat" data-filter="' + c.filter + '">' +"""
b = """    html += '<a href="' + href.split('?')[0] + '?type=' + c.filter + '" class="ncs-mega-cat" data-filter="' + c.filter + '">' +"""
if a not in s:
    raise SystemExit('Could not find the menu code to change - no changes made.')
s = s.replace(a, b, 1)
old_tail = "  el.addEventListener('mouseleave', hide);\n})();"
new_tail = """  el.addEventListener('mouseleave', hide);

  // NCS MEGA FIX: on the boutique page itself the link points at the same page, so apply the filter directly
  function onBoutique() { return /(^|\\/)boutique(\\.html)?\\/?$/.test(location.pathname); }
  function applyType(type) {
    var btn = document.querySelector('[data-filter-type="' + type + '"]');
    if (!btn) return false;
    btn.click();
    var bar = document.querySelector('.filter-bar');
    if (bar && bar.scrollIntoView) bar.scrollIntoView({behavior: 'smooth', block: 'center'});
    return true;
  }
  el.querySelectorAll('.ncs-mega-cat, .ncs-mega-all').forEach(function(a) {
    a.addEventListener('click', function(e) {
      if (!onBoutique()) return;
      var type = a.getAttribute('data-filter') || 'all';
      if (applyType(type)) { e.preventDefault(); el.classList.remove('open'); }
    });
  });
  if (onBoutique()) {
    window.addEventListener('load', function() {
      var t = new URLSearchParams(location.search).get('type');
      if (t) applyType(t.toLowerCase());
    });
  }
})();"""
if old_tail not in s:
    raise SystemExit('Could not find the end of the menu code - no changes made.')
s = s.replace(old_tail, new_tail, 1)
open(p, 'w', encoding='utf-8', newline='').write(s)
print('Applied.')
