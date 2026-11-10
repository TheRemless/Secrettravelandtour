# laque : « Laque et or »

Servi sur http://localhost:8741/docs/refonte/taxi-v1/propositions/laque/hub.html (python3 -m http.server 8741 depuis la racine du dépôt). Les trois pages sont générées par `build.py` depuis `taxiRoutes.json`, `taxi.json` et `site.json` ; la feuille de réservation est recopiée de `_site/taxi/krabi-airport-koh-lanta/index.html`.

## Direction

- Un coffret de laque thaïe : blocs de laque `#1B130D`, papier ivoire `#F8F5EC` (second ton `#EFE8DA`), or feuille `#D9AA4E` comme seul accent, en aplat. Texte `#1B130D` et `#5B4F42` sur papier, `#F3ECDC` et `#BDAF98` sur laque, bronze `#7C5A1C` pour un mot doré lisible sur papier.
- Polices : Chonburi (affiche thaïe à fort contraste, fonderie Cadson Demak) pour les titres ; Bai Jamjuree 400, 500 et 600 (même fonderie) pour le texte. woff2 dans `fonts/`, rien d'italique.
- Idée maîtresse : un trait d'or dessiné à la main (arc de fenêtre de temple avec pointe de flamme et crochets kranok, cadre à coins creusés) qui encadre une seule chose importante par page : la photo du plafond du van sur le hub, le trajet lui-même sur la page trajet, le paiement en espèces.
- Le trajet est le titre : départ en grand, « to » et un filet qui porte la durée, arrivée en grand. Sans durée (Khao Lak), le filet va jusqu'au bord, rien d'inventé à la place.
- Le logo n'est pas touché : posé dans un disque blanc cerclé d'or (en-tête recadré sur l'éléphant et le van, pied en entier).

## Ce qui est vivant

- Le moment fort : à l'arrivée, la pointe de l'arc s'allume puis l'or descend des deux côtés (hub) ; sur la page trajet, le cadre se trace de la pointe jusqu'au bas autour du départ et de l'arrivée (`taxi.js`, recalculé à chaque taille d'écran).
- Gestes : une ligne de trajet passe en laque au toucher (or sur noir, chevron qui avance) ; boutons qui s'enfoncent ; FAQ qui s'ouvre en glissant avec le plus qui devient moins ; dans la feuille, un filet d'or se trace sous l'en-tête à l'ouverture et les choix sélectionnés passent en laque.
- La barre du bas (téléphone) se cache tant que le bouton du haut est à l'écran, puis remonte : jamais deux fois la même action à l'écran.
- `prefers-reduced-motion` : tout est dessiné d'emblée, aucune transition.

## Feuille de réservation

Balisage inchangé, vrai `/_site/js/booking.js`. Restylée par les jetons `--sheet-*` et des règles `[data-brand="vip"] .sheet …` à la fin de `taxi.css` (charge `booking.css` avant). Sur le hub, variante libre From / To construite comme le fait `booking.njk` sans `from` ni `to` (produit « Private transfer »).

## Données absentes ou à trancher

- Pas de durée pour `krabi-airport-khao-lak` : rien d'affiché.
- Pas de photo propre à chaque trajet : la page trajet reprend `van-seats.webp` (comme aujourd'hui).
- Deux h1 existent pour Krabi Airport : `taxiRoutes.json` (« …, private minivan taxi ») et `products/taxi/*.json` (« … by private minivan »). J'ai pris `taxiRoutes.json`, seul champ commun aux 17.
- Le logo a un fond blanc plein (pas de transparence) : d'où le disque blanc.
- La note Google (5.0, 133 avis) vient de `site.json`, relevée le 02.11.2026 : à rafraîchir.

## axe-core

0 violation (wcag2a, wcag2aa, wcag21aa, best-practice) sur hub, krabi et khao-lak en 390 et 1440, sur la feuille remplie, l'aperçu du message et la feuille libre du hub. Pas de défilement horizontal à 390 ni à 360.
