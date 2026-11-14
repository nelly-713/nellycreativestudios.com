/* Birth chart form on the Astrochart pendant page */
(function () {
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var place = null, chart = null;
  var BASE = 14500, CHAIN = 4500, SLUG = 'astrochart-1-oz-24k-gold-pendant';
  var giftLink = /[?&]gift=/.test(location.search);
  function buyBtn() { return document.querySelector('button[data-item-id="' + SLUG + '"][onclick*="addToCart"]'); }
  function who() { var r = document.querySelector('input[name="cg-b-who"]:checked'); return r ? r.value : 'me'; }
  function wearText() { return $('cg-b-wear').value === 'chain' ? '3mm gold cable chain, 24 inch adjustable' : 'Pink silk ribbon'; }
  function money(n) { return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function init() {
    var f = $('cg-birth-form'); if (!f || !window.NellyChart || !window.Astronomy || !window.tzlookup) return;
    var nt = $('cg-b-notime'), tm = $('cg-b-time');
    nt.addEventListener('change', function () { tm.disabled = nt.checked; if (nt.checked) tm.value = ''; stale(); });
    $('cg-b-find').addEventListener('click', findPlace);
    $('cg-b-place').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); findPlace(); } });
    ['cg-b-date', 'cg-b-time'].forEach(function (id) { $(id).addEventListener('input', stale); });
    $('cg-b-name').addEventListener('input', attachToOrder);
    f.addEventListener('submit', function (e) { e.preventDefault(); draw(); });
    $('cg-b-enquire').addEventListener('click', enquire);
    $('cg-b-wear').addEventListener('change', attachToOrder);
    ['cg-b-rname', 'cg-b-remail'].forEach(function (id) { $(id).addEventListener('input', attachToOrder); });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="cg-b-who"]'), function (r) { r.addEventListener('change', mode); });
    // Buy Now is only allowed once the order has a chart, or is a gift with the recipient's name
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button[data-item-id="' + SLUG + '"][onclick*="addToCart"]');
      if (!b || b !== buyBtn()) return;
      var problem = ready();
      if (problem) { e.preventDefault(); e.stopImmediatePropagation(); var m = $('cg-b-buymsg'); m.textContent = problem; m.style.display = 'block';
        $('cg-birth').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, true);
    if (giftLink) {
      $('cg-b-giftbanner').style.display = 'block'; $('cg-b-who').style.display = 'none'; $('cg-b-intro').style.display = 'none';
      $('cg-b-enquire').textContent = 'Send My Chart to Nelly';
      var b = buyBtn(); if (b) { b.style.display = 'none'; var sub = b.nextElementSibling; while (sub && /pdp-cta-sub/.test(sub.className)) { sub.style.display = 'none'; sub = sub.nextElementSibling; } }
      var pr = document.querySelector('.pdp-price'); if (pr) pr.style.display = 'none';
    }
    mode();
    fromLink();
  }
  function stale() { if (chart) { chart = null; $('cg-b-result').style.display = 'none'; } attachToOrder(); }
  function mode() {
    var gift = who() === 'gift';
    $('cg-b-giftfields').style.display = gift ? 'block' : 'none';
    $('cg-b-birthfields').style.display = gift ? 'none' : 'block';
    $('cg-b-draw').style.display = gift ? 'none' : 'inline-block';
    if (gift) $('cg-b-result').style.display = 'none'; else if (chart) $('cg-b-result').style.display = 'block';
    attachToOrder();
  }
  function ready() {
    if (who() === 'gift') return ($('cg-b-rname').value || '').trim() ? '' : "Add the recipient's name to buy this as a gift";
    return chart ? '' : 'Draw the birth chart first. It is added to your order, or choose the gift option';
  }
  // the chart (or gift details), the chain choice and the price travel with the order
  function attachToOrder() {
    var b = buyBtn(); if (!b) return;
    var chain = $('cg-b-wear').value === 'chain', price = BASE + (chain ? CHAIN : 0);
    b.setAttribute('data-item-price', price.toFixed(2));
    var pr = document.querySelector('.pdp-price'); if (pr && !giftLink) pr.textContent = money(price);
    b.setAttribute('data-item-custom2-name', 'Wear it on'); b.setAttribute('data-item-custom2-value', wearText());
    var val = '';
    if (who() === 'gift') {
      var rn = ($('cg-b-rname').value || '').trim(), re = ($('cg-b-remail').value || '').trim();
      if (rn) val = 'for ' + rn + (re ? ' (' + re + ')' : ', send the link to the buyer') + ', birth details to follow';
      b.setAttribute('data-item-custom1-name', 'Gift');
    } else if (chart && place) {
      var F = window.NellyChart.fmt, short = place.name.split(',').slice(0, 2).join(',').trim(), nm = ($('cg-b-name').value || '').trim();
      val = (nm ? nm + ', ' : '') + 'born ' + $('cg-b-date').value + (chart.known ? ' ' + $('cg-b-time').value : ', time unknown') + ', ' + short
        + ' (Sun ' + F(chart.planets[0].lon).text + ', Moon ' + F(chart.planets[1].lon).text + (chart.asc != null ? ', ASC ' + F(chart.asc).text : '') + ')';
      b.setAttribute('data-item-custom1-name', 'Birth chart');
    }
    if (val) b.setAttribute('data-item-custom1-value', val); else b.removeAttribute('data-item-custom1-value');
    if (!ready()) $('cg-b-buymsg').style.display = 'none';
  }
  function msg(t) { var m = $('cg-b-msg'); m.textContent = t || ''; m.style.display = t ? 'block' : 'none'; }
  function findPlace() {
    var q = $('cg-b-place').value.trim(); if (!q) { msg('Type the city and country of birth'); return; }
    msg(''); var list = $('cg-b-places'); list.innerHTML = '<p style="margin:0.3rem 0;font-size:0.82rem">Searching…</p>';
    fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=en&q=' + encodeURIComponent(q))
      .then(function (r) { return r.json(); })
      .then(function (rows) {
        if (!rows.length) { list.innerHTML = ''; msg('No place found. Try the city and country, e.g. Hanover, New Hampshire'); return; }
        list.innerHTML = '';
        rows.forEach(function (r) {
          var b = document.createElement('button'); b.type = 'button'; b.textContent = r.display_name;
          b.style.cssText = 'display:block;width:100%;text-align:left;background:#fff;border:1px solid var(--fog);padding:0.55rem 0.7rem;margin:0 0 0.35rem;font-family:Jost,sans-serif;font-size:0.82rem;cursor:pointer;color:#1B2A4A';
          b.addEventListener('click', function () {
            var lat = +r.lat, lon = +r.lon;
            place = { name: r.display_name, lat: lat, lon: lon, tz: window.tzlookup(lat, lon) };
            $('cg-b-place').value = r.display_name; list.innerHTML = '';
            $('cg-b-chosen').textContent = 'Place set: ' + r.display_name + ' (' + place.tz + ')';
            stale();
          });
          list.appendChild(b);
        });
      })
      .catch(function () { list.innerHTML = ''; msg('Place search is not available right now. Please try again in a minute'); });
  }
  function draw() {
    var date = $('cg-b-date').value, time = $('cg-b-notime').checked ? '' : $('cg-b-time').value;
    if (!date) { msg('Add the date of birth'); return; }
    if (!place) { msg('Search for the place of birth and choose it from the list'); return; }
    msg('');
    chart = window.NellyChart.compute({ date: date, time: time, lat: place.lat, lon: place.lon, tz: place.tz });
    $('cg-b-wheel').innerHTML = window.NellyChart.svg(chart, 1000);
    var F = window.NellyChart.fmt, rows = chart.planets.map(function (p) {
      var h = window.NellyChart.house(p.lon, chart.asc);
      return '<tr><td>' + p.glyph + '︎ ' + p.name + '</td><td>' + F(p.lon).text + (p.retro ? ' R' : '') + '</td><td>' + (h ? h : '') + '</td></tr>';
    });
    rows.push('<tr><td>\u260A\uFE0E North Node</td><td>' + F(chart.node.lon).text + '</td><td>' + (window.NellyChart.house(chart.node.lon, chart.asc) || '') + '</td></tr>');
    if (chart.asc != null) {
      rows.unshift('<tr><td>Ascendant</td><td>' + F(chart.asc).text + '</td><td>1</td></tr>');
      rows.push('<tr><td>Midheaven</td><td>' + F(chart.mc).text + '</td><td></td></tr>');
    }
    $('cg-b-table').innerHTML = '<table style="width:100%;border-collapse:collapse;font-family:Jost,sans-serif;font-size:0.85rem;color:#1B2A4A">'
      + '<tr style="text-align:left;font-size:0.62rem;letter-spacing:0.18em;text-transform:uppercase"><th>Point</th><th>Position</th><th>House</th></tr>'
      + rows.join('').replace(/<td>/g, '<td style="padding:0.35rem 0;border-top:1px solid var(--fog)">') + '</table>'
      + (chart.known ? '' : '<p style="font-size:0.8rem;margin-top:0.6rem">Without a birth time the chart uses 12:00 noon, so the Ascendant, houses and the Moon’s exact degree are left out or approximate</p>');
    $('cg-b-result').style.display = 'block';
    attachToOrder();
    $('cg-b-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    try { if (window.gtag) gtag('event', 'birth_chart_drawn'); } catch (x) {}
  }
  function chartLink() {
    var v = function (id) { return ($(id).value || '').trim(); };
    var q = [v('cg-b-date'), chart.known ? v('cg-b-time') : '', place.lat.toFixed(4), place.lon.toFixed(4), place.tz, v('cg-b-name'), place.name].map(encodeURIComponent).join('%7C');
    return 'https://nellycreativestudios.com/pages/products/astrochart-1-oz-24k-gold-pendant.html?chart=' + q + '#cg-birth';
  }
  function fromLink() {
    var raw = new URLSearchParams(location.search).get('chart'); if (!raw) return;
    var p = raw.split('|').map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
    if (!p[0] || isNaN(+p[2]) || isNaN(+p[3]) || !p[4]) return;
    $('cg-b-date').value = p[0];
    if (p[1]) $('cg-b-time').value = p[1]; else { $('cg-b-notime').checked = true; $('cg-b-time').disabled = true; }
    $('cg-b-name').value = p[5] || '';
    place = { name: p[6] || (p[2] + ', ' + p[3]), lat: +p[2], lon: +p[3], tz: p[4] };
    $('cg-b-place').value = place.name;
    $('cg-b-chosen').textContent = 'Place set: ' + place.name + ' (' + place.tz + ')';
    draw();
  }
  function enquire() {
    if (!chart) return;
    var F = window.NellyChart.fmt, v = function (id) { return ($(id).value || '').trim(); };
    var lines = ['Birth chart details:'];
    if (v('cg-b-name')) lines.push('Name: ' + v('cg-b-name'));
    lines.push('Date of birth: ' + v('cg-b-date'));
    lines.push('Time of birth: ' + (chart.known ? v('cg-b-time') : 'Unknown'));
    lines.push('Place of birth: ' + place.name + ' (' + place.lat.toFixed(4) + ', ' + place.lon.toFixed(4) + ', ' + place.tz + ')');
    lines.push('Wear it on: ' + wearText());
    lines.push('');
    if (chart.asc != null) lines.push('Ascendant: ' + F(chart.asc).text);
    chart.planets.forEach(function (p) { lines.push(p.name + ': ' + F(p.lon).text + (p.retro ? ' (R)' : '')); });
    lines.push('North Node: ' + F(chart.node.lon).text);
    if (chart.mc != null) lines.push('Midheaven: ' + F(chart.mc).text);
    lines.push('');
    lines.push('View this chart: ' + chartLink());
    try { if (window.gtag) gtag('event', 'birth_chart_enquiry'); } catch (x) {}
    location.href = '../contact.html?piece=' + encodeURIComponent('Astrochart 1 oz 24k Gold Pendant') + '&details=' + encodeURIComponent(lines.join('\n'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
