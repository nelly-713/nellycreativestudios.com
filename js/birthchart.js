/* Birth chart for the Astrochart pendant. Tropical zodiac, equal houses from the Ascendant.
   Planet positions: Astronomy Engine (MIT, Don Cross). Time zones: tz-lookup (CC0).
   Place search: OpenStreetMap Nominatim (© OpenStreetMap contributors). */
(function (root) {
  var A = root.Astronomy || (typeof require !== 'undefined' ? require('./astronomy.js') : null);
  var SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
  var SIGN_GLYPH = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
  var BODIES = [['Sun','☉'],['Moon','☽'],['Mercury','☿'],['Venus','♀'],['Mars','♂'],
                ['Jupiter','♃'],['Saturn','♄'],['Uranus','♅'],['Neptune','♆'],['Pluto','♇']];
  var VS = '︎';
  function norm(x) { x %= 360; return x < 0 ? x + 360 : x; }
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }

  // offset (ms) of an IANA time zone at a UTC instant
  function tzOffset(ms, tz) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit',
      day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var p = {}; f.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second) - ms;
  }
  function localToUtc(y, mo, d, h, mi, tz) {
    var guess = Date.UTC(y, mo - 1, d, h, mi);
    var utc = guess - tzOffset(guess, tz);
    utc = guess - tzOffset(utc, tz);
    return new Date(utc);
  }
  function lonOf(body, t) { return A.Ecliptic(A.GeoVector(A.Body[body], t, true)).elon; }
  function angles(t, lat, lon) {
    var T = (t.tt) / 36525;
    var eps = rad(23.4392911 - 0.0130042 * T);
    var ramc = rad(norm(A.SiderealTime(t) * 15 + lon));
    var phi = rad(lat);
    var mc = norm(deg(Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps))));
    var asc = norm(deg(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))));
    return { asc: asc, mc: mc };
  }
  function compute(o) {
    // o: {date:'YYYY-MM-DD', time:'HH:MM' or '', lat, lon, tz}
    var dp = o.date.split('-').map(Number), known = !!o.time;
    var tp = known ? o.time.split(':').map(Number) : [12, 0];
    var utc = localToUtc(dp[0], dp[1], dp[2], tp[0], tp[1], o.tz);
    var t = A.MakeTime(utc), t2 = A.MakeTime(new Date(utc.getTime() + 864e5));
    var planets = BODIES.map(function (b) {
      var l = lonOf(b[0], t), l2 = lonOf(b[0], t2), dl = norm(l2 - l + 180) - 180;
      return { name: b[0], glyph: b[1], lon: l, retro: b[0] !== 'Sun' && b[0] !== 'Moon' && dl < 0 };
    });
    var ang = known ? angles(t, o.lat, o.lon) : null;
    var T = t.tt / 36525, nodeLon = norm(125.04452 - 1934.136261 * T + 0.0020708 * T * T);
    var node = { name: 'North Node', glyph: '\u260A', lon: nodeLon, retro: false };
    return { utc: utc, known: known, planets: planets, node: node, asc: ang && ang.asc, mc: ang && ang.mc };
  }
  function fmt(l) {
    var s = Math.floor(l / 30), d = l - s * 30, dd = Math.floor(d), mm = Math.floor((d - dd) * 60);
    return { sign: SIGNS[s], glyph: SIGN_GLYPH[s], text: dd + '°' + (mm < 10 ? '0' : '') + mm + '′ ' + SIGNS[s] };
  }
  function house(l, asc) { return asc == null ? null : Math.floor(norm(l - asc) / 30) + 1; }
  function aspects(ps) {
    var defs = [[0, 'conjunction'], [60, 'sextile'], [90, 'square'], [120, 'trine'], [180, 'opposition']], out = [];
    for (var i = 0; i < ps.length; i++) for (var j = i + 1; j < ps.length; j++) {
      var d = Math.abs(norm(ps[i].lon - ps[j].lon + 180) - 180);
      var orb = (/Sun|Moon/.test(ps[i].name + ps[j].name)) ? 8 : 6;
      defs.forEach(function (a) { if (a[0] && Math.abs(d - a[0]) <= orb) out.push({ a: ps[i], b: ps[j], type: a[1] }); });
    }
    return out;
  }
  // SVG wheel: cream ground, sign names around the rim, dashed house lines and axes, aspect web in the centre
  function svg(chart, size) {
    size = size || 1000;
    var c = size / 2, R = c * 0.82, rSign = R * 0.835, rIn = rSign, rGl = rIn * 0.9, rDot = rIn * 0.73, rNum = rIn * 0.42;
    var base = chart.asc != null ? chart.asc : 0;
    var INK = '#1A1408', LINE = '#7A5F24', NUM = '#6B5220', WARM = '#7E3B1F', COOL = '#2F2B33';
    var MONO = "ui-monospace,'SF Mono',Menlo,Consolas,'Courier New',monospace";
    function P(l, r) { var a = rad(180 + (l - base)); return [c + r * Math.cos(a), c - r * Math.sin(a)]; }
    function ln(p, q, st, w, dash) { return '<line x1="' + p[0].toFixed(1) + '" y1="' + p[1].toFixed(1) + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" stroke="' + st + '" stroke-width="' + w + '"' + (dash ? ' stroke-dasharray="' + dash + '"' : '') + '/>'; }
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="Birth chart wheel" style="display:block;width:100%;height:auto">';
    s += '<defs><radialGradient id="nc-gold" cx="42%" cy="38%" r="70%"><stop offset="0" stop-color="#F6E3A6"/><stop offset=".55" stop-color="#E3C26E"/><stop offset="1" stop-color="#C79A3E"/></radialGradient></defs>';
    s += '<rect width="' + size + '" height="' + size + '" fill="url(#nc-gold)"/>';
    s += '<circle cx="' + c + '" cy="' + c + '" r="' + R + '" fill="none" stroke="' + INK + '" stroke-width="' + (size / 360) + '"/>';
    s += '<circle cx="' + c + '" cy="' + c + '" r="' + rSign + '" fill="none" stroke="' + LINE + '" stroke-width="' + (size / 900) + '"/>';
    for (var k = 0; k < 12; k++) {
      s += ln(P(k * 30, rSign), P(k * 30, R), LINE, size / 900);
      var m = P(k * 30 + 15, (R + rSign) / 2), ang = norm(180 + (k * 30 + 15 - base)), rot = 90 - ang;
      while (rot > 180) rot -= 360; while (rot < -180) rot += 360;
      if (rot > 90) rot -= 180; if (rot < -90) rot += 180;
      s += '<text x="' + m[0].toFixed(1) + '" y="' + m[1].toFixed(1) + '" transform="rotate(' + rot.toFixed(1) + ' ' + m[0].toFixed(1) + ' ' + m[1].toFixed(1) + ')" font-size="' + (size / 50) + '" letter-spacing="' + (size / 330) + '" text-anchor="middle" dominant-baseline="central" fill="' + INK + '" font-family="' + MONO + '">' + SIGNS[k].toUpperCase() + '</text>';
    }
    if (chart.asc != null) {
      for (var h = 0; h < 12; h++) {
        var hl = chart.asc + h * 30;
        if (h % 3 !== 0) s += ln([c, c], P(hl, rIn), LINE, size / 1100, (size / 250) + ' ' + (size / 250));
        var hn = P(hl + 15, rNum);
        s += '<text x="' + hn[0].toFixed(1) + '" y="' + hn[1].toFixed(1) + '" font-size="' + (size / 42) + '" text-anchor="middle" dominant-baseline="central" fill="' + NUM + '" font-family="' + MONO + '">' + (h + 1) + '</text>';
      }
      s += ln(P(chart.asc, rIn * 1.0), P(chart.asc + 180, rIn * 1.0), '#3B2F17', size / 600, (size / 120) + ' ' + (size / 160));
      s += ln(P(chart.mc, rIn * 1.0), P(chart.mc + 180, rIn * 1.0), '#3B2F17', size / 600, (size / 120) + ' ' + (size / 160));
    }
    var pts = chart.planets.concat(chart.node ? [chart.node] : []);
    aspects(chart.planets).forEach(function (x) {
      if (x.type === 'conjunction') return;
      var col = (x.type === 'trine' || x.type === 'sextile') ? WARM : COOL;
      s += ln(P(x.a.lon, rDot), P(x.b.lon, rDot), col, size / 700);
    });
    pts.forEach(function (p) {
      var d = P(p.lon, rDot);
      s += '<circle cx="' + d[0].toFixed(1) + '" cy="' + d[1].toFixed(1) + '" r="' + (size / 260) + '" fill="#3B2F17"/>';
    });
    s += '<circle cx="' + c + '" cy="' + c + '" r="' + (size / 140) + '" fill="' + INK + '"/>';
    // glyphs just inside the sign ring, spread so they do not overlap
    var ps = pts.slice().sort(function (a, b) { return a.lon - b.lon; }), pos = ps.map(function (p) { return p.lon; });
    for (var it = 0; it < 40; it++) for (var i = 0; i < pos.length; i++) {
      var j = (i + 1) % pos.length, gap = norm(pos[j] - pos[i]);
      if (gap < 7 && pos.length > 1) { pos[i] -= (7 - gap) / 2; pos[j] += (7 - gap) / 2; }
    }
    ps.forEach(function (p, i) {
      var g = P(pos[i], rGl);
      s += ln(P(p.lon, rIn), P(p.lon, rIn * 0.97), INK, size / 600);
      s += '<text x="' + g[0].toFixed(1) + '" y="' + g[1].toFixed(1) + '" font-size="' + (size / 22) + '" text-anchor="middle" dominant-baseline="central" fill="' + INK + '" font-family="\'Segoe UI Symbol\',\'Apple Symbols\',\'DejaVu Sans\',serif">' + p.glyph + VS + '</text>';
    });
    return s + '</svg>';
  }
  var api = { compute: compute, svg: svg, fmt: fmt, house: house, aspects: aspects, localToUtc: localToUtc, angles: angles };
  if (typeof module !== 'undefined') module.exports = api; else root.NellyChart = api;
})(typeof window !== 'undefined' ? window : this);
