# Design v4 dans Eleventy : notes de construction (08.11.2026)

Base : le prototype « mouvement » choisi par le client, porté dans le vrai site (branche `refonte`), plus quatre ajouts pris dans les prototypes « reservation », « mobile », « rupture » et « recit ». Tout le contenu est rendu au build ; le JavaScript n'ajoute que le comportement. Sans JS, chaque page reste lisible, chaque sortie a son lien et la réservation retombe sur un lien WhatsApp simple.

## Fichiers

| Rôle | Fichier |
|---|---|
| Données des pages (cartes, horaires, comparateur, carte, catalogue) | `src/_data/v4data.js` (remplace `v3data.js`) |
| Estimation d'un prix depuis les lignes de prix (navigateur et build) | `src/js/v4-price.js` |
| Composants Nunjucks | `src/_includes/components/v4.njk`, `src/_includes/v4-head.njk` |
| Styles | `src/css/v4.css` (avec `tokens.css` et `booking.css`) |
| Comportements communs (en-tête, transitions, préchargement, photos, odomètre, segments, feuilles au doigt, liste de sorties) | `src/js/v4.js` |
| Par page | `src/js/v4-home.js`, `src/js/v4-four.js`, `src/js/v4-hub.js` |
| Chargés au premier usage | `src/js/v4-trips.js` (liste de sorties), `src/js/v4-lightbox.js` (visionneuse), `/data/catalog.json` (`src/catalog-json.njk`) |
| Contours des îles | `src/_includes/geo/osm-islands.json` (OpenStreetMap, ODbL, repris du prototype « recit ») |
| Pages | `src/pages/home.njk`, `4-islands.njk`, `tours.njk`, `components.njk` (`/_components/`, jamais en production), `credits.njk` |

Supprimés car morts : `src/_data/v3data.js`, `src/_includes/components/v3.njk`, `src/_includes/v3-head.njk`, `src/css/v3.css`, `src/js/v3.js`. `booking.css` et `booking.js` restent partagés avec les pages taxi, sanctuaire et location.

## Porté de « mouvement »

- Palette et polices de la v3 (Cormorant Garamond 600, Manrope 400 et 600 auto-hébergées), mise en page des trois pages, rayons ramenés à 12 px (14 px pour les boutons).
- Transition entre pages : la photo de la carte cliquée devient le hero de la page produit (`@view-transition`, `pageswap` et `pagereveal` dans `v4.js`, nom `trip-photo` posé seulement sur la photo cliquée). Retour vers le hub : la photo revient à sa carte. Préchargement : Speculation Rules (`moderate`) plus `rel=prefetch` au survol de 80 ms ou au premier toucher, rien en mode économie de données.
- En-tête qui se compacte au défilement (CSS `animation-timeline`, repli en classe `is-scrolled`), se cache en descendant et revient au moindre retour.
- Retour au toucher (`scale(.97)`) sur boutons et cartes ; vignette floue (20 px, calculée au build avec sharp) et couleur moyenne, photo en fondu au décodage, jamais sur la photo du haut.
- Accueil : hero à trois sorties (4 Islands, Koh Rok, Phi Phi) dont la pastille glisse ; les deux autres photos n'arrivent qu'à la première intention (survol, focus, toucher). Autres sorties en bateau, rail des activités (barre de progression pilotée par le défilement, flèches, glisser-lancer à la souris), chercheur De / Vers avec inversion qui croise les champs, durée et lien vers la page `/taxi/...` existante, location (type, fourchette qui roule, nombre de véhicules et modèles, message prérempli), « How booking works » remplacé par le message qui se compose quand on essaie (sortie, jour, adultes, âge de chaque enfant ; les lignes qui changent s'éclairent ; même fonction `buildMessage` que la feuille), bande finale.
- 4 Islands : hero, galerie mosaïque, visionneuse au doigt (glisser, élasticité aux bords, pincer, double-toucher, tirer pour fermer, flèches, Échap, + et −, boutons sur bureau), parcours qui se réorganise au changement de bateau (View Transitions même document, noms posés le temps du changement), Koh Kradan en option sur le privé, calculateur collant (adultes, âge de chaque enfant, total qui roule ligne par ligne, frais de parc en espèces à part), journée, feuille de réservation au doigt sur mobile et en panneau sur bureau, questions qui s'ouvrent en douceur (`interpolate-size`), bande basse qui apparaît quand le bouton du haut sort de l'écran et s'efface devant le calculateur et le pied de page.
- Hub : filtres type et tri, cartes qui glissent à leur place, compteur qui roule, état dans l'adresse (`?type=boat&sort=asc`, et `#boat-trips` ou `#activities` depuis le menu), comparateur jusqu'à trois sorties, vignette qui s'envole jusqu'au tiroir, tableau dans une fenêtre.
- Non importés, comme demandé : recherche ⌘K, barre d'onglets en bas, aperçu en feuille du hub.

## Les quatre ajouts

1. **Liste de sorties.** Bouton « Add to trip list » sous chaque carte (accueil, hub, autres sorties), bouton « Add to my trip list » dans la feuille de réservation de la 4 Islands (option, date et groupe déjà choisis, validés comme la feuille sauf l'hôtel et le prénom). Compteur dans l'en-tête (le bouton n'apparaît qu'à partir d'une sortie). Tiroir : feuille au doigt sur mobile, panneau sur bureau, mêmes styles que la feuille de réservation. Groupe (adultes, âge de chaque enfant), sorties classées par jour, option et date par sortie, alerte quand deux sorties d'une journée (`Duration: Full day`) tombent le même jour, alerte quand une date sort de la saison écrite (Koh Rok), hôtel et prénom, aperçu du message, envoi en un seul message WhatsApp. Suppression annulable (toast « Undo »). Gardée en `localStorage` (`stt-trips`), en mémoire si le stockage est bloqué. Message construit par `buildTripList` (dans `booking.js`, testé) : en-tête « Trip list: n trips », invités, hôtel, prénom, puis un bloc par jour avec, pour chaque sortie, sa référence (même format que la feuille, `4I-2011-2A1C`), l'option, les suppléments, le prix vu sur le site et l'adresse de la page.
2. **« What runs on … »** sur l'accueil. Au build : une ligne par horaire écrit dans les fiches (faits `Hotel pickup`, `Boat leaves`, `Sessions`, `Raft`, cours de cuisine et de batik, `Half days`, `Full days`, blocs du déroulé des radeaux des mangroves), avec la saison et les jours de la semaine lus dans les mêmes faits. Sans JS, la section s'appelle « Set times, trip by trip » et montre tout avec ses règles. Avec JS : ruban de 14 jours à l'heure de Bangkok (Today, Tomorrow, puis la date) et « Other date » ; les lignes qui ne tournent pas ce jour-là sont retirées et la sortie passe dans « Not on this day » avec sa raison (« Runs October to April », « Runs Monday to Saturday »). Bureau : frise de 04:00 à 22:00, une barre du premier au dernier horaire écrit, un point par séance (sanctuaire). Mobile : matin, après-midi, soir. Les sorties sans horaire sont listées à part sous « No set time on the site ».
3. **Comparateur des trois bateaux** sur la 4 Islands : trois colonnes (empilées sur mobile) avec bateau, à bord, îles, déjeuner, ponton, toutes les lignes de prix, et la ligne « For 2 adults, 1 child (age 7) » qui suit le calculateur. « Choose this boat » change l'option partout (parcours, calculateur, carte, feuille).
4. **Carte du trajet** : SVG rendu au build depuis les contours OpenStreetMap, palette v3 (mer `--on-dark`, îles `--shell`, Koh Lanta `--sand`, tracé `--sea`, bateau `--deep`). Sur bureau elle reste à l'écran à côté de la journée ; l'étape dont le haut passe le milieu de l'écran allume les tronçons parcourus, le bateau se pose sur l'île lue, son nom passe en vert. La bascule longtail / speedboat (le segment, le comparateur ou la feuille) redessine la route et remplace la journée par la liste des arrêts du speedboat. Mobile : la carte se replie derrière un bouton « Show the route map », jamais collante. Mentions « Sketch map, not for navigation » et « Island outlines © OpenStreetMap contributors » sous la carte.

État partagé sur la 4 Islands : option, adultes, âges et Koh Kradan vivent dans le brouillon de la feuille (`stt-book:4-islands`, `makeDraft`/`restoreDraft` de `booking.js`). Le calculateur l'écrit, la feuille le relit à l'ouverture et émet `stt-book-change` à chaque saisie : on choisit un groupe d'un côté, on le retrouve de l'autre.

## Écarts avec les prototypes, et pourquoi

| Écart | Raison |
|---|---|
| La feuille de réservation reste celle de `booking.js` (aperçu du message, référence, adresse de la page, Today / Tomorrow / Other date), habillée v4, avec la poignée et le geste « tirer vers le bas pour fermer » de « mouvement » ; pas la bande de 21 jours ni le calendrier de `reserve.js` | Parcours existant à garder (option préremplie, aperçu, message structuré) et tests existants sur ce parcours |
| Suppléments (Koh Kradan) ajoutés au message de la feuille (`Extras:`), seulement si l'option choisie les propose | Le prototype mettait « with Koh Kradan » dans le titre ; ici le changement d'option dans la feuille ne laisse pas un supplément fantôme |
| Menu : Transfers vers `/taxi/`, Rental vers `/tours/rental/` | Vraies pages (liens internes utiles au référencement) au lieu d'ancres de l'accueil |
| Pas de champ de recherche dans le hub | Le brief ne garde que type et tri ; la recherche ⌘K est écartée |
| Les cartes du hub ouvrent la page produit (transition de photo) | Aperçu en feuille écarté par le client |
| Journée de la 4 Islands sans la ligne qui se remplit ni le bateau collant de « mouvement » | La carte (ajout 4) fait déjà ce travail ; deux dispositifs qui suivent la lecture se concurrençaient. Les étapes s'allument toujours |
| « Lunch » en texte vert, pas en pastille | Liste anti-IA (libellés en pilules) |
| Rayons 12 et 14 px, survols et surlignages en `--deep-soft`, `--sand` et `--shell` | Règles de rayons et de palette de `check-v3` |
| Pas de `<link rel="expect" blocking="render">` | Les pages sont rendues au build, rien à attendre |
| Liste de sorties : un seul groupe pour toute la liste (repris du dernier ajout depuis une page produit) | Message plus court et lisible pour l'agence ; « reservation » faisait pareil |
| Le toast rejoint la feuille ouverte | Une feuille modale rend le reste de la page inerte : l'« Undo » doit rester cliquable |
| Comparateur des bateaux en colonnes, pas en tableau | Lisible à 390 px sans défilement horizontal |
| Préchargement de la photo du haut (`rel=preload` avec `imagesrcset`), Manrope 600 n'est plus préchargée | LCP mobile |

## Lignes cachées faute de donnée (rien n'apparaît en production)

- 4 Islands, speedboat : horaires (la journée affichée est celle du longtail, titrée « Times for the join-in longtail » ; en speedboat, la liste des arrêts n'a pas d'heure et une phrase dit que les horaires ne sont pas encore sur le site), nom du ponton (le déroulé dit « a separate pier », l'option dit « Lanta Old Town pier » : ligne « Pier » cachée pour le speedboat dans le parcours et le comparateur), photo du speedboat (la photo du longtail disparaît quand on choisit le speedboat), prix des moins de 4 ans (le calculateur dit « no price on the site for this boat, we confirm it on WhatsApp » pour cet âge, sans chiffre).
- Bateau privé : les enfants sont comptés dans la taille du groupe (« 3 to 4 people ») ; c'est la lecture des lignes de prix, à confirmer par le client (TODO déjà ouvert).
- « What runs on … » : aucune saison n'est écrite pour 4 Islands, Phi Phi, mangroves, pêche, sanctuaire ni plongée, donc ils apparaissent chaque jour ; les mois de fermeture du parc ne sont pas dans les données. Koh Talabeng & Koh Bubu, plongée, ATV et karting n'ont pas d'horaire : listés sous « No set time on the site ». Les demi-journées en longtail et en kayak des mangroves n'ont pas d'horaire : seules les trois sorties en radeau sont sur la frise.
- Transferts de l'accueil : le lien de « Minivan, shared or private » (`/transfers/`, page pas encore faite) n'est pas affiché.
- Délai de réponse (`site.json replyTime` vide) : aucune phrase dans la feuille ni dans la liste.
- Comparateur du hub : une case sans fait dans la fiche affiche « Not on the trip page » (par exemple la saison de la 4 Islands).
- Photos : toujours celles de `photos-v3.json`, dont 17 placeholders crédités sur `/credits/` (le build de production les refuse tant que `STT_ALLOW_PLACEHOLDERS=1` n'est pas posé).

Textes d'interface écrits pour la v4 (pas des faits) : « Set times, trip by trip », « As written on each trip page, at Koh Lanta time », « No set time on the site », « Not on this day », « Nothing with a set time runs that day… », « The three boats side by side », « Show the route map », phrases de la liste de sorties et des toasts. Le lead de l'accueil est celui de `home.json` sans le comptoir de Sala Dan. Sala Dan n'apparaît plus que comme ponton du speedboat (texte de `home.json`).

## `check-v3.mjs` adapté

Lit `tokens.css`, `v4.css` et `booking.css` (plus `v3.css`). Rayons : accepte aussi les jetons `--r` (12 px) et `--r-btn` (14 px) et leurs combinaisons avec 0 ; refuse tout le reste (un 4 px de focus a été retiré). `overflow-x: auto` permis seulement dans `v4.css` pour les trois défilements internes (rail des activités, ruban de dates, galerie mobile) ; l'absence de défilement de page est vérifiée à 390 et 1440 px dans Playwright. Ajouts : un seul H1, pas de `[DONNÉE À FOURNIR]` ni `[PHOTO À FOURNIR]`, pas d'adresse ni de comptoir de Sala Dan ; le script sort maintenant en erreur si une règle échoue. Palette, polices, mots interdits, points d'exclamation : inchangés.

## Résultats des contrôles

- `STT_ALLOW_PLACEHOLDERS=1 npm run build` : OK, `check-dist` OK (avertissements seulement sur les anciennes pages et les prototypes sous `/_v4/`).
- `npm test` : 229 tests, 229 verts (les 222 d'avant sans modification, plus 7 dans `tests/design-v4.test.js` : chaque horaire de « What runs on » est écrit dans sa fiche, saison et jours, sorties sans horaire, calculs du calculateur, prix du comparateur égaux aux données, suppléments du message, message de la liste de sorties et alerte du même jour, catalogue).
- `node scripts/check-v3.mjs` : 22 contrôles OK.
- Playwright (Chrome) à 390 px (DPR 2) et 1440 px : aucune erreur console, aucun défilement horizontal sur les trois pages. Parcours vérifiés : hero, ruban de dates (dimanche : le cours de cuisine passe dans « Not on this day » ; juin : Koh Rok « Runs October to April »), chercheur De / Vers et inversion, location, message d'essai, liste de sorties depuis les cartes (erreurs par champ, message par jour, suppression et annulation), 4 Islands (speedboat : parcours, carte et journée ; 2 adultes et un enfant de 7 ans : 5 000 THB ; privé avec Koh Kradan : 6 900 THB ; 2 ans en speedboat : prix renvoyé sur WhatsApp ; feuille préremplie, message avec `Ref: 4I-…`, `Extras:` et l'adresse de la page jusqu'à l'URL `wa.me` ; ajout à la liste depuis la feuille), visionneuse au clavier, hub (`#activities` → 7 sorties, bateaux par prix croissant, état dans l'adresse, comparateur à trois).
- axe-core 4.10 (WCAG 2.1 A et AA, bonnes pratiques) : 0 violation sur l'accueil, la 4 Islands, le hub et les crédits, à 390 et 1440 px, aussi avec la feuille de réservation et la liste de sorties ouvertes.
- Lighthouse 12.2 mobile (Moto G Power, 4G lente simulée), serveur local compressé en gzip comme Netlify :

| Page | Performance | LCP | CLS | TBT | Poids | Accessibilité, bonnes pratiques, SEO |
|---|---|---|---|---|---|---|
| `/` | 98 | 2,4 s | 0 | 0 ms | 400 Ko | 100, 100, 100 |
| `/tours/4-islands/` | 98 | 2,3 s | 0 | 0 ms | 224 Ko | 100, 100, 100 |
| `/tours/` | 99 | 2,0 s | 0 | 0 ms | 325 Ko | 100, 100, 100 |

JS de la première visite (gzip) : `v4.js` 5,9 Ko + script de page 2,5 à 5,6 Ko (+ `booking.js` 9,5 Ko et `v4-price.js` 1,6 Ko sur la 4 Islands). Chargés au premier usage : liste 5 Ko, visionneuse 3 Ko, catalogue 3,7 Ko. CSS `v4.css` 12 Ko.

Captures (non commitées, `docs/refonte/design-v4/build/shots/`) : pleine page des trois pages à 1440 (DPR 1) et 390 (DPR 2), plus les états (speedboat, comparateur, carte, feuille, liste, ruban, tiroir et tableau du hub). La bande du bas est masquée pendant la capture pleine page seulement (Chrome la peindrait au milieu de l'image).

## Pas fini ou pas vérifié

- Safari et Firefox non testés sur appareil : sans View Transitions, tout marche sans mouvement (chemin codé et vérifié en mouvement réduit dans Chrome), mais pas vu dans WebKit.
- LCP de l'accueil à 2,4 s : sous la cible, avec peu de marge ; la photo de la 4 Islands du hero (57 Ko en AVIF 768 px) est la plus lourde à arriver.
- Données client toujours ouvertes : horaires et ponton du speedboat, moins de 4 ans en speedboat, enfants dans le groupe du privé, mois de fermeture du parc, délai de réponse, vraies photos.
- Rien n'est poussé.

## Pages produit (08.11.2026)

Toutes les fiches qui ont une URL dans `src/_data/products/**` sont passées sur le design v4, sauf `/transfers/` (la page n'existe pas aujourd'hui : rien n'a été créé, le lien reste caché). Les pages `/taxi/` n'ont pas bougé.

### Fichiers

| Rôle | Fichier |
|---|---|
| Mise en forme des fiches (sections, prix, frais, déroulé, sous-variantes, grille du speedboat) | `src/_includes/components/v4-product.js` |
| Sections communes (hero, options et prix, déroulé, inclus, avant de réserver et questions, autres sorties, bande du bas) | `src/_includes/components/v4-product.njk` |
| Gabarit générique bateaux et activités (paginé sur `v4data.productPages`) | `src/pages/product.njk` |
| Variante location, variante speedboat | `src/pages/rental.njk`, `src/pages/speedboat.njk` |
| Bande du bas des fiches | `src/js/v4-product.js` |
| Feuille de réservation (sous-variantes, location, speedboat) et liste de sorties | `src/js/booking.js`, `src/_includes/components/booking.njk`, `src/js/v4-trips.js` |
| JSON-LD (Service pour le speedboat, fil d'Ariane vers `/tours/#boat-trips` et `/tours/#activities`) | `src/_includes/components/schema.js` |
| Tests | `tests/product-pages.test.js` (10 tests), plus `pages-seo`, `partenaires`, `terms`, `schema`, `design-v4` adaptés |

Supprimés car morts : `src/secret-page.njk`, `src/_data/secretPages.js`, `src/_includes/stt-product.njk`, l'ancienne `src/pages/rental.njk` et `src/pages/elephant-sanctuary.njk`, les entrées `elephant` et `rental` de `pages.js`. `secret.json` et `secretPagesContent.json` restent : des tests de faits les lisent et ils servent de point de comparaison. `stt.njk`, `stt.css` et `ui.js` restent pour `/taxi/krabi-airport-koh-lanta/` et les planches `/design/`.

### Ordre des sections, le même partout

1. Hero : fil d'Ariane, H1, accroche, faits clés courts (40 caractères au plus, 4 au plus), prix d'appel ou « Price on WhatsApp », bouton qui ouvre la feuille, lien « Ask a question on WhatsApp ».
2. Photos (galerie) : seulement la 4 Islands en a dans `photos-v3.json`.
3. Options et prix (« Options and prices », « Times and prices » pour le speedboat) : une colonne par option, toutes ses lignes avec montant et unité, « Price on WhatsApp » si l'option n'a pas de prix, un bouton « Choose this option » qui ouvre la feuille sur elle ; les frais sur place à part (« Not in the price, paid in cash on the day » quand la donnée dit cash).
4. Déroulé : « How the day goes » (ligne de temps) ou « What you do, option by option » (un bloc par option), avec à côté les faits descriptifs de la fiche.
5. Inclus et non inclus.
6. Avant de réserver (« Before you book »), puis questions.
7. Autres sorties : cartes des fiches citées dans `related`, lien vers le hub, transfert ou speedboat quand la fiche les cite.

Le menu marque la rubrique (Boat trips, Activities, Rental, Transfers pour le speedboat) ; le fil d'Ariane dit Home / Boat trips ou Activities / la fiche (Home / la page pour la location et le speedboat). Le JSON-LD reprend les mêmes niveaux.

### Page par page

Lignes affichées = lignes de prix visibles dans « Options and prices » ; JSON = lignes `prices[]` des options. Frais = lignes `notIncludedFees` affichées à part.

| Page | Photo du haut | Options et prix | Déroulé | Inclus | Avant de réserver | Questions | Autres sorties | Options | Lignes affichées / JSON | Frais | Options sans prix |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `/tours/koh-rok-koh-haa/` | carte | oui | journée (join-in speedboat) | oui | oui | oui | oui | 4 | 6 / 6 | 4 | 2 |
| `/tours/koh-phi-phi/` | carte | oui | journée (join-in speedboat) | oui | oui | oui | oui | 2 | 2 / 2 | 4 | 1 |
| `/tours/koh-talabeng-koh-bubu/` | carte | oui | journée | oui | oui | oui | oui | 1 | 0 / 0 | 0 | 1 |
| `/tours/mangroves/` | carte | oui | par option (3 radeaux) | oui | oui | oui | oui | 7 | 17 / 17 | 4 (par option) | 0 |
| `/tours/fishing-trip/` | carte | oui | journée (radeau) | oui | oui | oui | oui | 2 | 3 / 3 | 0 | 1 |
| `/tours/elephant-sanctuary/` | carte | oui | par option (A, B, C) | oui | oui | oui | oui | 3 | 9 / 9 | 0 | 0 |
| `/tours/kayak/` | carte | oui | par option (7) | oui | oui | oui | oui | 7 | 14 / 14 | 1 | 0 |
| `/tours/cooking-class/` | carte | oui | journée (single et partner chef) | oui | oui | oui | oui | 3 | 4 / 4 | 0 | 0 |
| `/tours/scuba-diving/` | carte | oui | par option (5) | oui | oui | oui | oui | 6 | 26 / 26 | 5 | 0 |
| `/tours/atv/` | carte | oui | par option (3) | oui | oui | oui | oui | 3 | 12 / 12 | 0 | 0 |
| `/tours/batik/` | carte | oui | par option (2) | oui | oui | oui | oui | 3 | 4 / 4 | 0 | 1 |
| `/tours/go-kart/` | carte | oui | absent (pas de `day`) | oui | oui | oui | oui | 2 | 8 / 8 | 0 | 0 |
| `/tours/rental/` | absente | oui (un véhicule = une ligne qui ouvre la feuille) | absent | absent | oui | oui | oui (liens) | 3 | 35 / 35 | 0 | 0 |
| `/tours/speedboat/` | absente | grille des départs (19 arrêts au départ de Koh Lanta, 14 vers Koh Lanta) | absent | absent | oui | oui | oui | 0 | 0 / 0 | 0 | prix des billets |

Total : 140 lignes de prix dans le JSON, 140 affichées. Le test `prix : chaque ligne de chaque option du JSON est sur la page` vérifie le libellé, le montant et l'unité de chacune dans `_site`.

### Aucune demande vague

- Chaque fiche : la feuille s'ouvre sur l'option du bouton cliqué ; depuis le haut de page ou la bande du bas, une fiche à plusieurs options ouvre la feuille sans option et refuse l'envoi (« Choose an option. » sur le champ). Une fiche à une seule option la prend d'office.
- Message : `Ref`, `Booking request: produit – option`, une ligne par sous-variante, date, groupe avec l'âge de chaque enfant, prise en charge, prénom, `Price on website` (lignes de l'option avec leur unité ; seulement la ligne choisie quand la sous-variante désigne une ligne de prix), adresse de la page.
- Sous-variantes obligatoires dans la feuille et dans la liste de sorties : séance des éléphants (A : 07:30, 10:00, 13:00 ; B : 07:30, 13:00, lu dans le déroulé ; C : 07:30 seul, rien à choisir), créneau des demi-journées de kayak (matin 09:30–12:30, après-midi 14:00–17:00) et kayak ou longtail pour le parc de pêche (kayak et mangroves), cours de batik du matin ou de l'après-midi, cours de cuisine du matin ou du soir (le soir est réservable ; la date doit tomber un mardi, jeudi ou vendredi, sinon erreur sur le champ) et créneau de sculpture, plongée (programme d'essai, sites des fun dives, trajet du catamaran, cours, niveau et dernière plongée pour les certifiés, suppléments à cocher : plongée en plus, refresher, nounou), nombre de karts par type, nombre de pilotes et de passagers par catégorie (ATV).
- Location : catégorie (obligatoire), modèle (prérempli depuis la ligne cliquée), nombre de véhicules, date et heure de début, date et heure de fin, prix du modèle ou fourchette de la catégorie, référence `RN-jjmm-jjmm`.
- Speedboat : trajet (sens compris : « Koh Lanta to … » ou « … to Koh Lanta »), départ de la grille, date, aller simple ou retour ; pour un retour, date et bateau du trajet inverse quand la grille l'a, sinon une heure libre. Référence `SB-…`.
- Liste de sorties : plus d'option par défaut ; l'envoi est bloqué tant qu'une sortie n'a pas son option (fiche à plusieurs options), sa date et ses sous-variantes ; chaque manque est dit sur son champ et résumé au-dessus du bouton (« 4 things are missing: … »).
- Liens WhatsApp : sur une fiche, « Question about Koh Phi Phi (secrettravelandtour.com/tours/koh-phi-phi/): » dans l'en-tête, le menu, le haut de page et le pied ; le repli sans JavaScript de chaque bouton nomme le produit, l'option et la page. Accueil, hub et 4 Islands : « Hello, a question from secrettravelandtour.com/… » ; les messages de la location et de la bande finale de l'accueil et du hub finissent par `Page: …`.

### Structure des sous-variantes, à remplir dans les JSON

Tant qu'une option ne déclare rien, `FALLBACK` (dans `v4-product.js`) déduit les sous-variantes des faits et du déroulé déjà écrits dans la fiche, sans inventer de valeur. Dès qu'une option déclare un de ces champs, il remplace la déduction pour cette option.

```json
"options": [{
  "id": "programme-b",
  "choices": [
    { "id": "session", "label": "Session", "values": [{ "id": "0730", "label": "07:30–08:00" }, { "id": "1300", "label": "13:00–13:30" }] },
    { "id": "class", "label": "Class", "values": [{ "id": "evening", "label": "Dinner class, 16:00–21:00", "days": ["Tuesday", "Thursday", "Friday"] }] },
    { "id": "course", "label": "Course", "values": [{ "id": "ow", "label": "Open Water Diver", "row": "Open Water Diver, 3 days, 4 dives" }] },
    { "id": "cert", "label": "Certification and last dive", "type": "text", "hint": "Your level and the month of your last dive." }
  ],
  "counts": { "label": "Karts", "rows": ["Small single seat", "Large double seat"] },
  "extras": ["Extra dive, decided on the day"]
}]
```

- `choices[].values[].row` : libellé exact d'une ligne de `prices[]` de l'option (le message ne garde que ce prix) ; `days` : jours où la valeur a lieu (la date est vérifiée) ; `required: false` pour un choix facultatif ; `id` sans tiret.
- `counts.rows` et `extras` : libellés exacts de lignes de `prices[]` de l'option.
- Proposé, pas encore lu par le code faute de donnée : expérience du pilote pour les tours ATV B et C (`choices` texte), créneau des demi-journées longtail et kayak des mangroves, suppléments de location de matériel de plongée sur chaque plongée (aujourd'hui une colonne « Rentals and discounts » sans bouton, `kind: "extra"`), passeports pour Langkawi, zone de l'hôtel pour le speedboat, boîte AT ou MT et lieu de remise pour la location.

### Écarts de données entre les sources (non tranchés : la page affiche `products/**`)

Comparaison ligne par ligne par script : aucun montant, aucun libellé de prix et aucune tranche d'âge ne diffère entre `products/**` et `secretPagesContent.json` (137 lignes contre 140, les 3 en plus sont « Child under 4 » des éléphants). Différences de faits :

| Produit | Sujet | `products/**` | Autre source |
|---|---|---|---|
| Koh Rok, Phi Phi, éléphants, kayak | Assurance | `included` sans assurance (« Guide ») | `secretPagesContent.json` : « Guide and insurance » ou « Insurance » (TODO déjà ouvert dans `site.json`) |
| Koh Rok | Options | `private-speedboat` (09:00 à 16:00) et `sunset`, sans prix | `secretPagesContent.json` : seulement dans `goodToKnow` |
| Phi Phi, batik | Options | `private-speedboat`, `private-course`, sans prix | `secretPagesContent.json` : phrase « ask us », pas d'option |
| Koh Talabeng | Formule | `half-day` en « join-in » | `secretPagesContent.json` : rien sur join-in ou privé |
| Mangroves | Kayak et ATV | rien | `secretPagesContent.json` `goodToKnow[1]` : kayak combinable avec une heure d'ATV, deux heures en tout |
| Mangroves | Frais du village | 40 THB sur 4 options, dont Old Town et parc de pêche | `secretPagesContent.json` : « on the longtail and kayak trips » seulement |
| Fishing trip | Longtail | option `longtail` privée | `secretPagesContent.json` : rien sur le longtail ; l'accueil dit longtail, la carte radeau (TODO) |
| Éléphants | Programme C | « Two people per session at most » | `secretPagesContent.json` : « Two people at most, booked ahead » (TODO) |
| Éléphants | Durée | « About 1 hr 30 min to a full day » | `secret.json` : « Half day » |
| Éléphants | Séances | B à 07:30 ou 13:00, C à 07:30 (déroulé) | Brochure (audit B) : A 07:30, 10:00 ou 13:00, B 07:30 ou 13:00, C 07:30, créneaux d'une demi-heure |
| Kayak, batik | Réserve sur les horaires | rien | `secretPagesContent.json` : « Times can change with the tide and the weather » |
| Cuisine | Prix du soir | rien | `secretPagesContent.json` : « The morning and evening cooking classes cost the same » |
| Cuisine | Âges partner chef | `ages` 5 à 12 sur l'option | `secretPagesContent.json` : recommandation, pas une limite |
| Plongée | Élèves par moniteur | « two or three students at most » | `secretPagesContent.json` : « never more than two » (TODO) |
| Plongée | Frais de parc | 5 frais sur les 6 options, cours compris | `secretPagesContent.json` : condition « Koh Haa, Hin Daeng or Phi Phi » sur les seules lignes plongeur |
| Plongée | Unités | 8 lignes sans unité (ordinateur, Nitrox, GoPro, nounou, forfaits) | `secretPagesContent.json` : « per person » pour toute la page |
| Plongée, batik | Durée | React Right « Half day » ; kayak et peinture jusqu'à 17:00 | `secret.json` : « From one day » ; « Half day » |
| Karting | Unité, minimum | « per kart » ; minimum seulement en TODO | `secretPagesContent.json` : sans unité ; « for a minimum of 2 programmes » |
| Location | Unité | lignes et prix d'appel « per 24 hours » | faits, FAQ et méta-description de la même fiche, `secretPagesContent.json`, `secret.json` : « per day » |
| Location | Conditions | caution passeport, casques, livraison | rien ailleurs (source : Jérémy, 03.11) |
| Speedboat | Fin de saison Krabi, Railay, Koh Yao, Ao Nang | `seasonRange` jusqu'au 30 avril | `secretPagesContent.json` : « From December to April », « from 1 December » |
| Speedboat | Saison du départ de 10:30 | `seasonRange` 1er novembre au 15 avril sur tout le départ | `secretPagesContent.json` : la saison vaut pour Langkawi seulement (la page l'affiche pour Langkawi seulement) |
| Koh Rok, Phi Phi, plongée, speedboat | Règle météo | `beforeYouBook.weather` propre à la fiche | `site.json` `booking.weather` (report ou remboursement), ajoutée après sur la page |
| ATV | Annulation | 24 h, moitié due ensuite | `site.json` `booking.cancellationPolicy` « none » (TODO) |

### Lignes cachées faute de donnée

- Photos : aucune fiche n'a de galerie dans `photos-v3.json` ; la section « Photos » est absente partout sauf sur la 4 Islands. Photo du haut = photo de la carte de la sortie (12 fiches) ; aucune pour la location et le speedboat (pas de carte, pas de photo déclarée).
- « Price on WhatsApp » : Koh Rok privé en speedboat et version coucher de soleil, Phi Phi privé, Koh Talabeng, pêche en longtail, batik privé, billets du speedboat.
- Unités absentes du JSON, donc non affichées : 8 lignes de la plongée.
- Notes internes jamais affichées : « (legacy meta description) » (Koh Talabeng, plongée SSI), « Not included (legacy price note) » (frais du village), la parenthèse en français de la saison du speedboat.
- Déroulé absent : karting, location, speedboat. Inclus absent : location, speedboat. Séance du programme C des éléphants : une seule heure dans la donnée, rien à choisir.
- Créneaux des demi-journées longtail et kayak des mangroves, horaires du longtail de pêche, horaires et ponton du speedboat de la 4 Islands : pas dans les données.

### Changements de données faits ici (aucun prix ni fait)

- `cooking-class.json` : la phrase « Suits children from 5 to 12 cooking with a parent. » était écrite deux fois dans la note de `partner-chef`.
- `kayak.json`, FAQ : « a bit of everything » (refusé par `check-dist`) devient « The fishing park, with the mangrove and lunch on the same half day, is the one for families. »
- `rental.json` et `speedboat-ferry.json` : `refPrefix` `RN` et `SB` (code des références des messages).

### Contrôles et résultats

- `STT_ALLOW_PLACEHOLDERS=1 npm run build` : OK, `check-dist` OK, `photos-v3` OK (23 usages, 17 temporaires).
- `npm test` : 239 tests, 239 verts (229 d'avant plus 10 dans `tests/product-pages.test.js`). Adaptés sans retirer de fait : `pages-seo` (fiches lues dans `products/**`, la 4 Islands hors contrôle de longueur de titre comme avant), `partenaires` (prix lus dans `products/**`, grille du speedboat au lieu du formulaire d'accueil, galeries d'avant vérifiées comme fichiers et photo déclarée vérifiée sur chaque fiche), `terms` (pied de page de `v4.njk` au lieu de `secret-page.njk`), `schema` (fil d'Ariane vers les sections du hub, speedboat en Service), `design-v4` (plus d'option par défaut dans la liste de sorties, demande du client).
- `node scripts/check-v3.mjs` : 106 contrôles OK sur 17 pages (les 3 d'avant plus les 14 fiches).
- Playwright (Chrome) à 390 px (DPR 2) et 1440 px, 14 fiches plus l'accueil, le hub et la 4 Islands : aucune erreur console, aucun défilement horizontal, axe-core 0 violation (page, et feuille de réservation ouverte à 390 px). Sur chaque fiche : refus sans option depuis le bouton du haut (« Choose an option. ») et deux parcours jusqu'à l'URL `wa.me` (première et dernière option ; deux véhicules ; deux trajets dont un aller-retour Krabi), textes des messages vérifiés. Liste de sorties depuis le hub : envoi refusé, « 4 things are missing: … ». 4 Islands : message inchangé hormis les unités des prix.
- Lighthouse 12 mobile, serveur local en gzip :

| Page | Performance | LCP | CLS | TBT | Poids | Accessibilité, bonnes pratiques, SEO |
|---|---|---|---|---|---|---|
| `/tours/koh-rok-koh-haa/` | 99 | 1,8 s | 0 | 0 ms | 135 Ko | 100, 100, 100 |
| `/tours/elephant-sanctuary/` | 99 | 2,1 s | 0 | 0 ms | 163 Ko | 100, 100, 100 |
| `/tours/kayak/` | 99 | 1,8 s | 0 | 0 ms | 138 Ko | 100, 100, 100 |
| `/tours/rental/` | 100 | 1,7 s | 0 | 0 ms | 104 Ko | 100, 100, 100 |
| `/tours/speedboat/` | 100 | 1,7 s | 0 | 0 ms | 107 Ko | 100, 100, 100 |

- Captures pleine page 1440 (DPR 1) et 390 (DPR 2) des 17 pages : `docs/refonte/design-v4/build/shots/produits/` (non commitées).

### Pas fini ou pas vérifié

- Données des sous-variantes : déduites des faits tant que les JSON ne les déclarent pas (structure ci-dessus) ; les créneaux exacts des brochures (07:30–08:00…) attendent la mise à jour des données.
- Safari et Firefox non testés. Rien n'est poussé.
