#!/bin/bash
# Fixes menu text turning white-on-white after scrolling. Run from the website folder.
grep -q "NAV SCROLL FIX" css/style.css && { echo "Already applied."; exit 0; }
cat >> css/style.css <<'CSS'

/* NAV SCROLL FIX: once scrolled, the nav is white, so menu text must be dark even though the page also has .nav--dark */
.nav--dark.nav--scrolled .nav-list a{color:var(--black)}
.nav--dark.nav--scrolled .nav-list a:hover,
.nav--dark.nav--scrolled .nav-list a.active{color:var(--gold)}
.nav--dark.nav--scrolled .nav-logo{color:var(--gold)}
.nav--dark.nav--scrolled .nav-enquire{color:var(--black);border-color:rgba(0,0,0,0.2)}
.nav--dark.nav--scrolled .nav-burger span{background:var(--black)}
CSS
echo "Applied."
