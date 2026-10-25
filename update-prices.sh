#!/bin/bash
# Sets the new prices everywhere on the site, then refreshes llms.txt. Run from the website folder. Safe to re-run.
set -e
P="python3 set-price.py"
$P gold-peony-flower-brooch auto 3900
$P platinum-peony-flower-brooch auto 3900
$P natural-brazilian-aquamarine-diamond-platinum-huggies auto 3000
$P kazakhstan-turquoise-bead-gold-screw-clasp-necklace auto 5000
$P kazakhstan-graduated-turquoise-platinum-necklace auto 5000
$P gold-bee-granulation-yellow-diamond auto 2500
$P a-link-in-love-pave-diamond-link-necklace auto 5700
$P a-link-in-love-platinum-pave-diamond-necklace auto 5700
$P medium-gold-diamond-links-bracelet auto 17000
$P 22k-gold-ruby-water-to-wine-cross-bracelet auto 3000
python3 ai-seo.py
