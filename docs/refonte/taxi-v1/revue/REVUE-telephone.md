# Revue téléphone, VIP Taxi Lanta (taxi-v1, commit 9b1c1a4)

Périmètre : `/taxi/` et les 17 trajets à 390, 360 et 375 de large (hauteurs 844, 780, 667), paysage 844 × 390. Feuille de réservation ouverte, remplie, aperçu, écran final, sur le hub (From/To libres) et sur `surat-thani-koh-lanta`. Chrome headless (Playwright, `isMobile`, tactile, ×2). Clavier simulé par un bandeau de 336 px (390 × 844), 260 px (375 × 667), 300 px (360 × 780) et 200 px (paysage) : iOS Safari et Chrome Android récent ne réduisent pas la page sous le clavier, il la recouvre.

Ce qui tient : aucun défilement horizontal (scrollWidth = largeur partout), axe-core 0 violation sur hub, trajet et feuille à 360, aucun mot coupé en plein milieu dans les cartouches, cadre kranok juste sur les 17 trajets aux trois largeurs (recalcul ResizeObserver correct), `krabi-airport-khao-lak` sans durée affiche un filet plein sans rien inventer, barre du bas bien cachée tant que le bouton du haut est visible en portrait, rendu conforme à la maquette `laque` en 390.

Scripts : `scripts/` (survey, full, sheet, kbd, targets, hdr). Mesures brutes : `scripts/survey.json`.

## Gravité 1, bloquant

### T1 Nom de la marque cassé en deux lignes dans l'en-tête à 375 et 360
- Pages, largeurs : les 18 pages, 375 et 360 (iPhone mini, SE, Android courants). 390 correct.
- Ce qui ne va pas : « VIP Taxi / Lanta » passe sur deux lignes, le bloc fait 58 px dans un en-tête de 68 px et le haut du texte est à 5 px du bord de l'écran. Le pictogramme WhatsApp est écrasé par le flex (9 × 18 px à 360, 14 × 18 à 375 au lieu de 18 × 18). Premier élément vu sur chaque page.
- Capture : captures/d-entete-360-375-390.png, captures/planche-360-hub-khaolak.png
- Cause : `src/css/vip-taxi.css:102-116`. Somme des largeurs à 360 : disque 46 + 12 + nom 143 + 16 + bouton 130 = 347 px pour 320 disponibles ; `.brand-name` sans `white-space: nowrap`, `.top-wa svg` sans `flex: none`.
- Correction :
  ```css
  .brand-name { white-space: nowrap; }
  .top-wa svg { flex: none; }
  @media (max-width: 24.3rem) {           /* < 389 px */
    .top-in { gap: 12px; }
    .brand { gap: 10px; }
    .top .disc { width: 40px; height: 40px; }
    .brand-name { font-size: 16px; }
    .top-wa { padding: 0 10px; gap: 6px; }
  }
  ```
  À 360 : 40 + 10 + 127 + 12 + 122 = 311 px. Risque faible, limité à l'en-tête ; vérifier à 320 (Galaxy Fold fermé) où il faudra peut-être masquer `small` « Mr. Brown » ou le mot « WhatsApp ».

### T2 L'aperçu du hub écrit « Pickup » pour l'hôtel d'arrivée
- Pages, largeurs : `/taxi/`, feuille libre From/To, toutes largeurs.
- Ce qui ne va pas : From « Krabi Airport », To « Koh Lanta, Long Beach », champ « Hotel or address » = Pimalai Resort. L'aperçu et le message WhatsApp disent « Pickup: Pimalai Resort, Kantiang Bay » alors que la prise en charge est à l'aéroport. Le message envoyé à Anaïs se contredit sur l'endroit où envoyer le chauffeur.
- Capture : captures/d-apercu-pickup-390.png
- Cause : `src/js/booking.js:252-254`, `dropOff` vaut `false` dès que la feuille n'a pas de trajet fixé, donc toujours « Pickup ».
- Correction : en mode libre, garder le libellé neutre du champ.
  ```js
  var fixed = config.from && config.to;
  var label = !fixed ? "Hotel or address: " : (state.direction !== "back" ? "Drop-off: " : "Pickup: ");
  lines.push(label + clean(state.address));
  ```
  Risque nul pour Secret (branche `taxi` seulement), le libellé du champ et celui du message deviennent identiques.

## Gravité 2, visible

### T3 Barre du bas sur trois lignes à 360
- Pages, largeurs : 18 pages, 360.
- Ce qui ne va pas : « Price on / WhatsApp » et le bouton « Request a / transfer » passent sur deux lignes, la barre monte à 77 px (69 à 375). Bouton en deux lignes au pouce, ça fait cassé.
- Capture : captures/d-barre-bas-360-375.png
- Cause : `src/css/vip-taxi.css:304-313`, ni `flex: none` ni `nowrap` sur le bouton, texte 15 px sans repli.
- Correction :
  ```css
  .vbar .btn { flex: none; white-space: nowrap; }
  @media (max-width: 23.4rem) {           /* < 375 px */
    .vbar { gap: 10px; }
    .vbar p { font-size: 14px; }
    .vbar .btn { padding: 0 14px; font-size: 15px; }
  }
  ```
  À 360 : 124 + 10 + 158 = 292 px pour 320. Risque nul.

### T4 Le clavier cache la liste des lieux sous « To »
- Pages, largeurs : `/taxi/`, feuille libre. 390 × 844 : 2 lieux sur 14 visibles au-dessus du clavier (Krabi Airport, Phuket Airport). 375 × 667 : 1 seul. Paysage : aucun, le champ lui-même est sous le clavier. Koh Lanta, la destination la plus fréquente, est toujours cachée. Sous « From » ça passe de justesse (4 lieux à 390, 3 à 375).
- Capture : captures/kbd-to-390x844.png, captures/kbd-to-375x667.png, captures/kbd-from-844x390.png, captures/planche-sheet-hub-b.png
- Cause : `src/js/vip-taxi.js:124-139` ouvre la liste sous le champ sans le remonter ; `src/css/vip-taxi.css:409-410` `max-height: 15rem` fixe, sans tenir compte de `visualViewport`.
- Correction : à l'ouverture, remonter le champ en haut du corps de la feuille et borner la liste à la place visible.
  ```js
  function fit() {
    input.scrollIntoView({ block: "start", behavior: "smooth" });
    var vv = window.visualViewport, top = pop.getBoundingClientRect().top;
    if (vv) pop.style.maxHeight = Math.max(132, vv.height + vv.offsetTop - top - 8) + "px";
  }
  // dans open(), après pop.hidden = false : requestAnimationFrame(fit);
  // et visualViewport.addEventListener("resize", function(){ if (!pop.hidden) fit(); });
  ```
  avec `[data-brand="vip"] .sheet .combo { scroll-margin-top: 8px; }`. À 390 × 844 la liste passe de 365-605 à environ 209-449, les 4 premiers lieux et demi visibles. Risque moyen : tester sur un vrai iPhone (offsetTop du visualViewport) avant de fusionner.

### T5 Paysage, hub : l'arc fait un écran et demi
- Pages, largeurs : `/taxi/`, 844 × 390.
- Ce qui ne va pas : le hero reste en une colonne (grille à partir de 64rem seulement), l'arc prend 480 × 605 px pour 390 de haut. Le chapeau et le bouton « Request a transfer » arrivent après deux écrans de défilement, la photo est coupée par le haut et le bas de l'écran pendant tout ce temps.
- Capture : captures/land-hub-top.png, captures/land-hub-arch.png
- Cause : `src/css/vip-taxi.css:127-135` (grille réservée au bureau) et `:138` (`max-width: 30rem` sans limite de hauteur).
- Correction : reprendre la grille du bureau sur les écrans larges et bas.
  ```css
  @media (min-width: 48rem) and (max-height: 32rem) {
    .hero-in { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); grid-template-rows: auto 1fr; column-gap: 40px; }
    .hero-in > h1 { grid-column: 1; grid-row: 1; }
    .hero .arch { grid-column: 2; grid-row: 1 / span 2; max-height: calc(100svh - 32px); width: auto; margin: 0; }
    .hero-text { grid-column: 1; grid-row: 2; }
  }
  ```
  Risque faible, une tablette en portrait n'est pas concernée (hauteur > 32rem).

### T6 Paysage, page trajet : la barre du bas se pose sur le cartouche
- Pages, largeurs : 17 trajets, 844 × 390.
- Ce qui ne va pas : le bouton du haut est sous le pli (y = 519), donc la barre s'affiche dès l'arrivée. En-tête 68 px + barre 69 px = 35 % de l'écran ; l'arrivée « Koh Lanta » du cartouche est coupée sous la barre, le cadre doré aussi.
- Capture : captures/land-route-top.png
- Cause : `src/js/vip-taxi.js:62-66`, l'observateur ne regarde que si `.hero-act` est à l'écran, quel que soit l'espace.
- Correction : sur écran bas, attendre qu'on ait dépassé le bouton plutôt que qu'il soit visible.
  ```js
  var low = matchMedia("(max-height: 32rem)").matches;
  new IntersectionObserver(function (en) { bar.classList.toggle("is-off", en[0].isIntersecting); },
    { rootMargin: low ? "0px 0px 100% 0px" : "0px" }).observe(act);
  ```
  Risque faible, portrait inchangé.

### T7 Liseré doré en haut de la fiche d'aperçu
- Pages, largeurs : feuille, écran « Your message », toutes largeurs.
- Ce qui ne va pas : la fiche porte une barre d'or de 3 px en haut. C'est mot pour mot le marqueur « bordure colorée en haut des cartes » de la mémoire anti-IA, au cœur du parcours de réservation.
- Capture : captures/planche-sheet-hub-c.png (3e vue), captures/d-apercu-pickup-390.png
- Cause : `src/css/vip-taxi.css:395` `box-shadow: inset 0 3px 0 var(--gold)`.
- Correction : supprimer le `box-shadow` ; la première ligne en Chonburi suffit à faire titre. Risque nul.

### T8 Noms de lieux coupés en fin de ligne dans les questions
- Pages, largeurs : hub et trajets, 390 (pire à 360) : « Krabi Airport to Koh / Lanta? », « Southern / Thailand? », « back to Krabi / Airport? », « from Krabi / Airport to Koh Lanta? ».
- Capture : captures/d-faq-noms-coupes-390.png, captures/full-krabi-airport-koh-lanta-390x844-p2.png
- Cause : `src/_includes/components/taxi.njk:40` (question brute), `src/css/vip-taxi.css:240-243` (`summary` sans équilibrage).
- Correction : un filtre Eleventy `nbspPlaces` qui remplace l'espace des noms de `taxi.places` et de « Southern Thailand » par une espace insécable, appliqué à `q.q` et `q.a` dans la macro `faq`, plus `.faq summary > span:first-child { text-wrap: balance; }`. Risque faible ; le plus long nom (« Surat Thani Bus Terminal ») fait environ 200 px à 17 px, il tient à 320.

## Gravité 3, finition

### T9 « pick- / up point » coupé au trait d'union
- Pages, largeurs : `/taxi/`, « How to book », 390 (étapes 1 et 3).
- Capture : captures/d-etapes-pick-up-390.png
- Cause : `src/_data/taxi.json:146` et `:156` écrivent « pick-up » alors que la feuille dit « Pickup time », « Pickup hotel ».
- Correction : écrire « pickup » dans les deux phrases (même mot que la feuille, plus de trait d'union à couper). Texte public : passer par `redaction-fr`. Risque nul.

### T10 Bloc Paiement : « No » seul en fin de ligne
- Pages, largeurs : `/taxi/`, 390 et moins : « Cash to the driver on / the day. No / prepayment. No / hidden fees. », quatre lignes en Chonburi 23 px.
- Capture : captures/d-paiement-390.png
- Cause : `src/css/vip-taxi.css:202`, le paragraphe hérite de `text-wrap: pretty` (`:63`) qui ne rééquilibre pas un texte de 4 lignes.
- Correction : `.pay p { text-wrap: balance; }`. Risque nul.

### T11 Durée longue : le filet du cartouche réduit à un tiret
- Pages, largeurs : `phuket-airport-khao-lak` à 360 et 375 (« About 1 hr 30 min to 2 hours »), le filet tombe à 50 px et le texte touche la marge intérieure droite.
- Capture : captures/planche-cartouches-360.png (1re vue)
- Cause : `src/css/vip-taxi.css:331-335`, `.c-drive` sur une ligne sans largeur maximale.
- Correction : `.c-drive { max-width: 10em; text-wrap: balance; }` et `.c-word::after { min-width: 48px; }` ; la durée passe sur deux lignes alignées à droite quand elle est longue. Le cadre se recalcule seul (ResizeObserver). Risque nul.

### T12 Filets des lignes de trajet hors de la marge
- Pages, largeurs : hub et « Other routes », toutes largeurs téléphone : les filets commencent à 8 px du bord, ceux des questions et de « Our minivan » à 20 px. Deux alignements dans la même page.
- Capture : captures/full-hub-390x844-p1.png, captures/full-hub-390x844-p6.png
- Cause : `src/css/vip-taxi.css:170` `margin-inline: -12px` (fait pour le fond au survol).
- Correction : au téléphone `margin-inline: 0; padding-inline: 0;` et au toucher étendre le fond par `box-shadow: -12px 0 0 var(--lac), 12px 0 0 var(--lac)` ; garder le `-12px` à partir de 64rem. Risque faible.

### T13 Survol collant au toucher
- Pages, largeurs : toutes. Une ligne de trajet touchée reste en laque au retour arrière (bfcache), un lieu de la liste reste surligné.
- Capture : captures/sheet-390-hub-3-from-list-keyboard.png (« Koh Lanta » surligné sans choix)
- Cause : `src/css/vip-taxi.css:89, 91, 117, 181-184, 249, 274, 382, 388, 415`, `:hover` hors `@media (hover: hover)`.
- Correction : envelopper ces règles `:hover` dans `@media (hover: hover) { … }`, garder `:active` dehors. Risque nul.

### T14 Feuille sans bord sur la page trajet
- Pages, largeurs : trajets, toutes largeurs : la tête de la feuille (laque) se pose sur l'en-tête laque assombri par un voile laque à 62 %, on ne voit pas où commence la feuille.
- Capture : captures/planche-sheet-route.png
- Cause : `src/css/vip-taxi.css:47` `--sheet-backdrop: rgb(27 19 13 / .62)` et `:372`.
- Correction : `--sheet-backdrop: rgb(0 0 0 / .6);` le voile devient plus sombre que la laque et la feuille ressort. Risque nul.

### T15 Le bouton et la feuille ne disent pas la même action
- Pages, largeurs : `/taxi/` : on touche « Request a transfer », la feuille s'ouvre sur « Check availability ».
- Capture : captures/planche-sheet-hub-a.png
- Cause : `src/_includes/components/booking.njk:37`.
- Correction : `{% if cfg.variant == "tour" %}Choose a date{% elif taxi and not (cfg.from and cfg.to) %}Request a transfer{% else %}Check availability{% endif %}`. Risque nul (Secret garde ses libellés).

### T16 La liste « To » propose le lieu déjà choisi en « From »
- Pages, largeurs : `/taxi/` : From = Krabi Airport, la liste To commence par Krabi Airport.
- Capture : captures/planche-sheet-hub-b.png (2e vue)
- Cause : `src/js/vip-taxi.js:124-128`, filtre sur la saisie seulement.
- Correction : dans `open()`, cacher aussi l'élément égal (normalisé) à la valeur de l'autre champ. Risque nul.

### T17 Les mêmes phrases reviennent à l'écran
- Pages, largeurs : trajets : « Cash to the driver » est à la fois le petit texte de la barre et un intitulé de « How this transfer works », visibles ensemble ; « Price on WhatsApp » est dans la note sous le bouton, la barre et « Prices on WhatsApp » au hub. La mémoire anti-IA classe ces répétitions parmi les textes de remplissage.
- Capture : captures/full-krabi-airport-koh-lanta-390x844-p1.png
- Cause : `src/_includes/components/taxi.njk:91` (barre), `src/taxi-route.njk:66`, `src/taxi.njk:65`.
- Correction : garder « Price on WhatsApp » dans la barre et la note du héros, retirer « Prices on WhatsApp. » de `taxi.njk:65` (la barre le dit déjà) et remplacer le `small` de la barre par rien sur les pages trajet. Risque nul, mais à faire valider par Jérémy (texte).

### T18 Liens légaux du pied à 42 px
- Pages, largeurs : 18 pages, toutes largeurs : « Booking terms », « Legal notice », « Privacy » font 42 px de haut, sous les 44 px.
- Capture : captures/full-hub-390x844-p8.png
- Cause : `src/css/vip-taxi.css:294-295`, 14 px × 1,6 + 2 × 10 px.
- Correction : `.foot-legal a { padding-block: 11px; margin-block: -11px; }`. Risque nul.

## Les 3 corrections qui changeraient le plus la page

1. **T1, l'en-tête à 360 et 375** : c'est la première chose vue sur les 18 pages par une bonne part des téléphones, et le nom de la marque cassé contre le bord fait bâclé. Cinq lignes de CSS.
2. **T4, la liste des lieux sous le clavier** : au moment où le client réserve, il ne voit pas Koh Lanta dans la liste « To ». Remonter le champ et borner la liste à la place visible.
3. **T2, « Pickup » dans le message du hub** : une ligne de `booking.js` pour qu'Anaïs ne reçoive plus un transfert dont le lieu de prise en charge contredit le trajet.
