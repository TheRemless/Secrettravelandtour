# VIP Taxi Lanta, refonte taxi v1 : brief commun aux agents de direction

## Le client et la marque

VIP Taxi Lanta est la marque de transferts privés de Mr. Brown, basée sur Koh Lanta (Thaïlande). Des minivans privés dans tout le sud de la Thaïlande (aéroports de Krabi, Phuket et Surat Thani, Ao Nang, Khao Lak, Khao Sok, Trang, Hat Yai, jetées de Donsak et Cheow Lan) et des taxis sur l'île même. Le client réserve à distance : la page rédige un message WhatsApp qu'Anaïs reçoit et auquel elle répond avec le prix. Paiement en espèces au chauffeur le jour même, rien en ligne.

Les pages sont sur secrettravelandtour.com, le site de l'agence sœur Secret Travel & Tour (excursions). Le taxi a **sa propre identité**, distincte de Secret. Secret vient d'être refait (design v4 « mouvement ») ; le taxi a encore une identité d'une refonte précédente (« Night cabin » : fond espresso, ambre, Marcellus et Figtree) et deux gabarits de page trajet différents.

Le client (Jérémy) donne **carte blanche** sur les éléments, la disposition et le design. Ses mots : « un site magnifique », « propre, épuré et vivant », « créatif », « un site qui claque visuellement ». Il juge sur un rendu, **d'abord au téléphone**. Il repère tout de suite un site « fait par IA ».

## Le dépôt

- Worktree : `/Users/admin/Desktop/stt-taxi` (branche `taxi-v1`). Eleventy 3 + Nunjucks.
- Site déjà construit dans `_site/`, servi sur **http://localhost:8731/** : `/taxi/` (hub actuel), `/taxi/krabi-airport-koh-lanta/` (gabarit récent avec feuille de réservation), `/taxi/koh-lanta-trang/` (ancien gabarit), `/` et `/tours/4-islands/` (Secret v4, pour voir la nouvelle identité de Secret).
- Captures de l'existant : `/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/719deb02-c19a-4292-9a21-69a68ce2b88c/scratchpad/taxi/avant/` (hub, krabi, trang, en 390 et 1440).
- **Ne modifie aucun fichier du dépôt hors de ton dossier de proposition. Ne lance pas de build Eleventy (le `_site` sert à tout le monde). Ne commite rien, ne change pas de branche.**

## Les données (seule source des faits)

- `src/_data/taxiRoutes.json` : les 17 trajets (id, from, to, code, title, metaDescription, h1, lead, body, drive, faq), `common.faq`, `regions` (5 régions avec intro et liste de trajets), `further`.
- `src/_data/products/taxi/*.json` : fiches produit plus riches pour 10 trajets (facts, points, photos, related). `southern-thailand.json` regroupe les 7 trajets restants dans `routes`.
- `src/_data/taxi.json` : textes du hub (hero, services, why, steps, payment, rating, faq, places, gallery, tours = ancien encart Secret).
- `src/_data/site.json` → `brands.vip` : nom, owner « Mr. Brown », vehicles, private, payment, childSeats, caseByCase, areaServed, further, places, faq, photos, **rating (5 on Google, 133 reviews, lien Google Maps)**. `brands.secret` pour Secret.
- Pas de prix de trajet dans les données : **aucun prix affiché** (« Price on WhatsApp »). `krabi-airport-khao-lak` n'a pas de durée : rien à la place.

## Règles strictes

1. **Aucun fait inventé.** Durées, véhicules, langues, notes, capacités, distances, horaires viennent seulement des fichiers ci-dessus. Une donnée absente : on n'affiche rien. Pas de nombre de sièges, pas de kilomètres, pas de « 24/7 », pas de « air-conditioned », pas de « English-speaking driver », pas de « free waiting time », pas de « meet & greet with sign » s'il n'est pas dans les données. La géographie publique (position des villes sur une carte) est acceptée.
2. **Site en anglais seulement.** Pas de « Learn more », « Get started », « unlock », « seamless », « hassle-free », « paradise », « unforgettable », pas de point d'exclamation. Un bouton dit l'action réelle.
3. **Pas d'adresse de bureau ni de comptoir à Sala Dan.**
4. **Aucun nom de prestataire.** VIP Taxi Lanta et Mr. Brown restent nommés comme aujourd'hui.
5. **Logos jamais modifiés** : `src/images/taxi/logo.webp` (VIP Taxi Lanta, éléphant doré et van, 640×640) et `src/images/secret/emblem.webp` (Secret). On peut les cadrer, les poser sur un fond, pas les redessiner ni les recolorer.
6. **Paiement : espèces au chauffeur seulement.**
7. **Photos : seulement celles du dépôt.** Taxi : `src/images/taxi/hero-ceiling-1800.webp` (plafond lumineux du van, LED bleues, ornements dorés, sièges cuir fauve capitonnés), `van-seats.webp`, `van-welcome.webp` (intérieur), `van-exterior.webp` (minivan argent dans la rue). Secret : les photos réelles de `src/images/secret/` déclarées dans `src/_data/photos-v3.json` (statut autre que placeholder). Une photo ne sert qu'une fois par page.
8. **Toutes les URL restent** : `/taxi/` et `/taxi/<id>/` pour les 17 trajets.
9. **Accessibilité et perf** : contraste AA, cibles ≥ 44 px, focus visible, `prefers-reduced-motion` respecté, rien qui casse à 390 et 360 px, pas de défilement horizontal de page. Polices auto-hébergées en woff2 (celles de `src/css/fonts/` ou que tu télécharges dans ton dossier ; pas de CDN dans le rendu final). Interdites : Inter, Roboto, Open Sans, Poppins, Montserrat, DM Sans, Space Grotesk, Instrument Serif, Geist. Cormorant Garamond et Manrope sont l'identité de Secret, pas celle du taxi.
10. **Lis `/Users/admin/.claude/projects/-Users-admin-Desktop-Claude-Plugins/memory/design-eviter-look-ia.md`** et évite chacun de ses marqueurs (badge au-dessus du h1, rangées de 3 cartes à icône, étapes 1-2-3 décoratives, glassmorphism, dégradés et lueurs, bordure colorée sur le côté des cartes, petites capitales espacées partout, emoji, pilules, « → » sur les boutons, textes de remplissage qui répètent). Lis aussi la section « Process » et la liste des 5 clichés du skill frontend-design ci-dessous.

## Les trois pièces imposées

1. **Le hub `/taxi/`** : la marque, les 17 trajets (lisibles comme des liens au doigt), comment réserver, paiement, note Google, FAQ, l'encart Secret, un moyen de demander un trajet hors liste (la feuille de réservation en mode libre From / To).
2. **La page trajet** : un seul gabarit pour les 17. Montre-le sur **deux** trajets : `krabi-airport-koh-lanta` (le plus riche) et `krabi-airport-khao-lak` (le plus pauvre : pas de durée). Le gabarit doit tenir avec seulement from, to, code, h1, lead, body, drive, faq. Bouton qui ouvre la feuille de réservation, barre du bas au téléphone, autres trajets, encart Secret.
3. **La feuille de réservation, ouverte au téléphone** (390). Le balisage est imposé : c'est `bookingSheet` de `src/_includes/components/booking.njk` en variante `taxi`, piloté par `src/js/booking.js`, partagé avec les fiches Secret. Reprends le HTML rendu de `_site/taxi/krabi-airport-koh-lanta/index.html` (`<dialog class="sheet" id="book">` et le `<script type="application/json">` de config s'il y en a un) et charge le vrai `/js/booking.js` pour qu'elle marche. Tu la **re-stylises** par du CSS limité à la page taxi (par exemple `[data-brand="vip"] .sheet …`) ; ne change pas son balisage, sauf proposition minuscule et argumentée dans tes notes. Montre aussi l'écran d'aperçu du message.

**L'encart Secret** sur le hub et les pages trajet : il doit prendre la nouvelle identité de Secret (palette et polices de `src/css/tokens.css` et `src/css/v4.css` : vert profond `#0B3B3C`, sable `#F6EFE4`, Cormorant Garamond 600 et Manrope, emblème d'origine) et être beau. Pas d'étiquette « Our partner » en pastille, pas de script, pas de polaroïd. Liens possibles vers `/`, `/tours/4-islands/`, `/tours/koh-rok-koh-haa/`, `/tours/elephant-sanctuary/` (vérifie les URL dans `_site`).

## Ce que tu livres

Dans `docs/refonte/taxi-v1/propositions/<ton-nom>/` :

- `hub.html`, `krabi-airport-koh-lanta.html`, `krabi-airport-khao-lak.html` : maquettes HTML qui marchent servies depuis la racine du dépôt (lance ton propre `python3 -m http.server <port>` depuis `/Users/admin/Desktop/stt-taxi`, port 8740 à 8749 selon ton nom, et utilise des chemins absolus `/src/images/taxi/...`, `/src/css/fonts/...` ; pour booking.js, `/_site/js/booking.js`). Données réelles, recopiées ou chargées depuis les JSON.
- Ton CSS dans un fichier `taxi.css` à côté (c'est lui qui sera porté dans le site), un JS seulement si ton idée en a besoin.
- `shots/` : `hub-390.png`, `hub-1440.png`, `krabi-390.png`, `krabi-1440.png`, `khao-lak-390.png`, `sheet-390.png` (feuille ouverte, remplie), `sheet-preview-390.png` (aperçu du message). Pleine page, 390 en DPR 2 et 1440 en DPR 1. Playwright : `import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs"`, exécutable `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. axe-core est dans le même `node_modules` : passe-le sur tes pages à 390 et 1440 et vise 0 violation.
- `notes.md` en français, court : ta direction en 5 lignes (palette en hex, polices, idée maîtresse), ce qui est vivant (mouvement, interaction), les données que tu n'as pas trouvées, le résultat axe.

Regarde tes propres captures, critique-les, corrige. Avant de rendre, passe la checklist anti-IA. Une direction forte et finie vaut mieux que trois idées à moitié faites.
