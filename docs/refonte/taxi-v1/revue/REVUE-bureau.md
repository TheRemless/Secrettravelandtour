# Revue bureau et tablette, VIP Taxi Lanta (taxi v1, « Laque et or »)

Périmètre : `/taxi/` et les 17 trajets à 1440, 1280, 1024 et 768 (portrait), servis sur http://localhost:8731. Premier écran des 18 pages aux quatre largeurs, pages entières du hub et de `krabi-airport-koh-lanta`, `surat-thani-koh-lanta`, `krabi-airport-khao-lak` et `koh-lanta-trang`. Survol, focus clavier (40 tabulations sur le hub), titre collant, feuille ouverte (hub et trajet) à 1440, 1024 et 768. Captures dans `captures/`, scripts hors du dépôt.

Ce qui tient bien : le rendu à 1280 et 1440 suit la maquette `docs/refonte/taxi-v1/propositions/laque/` presque au pixel. axe-core ne trouve aucune violation (wcag2a, wcag2aa, wcag21aa, best-practice) sur le hub, Krabi et Trang à 1440, 1024 et 768. Le titre « Questions » colle bien (top 32 px), l'arc et le cadre se tracent, le focus est visible partout (or sur laque, bronze sur papier). Aucun prix de trajet ni lien `tel:` affiché.

Bilan : 0 bloquant, 7 visibles, 6 de finition.

---

## Gravité 2, visible

### B1 La tablette reçoit la mise en page du téléphone, étirée
- Pages, largeurs : toutes, de 768 à 1023 (iPad portrait, petites tablettes).
- Ce qui ne va pas : le seul palier de mise en page est à 64rem. À 768 tout s'empile en une colonne sur 688 px. Hub : h1 à 33 px, à peine plus grand que les h2 (30 px), collé à l'en-tête (20 px) ; l'arc de 480 px est centré sous un titre aligné à gauche et occupe tout le premier écran ; les 17 trajets en une seule colonne avec le chevron à 680 px du texte ; page de 8 241 px contre 5 290 à 1440 ; pied en une colonne avec 400 px de vide à droite. Trajet : départ et arrivée à 40 px dans un cartouche de 688 px, arc centré sous un texte aligné à gauche.
- Capture : captures/hub-768-1.png, captures/z-hub-768-routes.png, captures/z-hub-768-foot.png, captures/krabi-airport-koh-lanta-768-full.png
- Cause : src/css/vip-taxi.css:127, 162, 228, 297, 339, 356, 364 (tout passe à `min-width: 64rem`) ; le seul réglage à 48rem est la gouttière (ligne 50).
- Correction : ajouter un palier `@media (min-width: 48rem)` : `.hero { padding: 40px 0 72px }`, `.hero h1 { font-size: 46px; line-height: 1.06 }`, `.regions { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 48px 40px }`, `.rr-list--wide { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 40px }` (avec la règle de bordure de la ligne 367), `.c-from, .c-to { font-size: 56px }`, `.detail .arch { margin-inline: 0 }`, `.foot-in { grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr); column-gap: 32px }` et `.foot-legal { grid-column: 1 / -1 }`. Risque moyen : un téléphone en paysage (844 à 932 px) prend aussi ce palier, à contrôler en 844 × 390.

### B2 Hub entre 1024 et 1279 : titre sur six lignes, bouton au ras du bas d'écran
- Pages, largeurs : `/taxi/` à 1024 (iPad paysage 1024 × 768) ; dans une moindre mesure les trajets aux noms longs à 1024 (« Phuket / Airport », « Surat Thani / Airport » sur deux lignes).
- Ce qui ne va pas : le h1 passe d'un coup à 60 px dans une colonne 7fr de 512 px. Il fait 422 px de haut sur six lignes (« Private / minivans / across / Southern… »). Le bouton « Request a transfer » finit à 768 px, pile au bord de l'écran d'un iPad paysage.
- Capture : captures/z-hub-1024-hero.png, captures/phuket-airport-khao-lak-1024-1.png
- Cause : src/css/vip-taxi.css:133 (`.hero h1 { font-size: 60px }`) et 344 (`.c-from, .c-to { font-size: 64px }`), tailles fixes dès 64rem.
- Correction : `.hero h1 { font-size: clamp(44px, 4.2vw, 60px) }` (44 px à 1024, 60 px dès 1430) et `.c-from, .c-to { font-size: clamp(52px, 4.5vw, 64px) }`. Risque faible : à 1280 et 1440 la taille reste 54 et 60 px.

### B3 Hub : les lignes de trajets ne s'alignent pas d'une colonne à l'autre
- Pages, largeurs : `/taxi/` à 1440, 1280 et 1024.
- Ce qui ne va pas : la première ligne de « Khao Sok and the lake » commence 23 px plus haut que celles de Krabi et Phuket (intro sur une ligne au lieu de deux) ; même décalage pour « Trang and the deep south » face à « Surat Thani and the Gulf ». À 1024 c'est pire : trois titres de région passent sur deux lignes et les filets sont décalés de 29 px. Sur une grille de filets fins, le décalage saute aux yeux.
- Capture : captures/z-hub-1440-routes.png, captures/z-hub-1024-routes.png
- Cause : src/css/vip-taxi.css:160-161 (hauteur de `h3` et `.region-intro` libre) et 165 (grille sans sous-grille).
- Correction : `@media (min-width: 64rem) { .region-intro { min-height: 3em } }` (deux lignes de 15 px à 1.5) et `@media (min-width: 64rem) and (max-width: 79.99rem) { .region h3 { min-height: 2.4em } }`. Plus propre mais plus de test : `.region { display: grid; grid-row: span 3; grid-template-rows: subgrid }`. Risque faible avec min-height, une intro plus longue que deux lignes casserait à nouveau.

### B4 Pages trajet : une section entière pour une seule question
- Pages, largeurs : 12 trajets sur 17 n'ont qu'une question (tous sauf Krabi Airport → Koh Lanta, Phuket Airport → Koh Lanta et Surat Thani → Koh Lanta), à 1024 et plus.
- Ce qui ne va pas : un h2 « Questions » de 44 px à gauche, une seule ligne à droite, 96 px de marge dessus et dessous et un filet de séparation : 255 px de page pour une phrase. Entre « How this transfer works » et « Other routes », trois sections papier séparées par des filets se suivent avec peu de contenu, la page paraît vide et faite au gabarit.
- Capture : captures/trang-1440-qa.png, captures/koh-lanta-trang-1440-full.png
- Cause : src/taxi-route.njk:89-96 (section `.qa` quel que soit le nombre de questions) et src/css/vip-taxi.css:253-256 (deux colonnes et titre collant).
- Correction : dans taxi-route.njk, si `r.faq.length < 3`, rendre la FAQ dans `.detail-text` sous la liste `.why--route`, avec un `h3` « Questions » et le même macro `tx.faq`, sans section `.qa`. Garder la section à deux colonnes à partir de trois questions. Risque faible, à vérifier sur les 17 pages au téléphone aussi.

### B5 « Other routes » : titre écrasé dans une demi-colonne vide
- Pages, largeurs : les 17 trajets à 1024 et plus ; très visible sur les quatre régions à deux trajets (`surat-thani-koh-lanta`, `koh-lanta-donsak-pier`, `koh-lanta-trang`, `hat-yai-koh-lanta`) où la liste n'a qu'une ligne.
- Ce qui ne va pas : `.sec-head` garde sa grille 5fr / 6fr alors qu'il ne contient que le h2. Le titre est bloqué dans 527 px sur 1 200 : « Other routes / in Trang and / the deep south » sur trois lignes de 145 px, à côté d'une colonne vide, au-dessus d'une seule ligne de trajet en demi-largeur.
- Capture : captures/trang-1440-others.png, captures/surat-thani-koh-lanta-1024-full.png
- Cause : src/css/vip-taxi.css:164 (grille de `.sec-head` pensée pour le hub) appliquée à src/taxi-route.njk:101.
- Correction : `.sec-head:not(:has(> p)) { display: block }` (ou une classe `.sec-head--solo`) ; le titre tient alors sur une ou deux lignes. Risque nul sur le hub qui a un `p`.

### B6 Photo du minivan : agrandie au-delà de sa source et recadrée sur le trottoir
- Pages, largeurs : `/taxi/` à 1024, 1280 et 1440.
- Ce qui ne va pas : une photo 900 × 675 (paysage) est forcée en portrait 663 × 804 (513 × 780 à 1024). Elle est agrandie à 119 % (238 % sur écran Retina, donc floue), l'arrière du van est coupé et la moitié basse de l'image montre le pavé avec un élastique et des déchets. C'est la plus grande image de la page, juste sous le bloc laque.
- Capture : captures/z-hub-1440-van.png
- Cause : src/css/vip-taxi.css:231-232 (`grid-row: 1 / span 2` et `height: 100%; object-fit: cover; object-position: 8% 50%`) ; source `src/images/taxi/van-exterior.webp` (900 px, aucune version plus grande dans le dépôt ni dans Site_Anais).
- Correction : garder le format de la photo : `.van-wide img { height: auto; aspect-ratio: 4 / 3; object-position: 50% 45% }` et `.van-wide { align-self: center }`, ou réduire la colonne photo à 6fr. Demander à Jérémy une version plus grande de la photo si elle existe. Risque faible : la colonne photo devient plus courte que le texte, l'alignement centré compense.

### B7 Feuille de réservation à la tablette : un formulaire de téléphone sur 768 px
- Pages, largeurs : hub et 17 trajets, de 768 à 1023.
- Ce qui ne va pas : sous 64rem la feuille reste une feuille du bas pleine largeur. À 768 les champs From, To, heure et vol font 720 px de large, les trois boutons de date 235 px chacun, les compteurs sont à 600 px de leur libellé.
- Capture : captures/sheet-hub-768.png (à comparer avec captures/sheet-krabi-1024.png)
- Cause : src/css/booking.css:26 (panneau latéral seulement dès 64rem), fichier commun avec Secret.
- Correction : côté VIP seulement, dans vip-taxi.css : `@media (min-width: 48rem) and (max-width: 63.99rem) { [data-brand="vip"] .sheet { inset: auto 0 0 0; margin-inline: auto; max-width: 34rem; border-radius: 10px 10px 0 0 } }`. Risque faible, ne touche pas Secret ; vérifier l'animation d'ouverture qui reste verticale.

---

## Gravité 3, finition

### C1 Noms de lieux coupés en deux dans les lignes de trajet
- Pages, largeurs : `/taxi/` à 1024 (« Surat Thani Airport to Koh / Lanta ») ; possible sur les autres listes à colonnes étroites.
- Ce qui ne va pas : la coupure tombe au milieu d'un nom propre, « Lanta » se retrouve seul sur la ligne suivante et la ligne grandit de 23 px (décalage avec la colonne voisine).
- Capture : captures/z-hub-1024-routes.png
- Cause : src/_includes/components/taxi.njk:34 (`r.from` et `r.to` en texte libre).
- Correction : `<span class="rr-place">{{ r.from }}</span> <span class="rr-word">to</span> <span class="rr-place">{{ r.to }}</span>` et `.rr-place { white-space: nowrap }`. La coupure se fait alors avant « to » ou avant l'arrivée. Risque nul jusqu'à 320 px (« Surat Thani Airport » fait 165 px).

### C2 Les lignes de trajet débordent de 12 px de la grille
- Pages, largeurs : hub et trajets, 1024 et plus (à 1280 les filets commencent à 28 px du bord pour une gouttière de 40).
- Ce qui ne va pas : les filets partent 12 px à gauche des titres et dépassent 12 px à droite. Dans la troisième colonne du hub ils finissent à 1 332 px alors que l'encart « Not on the list? » juste dessous s'arrête à 1 320 : deux bords droits différents dans la même colonne.
- Capture : captures/z-hub-1440-routes.png, captures/krabi-1440-others.png
- Cause : src/css/vip-taxi.css:170 (`margin-inline: -12px` pour que le fond de survol déborde).
- Correction : garder le texte aligné sans faire déborder les filets : `.rr { margin-inline: 0; padding-inline: 0 } .rr:hover, .rr:active { box-shadow: -12px 0 0 var(--lac), 12px 0 0 var(--lac) }` (le fond déborde au survol seulement, les filets restent sur la grille). Risque faible, vérifier le focus (`outline-offset: -3px`).

### C3 « Other routes » : filets du bas décalés entre les deux colonnes
- Pages, largeurs : trajets de Krabi province (Krabi Airport → Khao Lak n'a pas de durée), 1024 et plus.
- Ce qui ne va pas : la ligne sans durée fait 64 px, sa voisine 74 px. Le filet du bas de la colonne droite est 10 px plus haut que celui de gauche (2 058 contre 2 068 px).
- Capture : captures/krabi-1440-others.png
- Cause : src/css/vip-taxi.css:366 (le `li` s'étire dans la grille, le lien `.rr` non).
- Correction : `.rr-list--wide li { display: grid }` pour que `.rr` remplisse la hauteur de la rangée. Risque nul.

### C4 Feuille au bureau : coins arrondis en haut d'un panneau latéral
- Pages, largeurs : hub et trajets, 1024 et plus.
- Ce qui ne va pas : le panneau collé à droite sur toute la hauteur garde un rayon de 10 px en haut à gauche et en haut à droite, contre le bord de l'écran. Peu visible (laque sur laque) mais faux.
- Capture : captures/z-sheet-1440-corner.png, captures/sheet-krabi-1440.png
- Cause : src/css/vip-taxi.css:371 (`[data-brand="vip"] .sheet { border-radius: 10px 10px 0 0 }`) plus spécifique que src/css/booking.css:30 (`border-radius: 0` au bureau).
- Correction : mettre la règle VIP dans `@media (max-width: 63.99rem)` ou ajouter `@media (min-width: 64rem) { [data-brand="vip"] .sheet { border-radius: 0 } }`. Risque nul.

### C5 Chevrons et « + » des questions sous 3:1
- Pages, largeurs : toutes, toutes largeurs.
- Ce qui ne va pas : `--gold-line` #B98B31 sur papier #F8F5EC donne 2,83:1. Le « + » qui devient « − » porte l'état ouvert ou fermé de la question, il doit atteindre 3:1 (WCAG 1.4.11). axe ne le voit pas car ce sont des pseudo-éléments.
- Capture : captures/hub-1440-qa-sticky.png
- Cause : src/css/vip-taxi.css:22 (valeur), 180 (chevron) et 246 (marque de FAQ).
- Correction : sur papier, utiliser `var(--bronze)` (#7C5A1C, 5,8:1) pour `.faq-mark` et un or plus sombre (#A07724, 3,7:1) pour `.rr .chev`. Risque nul, le doré reste.

### C6 Textes en triades qui sonnent « IA » (données existantes)
- Pages, largeurs : hub (« Our minivan », « Payment ») et 17 trajets (liste `.why--route`), toutes largeurs.
- Ce qui ne va pas : « No sharing, no stress, no waiting. », « Cash to the driver on the day. No prepayment. No hidden fees. », « Friendly drivers who know the region well. », « Clean and comfortable vehicles ». Triades et phrases qui restent vraies pour n'importe quelle compagnie de taxi : marqueurs relevés dans la mémoire anti-IA. Le même bloc de quatre avantages se répète à l'identique sur les 17 pages trajet. Ces textes viennent du site d'origine, ce n'est pas une invention de la refonte.
- Capture : captures/z-hub-1440-van.png, captures/z-hub-1024-book.png
- Cause : src/_data/taxi.json:117-131 et 161, src/_data/taxiRoutes.json:360-372.
- Correction : passer ces textes par `redaction-fr` (fiche de voix VIP Taxi) puis faire valider par Jérémy ; côté gabarit, rien à changer. Risque nul côté code.

---

## Les 3 corrections qui amélioreraient le plus la page

1. Un palier tablette à 48rem (B1, avec B7 pour la feuille) : c'est la largeur la plus mal servie, tout y est un téléphone étiré.
2. Aligner la grille des trajets (B3, C1, C2, C3) : min-height sur les intros, noms de lieux insécables, filets sur la grille. Le hub repose sur cette grille de filets fins, chaque décalage s'y voit.
3. Alléger le bas des pages trajet (B4, B5) : la question unique rejoint « How this transfer works » et « Other routes » prend toute la largeur. Les 12 pages à une question y gagnent environ 250 px et perdent l'air de gabarit vide.
