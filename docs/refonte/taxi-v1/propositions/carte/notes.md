# Proposition « carte » : la carte du sud

## Direction

- Idée : le réseau est la preuve. Le hub s'ouvre sur une carte dessinée du sud (Andaman, golfe, îles), les 17 trajets en arcs qui partent en éventail de Koh Lanta. Sur une page trajet, la carte se resserre sur le seul trajet.
- Palette : mer `#D3EAE6` (lignes d'eau `#B9DCD6`), sable des terres `#F3E6CC` et côte `#B39566`, papier `#F4F8F7`, encre de mer profonde `#0F2E37` (texte, boutons), trait des trajets `#2C5763`, or du logo `#CC9A2C` (Koh Lanta, trajet choisi) et `#7A570D` pour l'or en texte.
- Polices auto-hébergées : Sofia Sans Condensed (titres, noms de lieux, boutons), Sofia Sans (texte), Newsreader italique pour les noms de mers seulement (convention de cartographe). Encart Secret en Cormorant Garamond 600 et Manrope, vert `#0B3B3C` et sable `#F6EFE4`, emblème d'origine.
- Trait de côte : Natural Earth 10m (paquet npm `world-atlas`), découpé sur le sud et simplifié (Douglas-Peucker) ; Koh Lanta, Phi Phi, Ngai, Muk, Kradan, Rok, Haa, Talabeng, Bubu viennent de `src/_includes/geo/osm-islands.json`. SVG statique, aucune tuile.
- Au téléphone : titre, puis la carte dans le premier écran, puis la liste. Au bureau : texte et liste à gauche, carte collée à droite sur toute la hauteur.

## Ce qui est vivant

- Un seul moment fort : au chargement, les 17 lignes se dessinent l'une après l'autre ; sur une page trajet, la ligne du trajet se trace seule puis la durée apparaît dessus.
- Réponses aux gestes : survol ou focus d'une ligne de la liste allume le trajet sur la carte (or, les autres s'effacent, départ et arrivée en gras). Au doigt, un premier toucher sur la carte montre le trajet dans le bandeau sous la carte (nom, durée, « Open this route »), un second ouvre sa page. À la souris, le clic ouvre la page.
- `prefers-reduced-motion` : tout est tracé d'emblée, aucune animation.
- La carte est `aria-hidden` ; les trajets existent en vraie liste de liens (groupés par région, clavier et lecteur d'écran).

## Construction

- `geo/build.mjs` lit `taxiRoutes.json`, `taxi.json`, `site.json` et écrit les 3 maquettes ; `node geo/build.mjs --all` génère les 17 pages dans `all/` pour contrôle (fait : les 17 tiennent, étiquettes placées sans collision ni débordement). `geo/extract.mjs` refait l'extrait Natural Earth (`npm install` dans `geo/` avant).
- Étiquettes : placement automatique (jamais hors cadre, jamais sur une autre étiquette, ni sur la durée ni sur la ligne du trajet) ; le cadre d'une page trajet s'élargit du côté où l'étiquette d'un bout déborderait.
- Feuille de réservation : balisage rendu par le site, inchangé, vrai `/_site/js/booking.js`, restylée par les jetons `--sheet-*` et des règles `[data-brand="vip"] .sheet …`. Seule la page Krabi Airport–Koh Lanta a la feuille dans `_site` : pour les autres trajets le script y met les lieux comme `booking.njk` avec `cfg.from`/`cfg.to`. Le hub n'a pas encore de feuille dans `_site` : le mode libre From / To est reproduit tel que `booking.njk` le rend sans `from`/`to` (testé : envoi bloqué tant que l'adresse manque, comme le prévoit `booking.js`).
- Pour le portage : chemins des polices à passer en `/css/fonts/`, `taxi.js` à servir avec la page, la carte à générer au build Eleventy (mêmes fonctions que `geo/map.mjs`).

## Coordonnées des lieux

OpenStreetMap Nominatim, relevé du 10.11.2026 (aéroports de Krabi et Phuket, Krabi Town, Ao Nang Beach, Bang Niang pour Khao Lak, barrage de Ratchaprapha pour Cheow Lan, gare de Trang, Hat Yai, Lomprayah Donsak Pier, Phuket Town). Aéroport de Surat Thani (9.1326, 99.1356) et village de Khao Sok (8.92, 98.53) : Wikipedia. Koh Lanta posé sur le nord de l'île (7.60, 99.05). Le trait d'un trajet est un arc schématique, pas la route.

## Données absentes (rien affiché à la place)

- Pas de durée pour Krabi Airport–Khao Lak : ni dans la liste, ni sur la carte, ni dans la fiche.
- Pas de prix : « Price : Confirmed on WhatsApp ».
- « Phuket » (Phuket–Khao Sok) et « Krabi » (Krabi–Khao Sok) n'ont pas de point précis dans les données : posés sur Phuket Town et Krabi Town.
- La flèche « Hua Hin, Bangkok on request » vient de `further`.

## Accessibilité

axe-core (WCAG 2.1 A/AA + best practices) : 0 violation sur les 3 pages à 390 et à 1440 ; aucun défilement horizontal à 360, 390 et 1440. Cibles ≥ 44 px, focus visible (anneau or foncé).

## Fragile

- Autour de Koh Lanta et Krabi, les lignes se croisent : au doigt, le premier toucher peut choisir une ligne voisine (les plus courtes passent au-dessus). Le bandeau dit laquelle avant d'ouvrir, et la liste reste le chemin sûr.
- Natural Earth 10m reste grossier en gros plan (baie de Phang Nga, estuaire de Krabi) ; un trait OSM plus fin serait mieux pour les pages trajet.
- Largeur des étiquettes estimée (0,45 em par lettre), pas mesurée.
- La carte du bureau est collée à l'écran : sur une capture pleine page elle reste en haut et laisse un vide sous elle, ce n'est pas le cas en défilant.
