# Direction « route » : panneaux de la route

## La direction

- Idée maîtresse : chaque trajet est un panneau de direction. Le bleu veut dire « une route que vous pouvez prendre » (tous les panneaux bleus sont des liens vers un trajet, sauf le panneau-titre de la page trajet). Le jaune est le marquage au sol et l'action (boutons). Tout le reste est blanc.
- Palette : bleu panneau `#0A4C9C` (blanc dessus 8,3:1), bleu pressé `#073A78`, jaune marquage `#F4B400` (encre dessus 8,6:1), asphalte `#262B30`, encre `#1E2327`, gris texte `#545D65`, poteaux `#9AA1A8`, filet or `#C29A45` (plaque du logo seulement).
- Police unique : Archivo variable déjà dans le dépôt (`archivo-latin-wdth-normal.woff2`, graisse 100 à 900, largeur 62 à 125 %). Panneaux et titres en largeur 72 à 84 % et graisse 760 à 820, texte courant en largeur 100 % et graisse 400. Bas de casse partout, comme la signalisation.
- Page trajet : le h1 est le panneau. Origine en haut (cartouche de code KBV), flèche coudée construite en CSS (corps vertical, coude, corps horizontal, pointe) qui file vers la destination en grand, puis « Private minivan taxi » sous un filet. Tient sans durée (Khao Lak) et sans code (Koh Lanta → …).
- Le logo de Mr. Brown reste sur blanc, son fond d'origine : une plaque blanche à double filet (asphalte puis or) fixée sous le panneau d'accueil, sur les mêmes poteaux. En pied de page, carré blanc sur asphalte.

## Ce qui est vivant

- Un seul moment fort : la route. Une bande d'asphalte sous le panneau de chaque page (et en tête du pied de page), et une voie verticale qui longe les cinq panneaux de région de l'accueil (au centre sur bureau, panneaux de part et d'autre avec leurs bras). Le marquage jaune avance quand on fait défiler la page (`taxi.js`, une variable `--drive` mise à jour une fois par image). Rien ne bouge avec `prefers-reduced-motion`.
- Réponses aux gestes : ligne de panneau pressée = bleu plus sombre et la flèche avance de 4 px dans sa direction ; boutons qui s'enfoncent de 2 px ; flèche de FAQ qui pivote de droite vers le bas ; compteurs qui se pincent ; la feuille monte du bas (booking.css).
- Feuille de réservation : balisage d'origine inchangé (rendu de `_site`, variante taxi ; sur l'accueil, mode libre From / To produit comme le fait `booking.njk` sans from/to). Restylée seulement par `[data-brand="vip"] .sheet` et les jetons `--sheet-*` : tête en panneau bleu avec filet blanc, choix cochés en mini-panneaux bleus, bouton jaune, aperçu en plaque blanche dont la première ligne (le trajet) est un bandeau bleu.

## Fichiers

- `hub.html`, `krabi-airport-koh-lanta.html`, `krabi-airport-khao-lak.html` : générés depuis `taxiRoutes.json`, `taxi.json` et `site.json` (aucun texte saisi à la main sauf les titres de section et trois liaisons signalées plus bas). Servis par `python3 -m http.server 8743` depuis la racine du dépôt.
- `taxi.css` (à porter), `taxi.js` (la route qui avance, 15 lignes). Les maquettes chargent aussi `/src/css/booking.css` (partagé) et `/_site/js/booking.js`.
- Un petit script en bas de chaque maquette réécrit les liens `/taxi/...` vers les fichiers de la maquette : il ne fait pas partie du portage.
- Au portage : chemins `/src/css/fonts/` → `/css/fonts/`, `/src/images/` → `/images/`.

## Données absentes ou à vérifier

- `krabi-airport-khao-lak` n'a pas de durée : la ligne « Drive time » et la ligne sous le panneau disparaissent.
- Phrases de liaison écrites par moi, à valider : « Airport transfers from Koh Lanta, both directions » (en-tête du panneau d'accueil), « Every route runs in both directions, in a private minivan for your group only. Prices on WhatsApp. » (tiré des metaDescription et de `brands.vip.private`), « Another place » + `further` + « Tell us where we pick you up and where you are going. » (tiré de la FAQ).
- Flèches du panneau d'accueil : direction géographique réelle depuis Koh Lanta (Krabi Airport et Surat Thani Airport au nord, Phuket Airport au nord-ouest).
- Photo de l'encart Secret : `secret/v3/card-4-islands.jpg` (photo de la société, `placeholder: false` dans `photos-v3.json`).
- « We usually reply within 6 hours, Thailand time. » et les liens légaux sont repris tels quels du pied de page actuel.

## Résultat axe-core

0 violation sur les trois pages à 390 et 1440, et sur la feuille ouverte (formulaire et aperçu). Pas de défilement horizontal à 360 et 390. Aucune erreur console.

## Fragile

- Sur bureau, les panneaux de région sont décalés (colonne droite descendue de 120 px) : avec d'autres hauteurs de régions, la grille peut laisser un vide sous un panneau court.
- La voie verticale fait repeindre une bande de 4 à 6 px pendant le défilement (position de fond) ; la bande horizontale, elle, n'utilise que `transform`.
- Les captures pleine page placent la barre du bas en fin de page (style ajouté pour la capture seulement) ; en vrai elle est fixe en bas de l'écran.
