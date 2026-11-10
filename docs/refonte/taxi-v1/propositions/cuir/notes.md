# Proposition « cuir » : Cuir et lumière

## Direction

- Idée : le van se reconnaît à son intérieur. Le cuir fauve des sièges devient la couleur de marque, en aplat franc. Le capitonnage en losange devient l'unique motif (SVG cousu, seulement sous le bouton principal de l'en-tête du hub et de la page trajet). Les LED bleues du plafond deviennent le seul accent et dessinent le trajet.
- Palette : blanc `#FFFFFF` (fond, le logo s'y pose sans cadre), fauve `#CF8044` (panneau d'en-tête, choix cochés de la feuille), couture `#A65E2A`, fil `#F2C08C`, bleu nuit `#131C3A` (texte et boutons), bleu nuit doux `#4A5372` (texte secondaire), LED `#2F4CFF` (points du trajet, anneau de focus), daim `#F8EEE4` (encart « Somewhere else », aperçu du message).
- Pourquoi pas crème : fond crème, serif et accent terre cuite forment le cliché IA connu, et ce n'est pas le van. Sur fond blanc, le fauve se lit comme du cuir et non comme du brun. Le bleu nuit sur fauve donne 5,4 pour 1.
- Police : Archivo variable (déjà dans `src/css/fonts/`), une seule famille. Les titres sont en largeur 118 % et en graisse 790, comme un lettrage de carrosserie. Le texte courant est en largeur 100 %. Le contraste vient de la largeur, pas d'une seconde police. Ni Marcellus ni Figtree. Cormorant et Manrope ne servent que dans l'encart Secret.
- Mise en page : tout est aligné à gauche, avec de l'air et peu d'éléments. Les photos sont franches, sans voile, pleine largeur au téléphone. Les trajets sont des rangées avec des points de conduite (les points d'un sommaire) entre le nom et la durée : ces points sont les LED.

## Ce qui est vivant

- Le moment fort : sur la page trajet, la ligne de LED entre le départ et l'arrivée s'allume de gauche à droite au chargement, en 1,3 s, comme un trajet parcouru.
- En réponse aux gestes : au survol, au focus ou à l'appui sur un trajet, ses points s'allument en bleu. À l'ouverture de la feuille, la même ligne de LED s'allume sous le titre. Les boutons et les compteurs s'enfoncent légèrement à l'appui.
- La barre du bas au téléphone n'apparaît qu'une fois le bouton de l'en-tête dépassé (`taxi.js`, IntersectionObserver).
- Avec `prefers-reduced-motion`, il n'y a aucune animation : les LED sont allumées d'emblée.

## Feuille de réservation

- Le balisage est celui de `_site/taxi/krabi-airport-koh-lanta/index.html`, sans changement. Le vrai `/_site/js/booking.js` est chargé, avec `/_site/css/booking.css` dessous. La re-stylisation passe par les jetons `--sheet-*` et quelques règles `[data-brand="vip"] .sheet …` dans `taxi.css`.
- Sur le hub, la feuille est en mode libre (From / To) : c'est la sortie de la macro `bookingSheet` sans `from` ni `to`, recopiée à la main. Le titre de la feuille, « Private minivan transfer », est un libellé que j'ai choisi. Le message WhatsApp est vérifié : « Transfer request: Koh Lanta to Hua Hin… ».

## Pour le portage

- Le h1 de la page trajet est rendu à partir de `from`, de `to` et de la partie du `h1` qui suit la virgule (« private minivan taxi », « private transfer »). Le lecteur d'écran entend la phrase entière. Le gabarit marche avec les seuls champs from, to, h1, lead, body, drive et faq. Sans `drive` (Khao Lak), la ligne « Drive time » et les points de conduite disparaissent.
- Les pages ont été générées depuis les JSON par `/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/719deb02-c19a-4292-9a21-69a68ce2b88c/scratchpad/cuir/gen.py`. Ce chemin est temporaire, mais la logique est simple à porter en Nunjucks.

## Données absentes, donc rien d'affiché

- Les prix (« Price on WhatsApp »), la durée de Krabi Airport → Khao Lak, la capacité du van, le point de rencontre à l'aéroport et une photo propre à chaque trajet (`van-seats.webp` sert pour les 17).
- Les libellés des trois liens Secret sont raccourcis depuis les h1 des fiches (`4 Islands boat tour`, `Koh Rok and Koh Haa snorkelling`, `Elephant sanctuary on Koh Lanta`).

## Accessibilité

- axe-core (wcag2a, wcag2aa, wcag21, wcag22aa, best-practice) donne **0 violation** sur les 3 pages, à 390 et à 1440, feuille fermée puis ouverte. Les points « incomplets » viennent du balisage imposé de la feuille (stepper, compteurs) ou du contraste pendant l'animation d'ouverture : vérifiés à l'œil, ils sont sur fond blanc.
- Aucun défilement horizontal à 360 et à 390. Toutes les cibles font au moins 44 px. Le focus est un anneau bleu LED, bleu nuit sur le panneau fauve.
