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

Depuis le 08.11.2026 les sous-variantes sont lues dans les JSON et plus déduites : `FALLBACK` est supprimé de `v4-product.js`. Une option qui ne déclare rien n'a pas de sous-variante.

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
- Rempli le 08.11.2026 : expérience du pilote pour les tours ATV B et C (`choices` texte), créneau des demi-journées longtail et kayak des mangroves. Pas encore fait : suppléments de location de matériel de plongée sur chaque plongée (aujourd'hui une colonne « Rentals and discounts » sans bouton, `kind: "extra"`), passeports pour Langkawi, zone de l'hôtel pour le speedboat, boîte AT ou MT et lieu de remise pour la location.

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

## Mise à jour d'après les brochures (08.11.2026)

Sources : les quatre rapports d'audit (A bateaux, B activités, C transport, D faits du dossier agence, sans aucun prix net), les brochures publiques de `Secret Travel & Tour 3/` relues page par page, puis trois messages du client relayés le même jour. Les brochures publiques font foi pour les prix de vente. Aucun prix net, aucune commission. Les citations de `sources[]` ne nomment jamais un prestataire (`tests/products-schema.test.js`) : une brochure y est désignée par son sujet et le paragraphe de l'audit.

Deux choix de forme :
- **Ponton du speedboat join-in** : la brochure dit « Rattana Pier ». Le nom est celui du prestataire, interdit sur le site (`tests/partenaires.test.js`). Le site écrit « Koh Lanta Noi pier » ou « a pier on Koh Lanta Noi ». Si Jérémy veut le nom exact, il faut d'abord lever la règle.
- **« Discover Basic Diver »** : nom exact du programme SSI. `scripts/check-dist.mjs` bannit « discover » ; l'exception vaut pour ce seul nom.

### Koh Talabeng & Koh Bubu : une fiche qui présente les sorties concernées

La fiche n'affiche plus « Price on WhatsApp ». Elle présente les trois sorties de la brochure kayak qui vont à Koh Talabeng : programme 1 « Sea cave kayaking and island hopping » (09:00 à 15:00, déjeuner sur Koh Bubu, 1 300 / 900 THB), programme 2 « Love kayak » (09:00 à 15:30, 1 500 / 1 000 THB) et programme 3 « Sea cave kayaking and mangrove » (demi-journée, 1 000 / 700 THB). Mêmes identifiants, libellés, prix, frais, créneaux et déroulés que `activities/kayak.json`, qui reste la fiche de référence. Choix retenu plutôt qu'un simple renvoi : le visiteur qui cherche Koh Talabeng trouve les prix et réserve sur place ; celui qui cherche « kayak » voit les sept sorties. Un test (`Koh Talabeng : …` dans `tests/product-pages.test.js`) échoue si les deux fiches divergent.

### Valeurs changées

| Produit | Champ | Avant | Après | Source |
|---|---|---|---|---|
| 4 Islands | Prix enfant join-in longtail | 700 THB | 600 THB | brochure longtail join-in p. 2 |
| 4 Islands | Moins de 4 ans en speedboat join-in | pas de tarif | gratuit (ligne « Child under 4 ») | client |
| 4 Islands | Ponton du speedboat join-in | Lanta Old Town pier ; « a separate pier » dans le déroulé | Koh Lanta Noi pier ; fait « Longtail pier » et nouveau fait « Speedboat pier » | brochure speedboat p. 3 |
| 4 Islands | Déroulé du speedboat join-in | aucun (« not on the site yet ») | 08:00 à 16:00 en 6 étapes (Chueak, Mook, Kradan avec déjeuner, Ngai, retour par voiture ou bateau) ; affiché sur la page 4 Islands | brochure speedboat p. 3 |
| 4 Islands | Déroulé du longtail | Ngai sans fin ; Koh Ma sans durée ; retour 15:30 à 16:00 | Ngai 12:00 à 13:30 ; Koh Ma 45 min ; retour 14:30 à 15:30 | brochure longtail p. 2 (client) |
| 4 Islands | Inclus | « Guide » | guide local, anglophone en speedboat ; petit-déjeuner au ponton (speedboat) ; « Insurance » | brochures longtail p. 3 et speedboat p. 3 |
| 4 Islands | Bring | « Cash for the national park fee » | swimwear, sun cream, a hat, sunglasses, a towel, a camera, plus le cash | brochure longtail p. 2 |
| 4 Islands | Frais de parc | 200 / 100 THB sans âge | 200 THB dès 12 ans, 100 THB de 4 à 11, gratuit sous 4 ; thaï 40 / 20 gardé | client ; montants vérifiés (Hat Chao Mai) |
| 4 Islands | Before you book, météo | rien | fermeture possible d'une île au dernier moment (méduses), itinéraire ou date changés | client (Koh Ngai fermé en juin et octobre 2026) |
| 4 Islands | Private longtail, note | — | les enfants comptent dès 4 ans, pas en dessous | client |
| Koh Rok & Koh Haa | Déroulé | 10:00 et 11:00 sans heure ; « Back on Koh Lanta around 15:30, at your hotel by 16:30 » | 10:00 leçon et 1er spot, 11:00 2e spot, 13:00 plage ; 15:30 départ de Koh Haa puis transfert | brochure speedboat p. 2 |
| Koh Rok & Koh Haa | Moins de 4 ans en speedboat | pas de tarif | gratuit | client |
| Koh Rok & Koh Haa | Inclus, ponton | « Guide » | guide anglophone en speedboat, petit-déjeuner, assurance ; fait « Speedboat pier » | brochure speedboat p. 3 |
| Koh Rok & Koh Haa | Saison | October to April | Mid-October to mid-May, fermeture du parc dès le 16 mai (accroche, promesse, météo, FAQ, réglette des mois) | client (DMCR, Bangkokbiznews) |
| Koh Rok & Koh Haa | Frais de parc | 400 / 200 et thaï 40 / 20 | 400 dès 12 ans, 200 de 4 à 11, gratuit sous 4 ; tarif thaï retiré (sans source) | client |
| Koh Rok & Koh Haa | Privés (longtail, speedboat), note | — | les enfants comptent dès 4 ans | client |
| Koh Phi Phi | Après-midi | 13:30 Bamboo, 14:15 Loh Mudee, 16:00 retour, hôtel vers 16:30 | 12:00 déjeuner à Phi Phi Don puis Bamboo ; 13:30 Loh Mudee ; 14:15 à 16:00 temps libre à Phi Phi Don, puis retour | brochure speedboat p. 2 |
| Koh Phi Phi | Moins de 4 ans, inclus, ponton | — | gratuit ; guide anglophone, petit-déjeuner, assurance ; Koh Lanta Noi | client ; brochure speedboat p. 3 |
| Koh Talabeng & Koh Bubu | Toute la fiche | une option « Price on WhatsApp » | trois sorties, 1 000 à 1 500 THB adulte (voir plus haut), horaires, frais du village, inclus de la brochure | brochure kayak p. 2 et 3 (client) |
| Mangroves | Radeau du lever du soleil | « 3 or more people, per person » 1 500 | « Each extra person » +1 500 (supplément au forfait de 1 ou 2) | affiche Sunrise View |
| Mangroves | Fin du lever du soleil | back at the hotel by 07:30 (déroulé, pickup, FAQ) | back at the pier at 07:30 | affiche Sunrise View |
| Mangroves | Radeau du coucher de soleil | back by 20:00 | check-in 16:50, singes, 17:30 coucher de soleil, 18:15 dîner, ponton 19:30, transfert 20:00 (« by candlelight » gardé) | affiche Sunset Dinner |
| Mangroves | Inclus | 3 lignes | transfert limité à la Koh Lanta area (radeaux de pêche et du soir), guide, matériel de pêche et gilets, déjeuner des demi-journées, assurance | affiches B et C ; brochure kayak |
| Mangroves | Demi-journées longtail et kayak | aucun horaire | créneau matin 09:30 à 12:30 ou après-midi 14:00 à 17:00 (choix) ; kayak ou longtail pour le parc de pêche | brochure kayak p. 3 à 5 |
| Mangroves, kayak, Talabeng | Frais du village de Thung Yee Peng | 40 THB par personne, note « Not included (legacy price note) » | 40 THB adulte, 20 THB enfant de 4 à 11 ; note interne retirée | client |
| Pêche | Déroulé | 13:15 « More fishing, swimming or photos » | 13:15 pêche, photos ou repos ; 13:45 retour par la mangrove ; 14:00 ponton | affiche Private Fishing |
| Pêche | Inclus | 3 lignes | transfert (Koh Lanta area), appâts, guide, gilets, assurance, eau, sodas, fruits | affiche Private Fishing |
| Kayak | Inclus, déroulé | sans assurance ; programme 2 sans Skull Island ; demi-journées sans horaire | « Insurance » ; Skull Island ; « 09:30 to 12:30 or 14:00 to 17:00 » sur les programmes 3 à 7, créneau à choisir | brochure kayak |
| Cuisine | Cours du midi | 09:00 to about 14:00 | 09:00–14:00 | brochure p. 2 (client) |
| Cuisine | Cours du soir | dans les faits seulement | réservable sur single et partner chef, mardi, jeudi, vendredi 16:00 à 21:00, déroulé propre (sans marché) | brochure p. 2 et 3 |
| Cuisine | Partner chef | `ages` 5 à 12 sur l'option | recommandation dans la note et « Before you book », plus de borne | client |
| Cuisine | Sculpture | créneaux déduits des faits | deux créneaux nommés, jours contrôlés (lundi, mercredi, samedi 15:00 à 18:00 ; mardi, jeudi, vendredi 09:00 à 12:00) | brochure p. 2 (client) |
| Cuisine | Inclus | « Welcome drinks and snacks, wifi » | ajout café, thé, eau, stylo ; marché seulement au cours du midi | brochure p. 3 |
| Batik | Cours | une option « Morning or afternoon » sans choix lu | choix du matin (prise 08:00 à 09:00) ou de l'après-midi (12:00 à 13:00) ; âges 3 à 10 confirmés | brochure batik p. 2 (client) |
| Plongée | Noms | Kids Scuba Explorer ; Basic Diver | Scuba Explorer ; Discover Basic Diver (prix, faits, déroulé, FAQ) | brochure plongée p. 1 |
| Plongée | Élèves par moniteur | « two or three » partout, « never more than two » dans l'intro | 2 au plus en Scuba Explorer, 2 ou 3 en Discover Basic Diver | brochure plongée p. 1 |
| Plongée | Agence | « SSI (legacy meta description only) » | SSI | brochure plongée |
| Plongée | Sites des one-day | Koh Haa or Koh Bida | Koh Haa, or Phi Phi and Koh Bida | brochure plongée p. 2 |
| Plongée | Deep adventure dive | phrase dans la note | ligne de prix +1 000 THB, supplément à cocher | brochure plongée p. 2 |
| ATV | Niveau | rien | A pour débutants ; B et C pour pilotes expérimentés (notes, fait « Level », FAQ, champ « Riding experience ») | brochure quad p. 2 et 3 |
| ATV | Annulation | TODO ouvert | 24 h avant, sinon 50 % (gardé, TODO levé) | client |
| Éléphants | Toute la fiche | ancien partenaire : A, B, C, séances 07:30, 10:00, 13:00, 1 800 à 4 000 THB | nouveau partenaire : A 1 800 / 1 400 (09:00, 12:00, 15:00), B plage 2 000 / 1 600, C cascade et grotte 2 200 / 1 800 (09:00, 12:00), D journée 4 500 / 3 000 ; adulte dès 11 ans, enfant 4 à 10, gratuit sous 4 ; inclus, à apporter, terrain, photos en vente | site du nouveau partenaire, page des programmes (client) |
| Location | 32 véhicules | nom et prix | cylindrée, boîte automatique ou manuelle, « new » pour les deux Yaris (champ `spec`, affiché sous le nom) | fiche du loueur |
| Location | Before you book | caution passeport, casques fournis | caution passeport ou montant selon la catégorie ; permis à la charge du loueur, fortement conseillé ; aucune assurance accident ; loueur non responsable en cas de contrôle ; casque obligatoire en Thaïlande | client |
| Speedboat | Saison | « Some departures run all year, others from 15 October to 30 April » | « Departures from Koh Lanta run from 15 October to 30 April » | client |
| Speedboat | Enfants | rien | enfant de 3 à 9 ans, gratuit sous 3 ans (fait et Before you book) | client |
| Speedboat | Langkawi | arrivée 18:00 | ferry de 16:00 depuis Koh Lipe, arrivée 18:30 heure de Malaisie, changement de bateau dit | brochure horaires p. 2, tableau Ferry Service (client) |
| Speedboat | Pontons | Rassada sur un seul départ | Tonsai, Rassada, Koh Mook pier, prise à l'hôtel à Koh Ngai et Ao Nang, devant le parc à Kradan, Bulon Resort ou Pansand Resort, Pattaya Beach à Lipe, Telaga Harbour, Klong Jilad, Railay Sunrise Beach, Manoah, Klong Hear | brochure horaires p. 2 |
| Speedboat | Retours vers Koh Lanta | Phuket (Phi Phi en « via »), Kradan, Ao Nang, Koh Yao | ajout de Phi Phi comme départ, Koh Lipe, Koh Bulon, Langkawi 09:30 heure de Malaisie | brochure horaires p. 2 |
| Site | `replyTime` | null | « within 6 hours, Thailand time » | client |

Code touché pour porter ces données : `view.js` (saison « Mid-October to mid-May », âges du tarif enfant des frais de parc, clés `licence` et `insurance` de « Before you book »), `v4-price.js` et `booking.js` (frais de parc par âge, moins de 4 ans hors du groupe en privé), `v4-product.js` (plus de déduction, pontons des retours, `spec` de la location, titres des deux journées de la cuisine), `v4data.js`, `4-islands.njk` et `v4-four.js` (journée du speedboat et ponton de chaque bateau), `rental.njk`, `speedboat.njk`, `v4.css` (une ligne).

### En attente d'un partenaire

| Point | À demander à |
|---|---|
| Cylindrée et boîte de la Honda ADV 350, de la Honda Forza 350 et du Yamaha X-MAX 300 : la fiche porte « 300 cc MT », « 350 cc MT » et « 300 cc MT » (boîte manuelle sur des scooters automatiques). Rien d'affiché pour ces trois-là | loueur de véhicules |
| Langue du guide du longtail join-in (rien sur la brochure) | prestataire du 4 Islands en longtail |
| Tranches « 7 to 8 » et « 9 to 10 people » du Koh Rok en longtail privé (la brochure écrit « 6-8 » et « 8-10 ») | prestataire du longtail |
| Photos de galerie des éléphants : elles montrent encore l'ancien partenaire (statut replace, non affichées) | nouveau partenaire des éléphants |

### Ce qui reste caché ou sans prix

- Prix des billets de speedboat (la page reste « Price on WhatsApp ») ; bagages autorisés.
- Koh Rok en speedboat privé et version coucher de soleil, Phi Phi en speedboat privé, pêche en longtail, cours privé de batik : « Price on WhatsApp ».
- Nouvelles sorties non ajoutées (décision du client) : Aquaman Catamaran, Rok Haa avec coucher de soleil à 2 500 THB, lignes Bundhaya (départs de 10:00, 12:30, 15:30, Koh Jum, heures de prise en charge par plage).
- Gardés sans source, en attente du client : ordre des îles au choix en privé, dîner « by candlelight » du radeau, nom « Mu Ko Lanta National Park » sur la fiche Koh Rok.
- Kart : âge, lieu de la piste, unité du prix, sens de « minimum 2 programs ». Radeaux : règle des moins de 3 ans. Join-in : nombre maximum de personnes par bateau.

### Contrôles

- `STT_ALLOW_PLACEHOLDERS=1 npm run build` : OK, `check-dist` OK.
- `npm test` : 240 tests, 240 verts. Tests mis à jour vers les valeurs des brochures, intention gardée : prix enfant 600 et moins de 4 ans gratuits en speedboat (`design-v4`), réglette de Koh Rok avec mai et fait « Longtail pier » (`design-retour`), noms de plongée (`partenaires`), écarts voulus avec l'ancien site listés dans `CORRIGES` et `REMPLACES` (`products-schema`), `replyTime` rempli, séance de 12:00 des éléphants et cours « Dinner » (`product-pages`). Ajoutés : Talabeng identique à la fiche kayak, jours de chaque créneau de sculpture, aucun « 14:30 » sur la page cuisine, moins de 4 ans hors du groupe en privé, frais de parc par âge.
- `node scripts/check-v3.mjs` : 106 contrôles OK.
- Vérifié dans `_site` : 600 THB et « Koh Lanta Noi pier » (4 Islands), « Each extra person » (mangroves), 1 000 / 1 300 / 1 500 THB sans « Price on WhatsApp » (Talabeng), 2 200 et 4 500 THB sans 07:30 (éléphants), 18:30 et Telaga Harbour (speedboat), « 1200 cc, automatic, new » (location), « Mid-October to mid-May » sans 16:30 (Koh Rok).
- Playwright (Chrome, 390 px, cuisine aussi à 1 440 px), serveur local sur `_site`, jusqu'à l'URL `wa.me` : kayak programme 7 (« Time: Afternoon, 14:00–17:00 », « By: Longtail ») ; cuisine single chef, cours du soir refusé un samedi puis envoyé un mardi ; sculpture du matin refusée un samedi (« Morning carving runs on Tuesday, Thursday and Friday ») puis envoyée un jeudi ; éléphants A séance de 15:00. 4 Islands : le bouton speedboat affiche les six étapes et le ponton de Koh Lanta Noi. Speedboat : le retour depuis Langkawi ouvre la feuille avec son départ. Aucune erreur console, aucun défilement horizontal.

## Ajouts du 09.11.2026

Demandes du client, site épuré : chaque ajout reste dans une section existante. Aucun prix net, aucun nom de prestataire (ni compagnie, ni nom commercial du catamaran). Tests dans `tests/ajouts-2026-11-09.test.js`.

| Ajout | Où | Source | Ce qui n'est pas inventé |
|---|---|---|---|
| Catamaran au départ d'Ao Nang | option `catamaran-ao-nang` de `koh-rok-koh-haa.json` et `4-islands.json` | brochure publique du catamaran (deux pages) | 3 800 THB adulte, 2 800 THB enfant de 4 à 11 ans, programme 06:00 à 17:00, inclus, « not recommended for children under 4 », annulation remboursée. La brochure ne dit rien du parc : `feesToConfirm`, aucun montant (ni dans les options, ni au calculateur, ni dans l'écran d'envoi), la note renvoie à WhatsApp |
| Koh Rok avec coucher de soleil | option `sunset` de `koh-rok-koh-haa.json`, déroulé propre | affiche « Rok Haa Island + Sunset » | 2 500 THB par personne, 10:00 à 17:50, frais de parc à part. Pas de prix enfant : la note le dit, rien n'est calculé |
| Départs d'une seconde compagnie | `timetable.otherDepartures` de `speedboat-ferry.json` | brochure publique des heures de prise en charge | heures de départ seulement (Lipe 10:30 et 12:30 ; Phi Phi et Phuket 10:00, 13:00, 15:30 ; Ao Nang 09:00 et 13:30). Ni arrivée, ni ponton, ni prix, ni saison |
| Accueil sans « What runs on … » | `home.njk`, `v4-home.js`, `v4.css`, `v4data.js` | client | — |

Forme retenue :
- **Catamaran** : nouveau champ d'option `from` (« Ao Nang »). Le message ajoute `Departure: from Ao Nang, pickup at your hotel in Ao Nang` sous la première ligne. Sur la 4 Islands : quatrième bouton du segment (titre « Choose your boat »), parcours qui part d'Ao Nang, quatrième colonne du comparateur (« The boats side by side », ligne « Good to know »), journée propre et route sur la carte qui entre par le nord (« To Ao Nang », chenal à l'est de Koh Lanta comme sur la brochure). Champs `onBoard` et `lunch` de l'option pour le comparateur. Koh Rok : cinquième colonne, déroulé par option (« What you do, option by option »).
- **Speedboat** : « From Koh Lanta » passe d'une ligne par bateau à une ligne par destination (comme « To Koh Lanta »), toutes les heures sur la même ligne. Une heure commune aux deux grilles (13:00 vers Phi Phi, 10:30 vers Lipe) garde l'arrivée et le ponton de la grille complète. Le ponton n'est dit que pour les bateaux qui le donnent (« Tonsai pier on the 09:00, 13:00 and 14:30 boats »). La saison « from 1 December » ne vaut plus que pour le bateau de 14:30 vers Ao Nang (accroche, fait « Destinations », notes de saison). Les heures de prise en charge par plage de la brochure ne sont pas affichées (page épurée).
- **Accueil** : section, script, styles, `V.addDays` et données `runs()` retirés. Fond alterné rétabli : transferts et « How booking works » sur sable, location sur blanc (carte de location sur sable, chercheur et message sur blanc). `check-v3` (règle 7) n'autorise plus que le rail et la galerie. Le test de l'ancien bloc devient un test d'absence ; le fait des jours du cours de cuisine est gardé.
- Bande du bas des fiches : `role="region"` et `aria-label`, axe la signalait quand elle est visible.
- Location : rien de changé, toujours rien sur la boîte des Honda ADV 350, Forza 350 et Yamaha X-MAX 300.

Contrôles :
- `STT_ALLOW_PLACEHOLDERS=1 npm run build` OK ; `npm test` 245 verts (240 d'avant, le test « What runs on » remplacé, 5 ajoutés) ; `node scripts/check-v3.mjs` 106 contrôles OK. Le test des lignes de prix couvre les nouvelles options (fiche Koh Rok dans `product-pages`, comparateur de la 4 Islands dans `design-v4`).
- Playwright (Chrome), serveur local sur `_site`, 390 px (DPR 2) et 1 440 px : accueil, Koh Rok, 4 Islands (longtail et catamaran), speedboat. Aucune erreur console, aucun défilement horizontal, axe-core 0 violation. Parcours jusqu'à `wa.me` : catamaran depuis Koh Rok et depuis la 4 Islands (`Departure: from Ao Nang…`, prix 3 800 / 2 800), coucher de soleil (`Later trip, back at sunset`, `Per person: 2,500 THB`), départ de 10:00 vers Phi Phi (`Departure: 10:00`, sans arrivée).
- Captures 1 440 et 390 dans `docs/refonte/design-v4/build/shots/ajouts/` (non commitées). À 390 px, l'accueil dépasse 16 384 px : Chrome recopie le haut de page en bas de l'image pleine page, ce n'est pas la page.

Reste ouvert (`TODO(client)`, `docs/refonte/manques.md`) : frais de parc du catamaran et ponton d'Ao Nang ; jours, prix enfant et ponton du coucher de soleil ; arrivées, pontons, saison et retours de la seconde compagnie. Sur la 4 Islands, la place vide laissée par la photo du longtail quand un autre bateau est choisi existait déjà (speedboat), non traitée.

## Refonte des fiches, phase 1 (09.11.2026)

D'après les cinq revues critiques du 09.11.2026 (4 Islands, bateaux, activités, plus les points communs de l'accueil et du hub). Périmètre : les 13 fiches (4 Islands, 5 bateaux, 7 activités) et la feuille de réservation. L'accueil, le hub, la location et le speedboat ne sont pas retouchés ; les règles communes (CSS, feuille, bande du bas, références) les touchent et ont été vérifiées dessus.

### Ce qui a changé

| Sujet | Avant | Après |
|---|---|---|
| Choisir et réserver | sélecteur de bateau, comparateur, cartes d'options, calculateur séparé (4 Islands) ; une carte par option et un bouton par carte (autres fiches) | un seul bloc `#options` par fiche : chaque option avec son prix d'appel, le détail de l'option choisie juste dessous (ponton, déjeuner, toutes ses lignes de prix, note, déroulé court, frais propres), puis le groupe, le total estimé et un seul bouton « Choose a date » |
| Présentation des formules | même moule partout | groupes lus dans les données : join-in, private, « From Ao Nang » (catamaran) ; demi-journée et journée avec l'horaire dans l'intitulé (kayak, Talabeng) ; profils pour la plongée (« No diving experience », « Certified divers », « Learn to dive ») et location de matériel repliée ; créneaux écrits en tête (cuisine, batik) ; grille durée × ligne pour l'ATV et le karting ; ligne de prix choisie sur la page pour un cours ou un site de plongée ; suppléments cochés sur la page (Koh Kradan, plongée en plus, nounou) |
| Phrase qui aide à choisir | dans les questions repliées | sous le titre du bloc (question « Which … should I pick? », « Longtail or speedboat… », « Speedboat, longtail or catamaran? », « Can we have the boat for ourselves? ») et retirée des questions affichées ; le JSON-LD FAQPage la garde |
| Total estimé | 4 Islands seulement, et perdu dans la feuille | sur chaque fiche, dans la feuille (au-dessus du bouton) et dans le message (`Estimated total: … THB`), calculé par `v4-price.js` (`quote`) ; frais du parc ou du village à part, « in cash on the day » ; « We confirm the total on WhatsApp » et `Total: to be confirmed on WhatsApp` quand la règle manque (radeau au-delà de 2 personnes ou avec enfant, âge sans tarif, prix sur demande) |
| Hero | faits choisis selon leur longueur (0 à 4) ; prix et bouton hors du premier écran mobile | toujours Duration puis Pickup (valeur absente des données : case absente), puis le prix d'appel et le bouton côte à côte ; titre sur deux lignes (34 px mobile) ; photo 16:9 en haut sur mobile ; accroche après le bouton |
| Bande du bas | après le bouton du haut seulement ; carte flottante de 400 px au bureau qui dépassait de 17 px | téléphone seulement, dès le chargement ; s'efface devant le bloc de réservation, le pied de page et la feuille ; une fois le groupe touché, l'option, le groupe et le total ; aucune bande au bureau (le bloc de réservation y est collant) |
| Feuille | toute la liste des options en tête ; « Guests » à côté des compteurs ; hôtel obligatoire partout | option choisie résumée en une ligne avec « Change » ; compteurs (pilotes, karts) à la place de « Guests », plus de ligne « Guests » dans le message ; karting : « Hotel, if you want a transfer », facultatif ; catamaran : « Hotel in Ao Nang » et la phrase de la brochure « Not recommended for children under 4. » dès qu'un enfant a moins de 4 ans ; boutons en Manrope, « Add to my trip list » en lien, plus de barre d'erreur à gauche (pages v4) ; titre « Choose a date » comme le bouton |
| Références | `4I-1011-2A` se lisait « 41 » | `FOUR`, `ROK`, `PP`, `TALA`, `MANG`, `FISH`, `ELE`, `KAYAK`, `COOK`, `DIVE`, `ATV`, `BATIK`, `KART` (`KART-1011-3K` : trois karts), `RENT`, `SPEED` |
| Chiffres | chiffres elzéviriens de la Cormorant (« i,ooo », « ₄ Islands ») | montants des listes, du total et de la bande en Manrope 600 ; titres et prix en Cormorant avec `lining-nums tabular-nums` (la police auto-hébergée a `lnum` et `tnum`), règle placée après les raccourcis `font` ; « Price on WhatsApp » en Manrope 16 px, jamais plus gros qu'un prix |
| Redites retirées | îles 7 fois, parc 5 fois, intro du sélecteur égale à la question 1 | comparateur, parcours animé, photo du longtail sous le sélecteur (passée dans la galerie), phrase d'aide de la galerie, lien « the amounts are under Options and prices », titre de l'option en tête de son déroulé, « Sessions at … » sous la ligne « Session: … », heures répétées sous chaque demi-journée, note des frais répétée par ligne, « Also: Koi fish feeding » (déjà dans l'accroche du karting) |
| Déroulé | « What you do, option by option » ou « How the day goes » | les déroulés d'une phrase vont dans le détail de leur option ; reste « How the day goes » pour les journées minutées, et seulement celle de l'option choisie (Koh Rok, éléphants D, cuisine midi et soir gardent leur titre) |
| Carte 4 Islands | speedboat tracé depuis Lanta Old Town ; noms à 8 px sur mobile | départ du speedboat par le nord, étiquette « To Koh Lanta Noi pier » (le ponton n'est pas placé : aucune coordonnée dans les données), point et nom de Lanta Old Town cachés pour lui ; premier tronçon par l'est de Koh Ma ; carte sur bureau seulement, la journée sert de liste d'arrêts sur mobile ; aucune étape allumée sur mobile |
| Ce que couvre le prix | deux colonnes de titres de 40 px | « What the price covers », « Included » puis « Not included » en H3 dans une colonne |
| Autres sorties | trois grandes cartes empilées sur mobile | rail au doigt sur mobile (sans « Add to trip list »), trois colonnes au bureau |
| 4 Islands | gabarit à part | même gabarit que les autres fiches (`vp.hero`, `vp.pick`, `vp.included`…), plus sa galerie, sa journée par bateau et la carte |

Fichiers : `src/_includes/components/v4-product.js` (`pickOf`, `helpOf`, `bookingOf`, faits du haut, déroulés courts), `v4-product.njk` (hero, `pick`, `calc`, déroulé, inclus, bande), `src/js/v4-product.js` (état partagé avec la feuille, total, bande, journée choisie), `src/js/v4-four.js` (journée et carte), `src/js/v4-price.js` (`quote`), `src/js/booking.js` et `booking.njk`, `src/css/v4.css`, `src/pages/4-islands.njk`, `product.njk`, `v4data.js`. Données : les 15 `refPrefix`, et `"error": "Choose kayak or longtail."` sur le choix « By » des mangroves (« Choose the by. » disparaît aussi au kayak, `error` passe enfin jusqu'à la feuille). Aucun prix, aucun fait, aucun nom de partenaire ajouté ou retiré.

### Hauteurs de page, avant et après

Mesurées sur `_site` (Chrome, 390 × 844 DPR 2 tactile, et 1 440 × 900). « Bouton » : bas du bouton du haut dans le premier écran mobile.

| Fiche | 390 avant | 390 après | Gain | Bouton avant | Bouton après | 1 440 avant | 1 440 après |
|---|---|---|---|---|---|---|---|
| `4-islands` | 12 856 | 7 949 | 38 % | 962 (hors écran) | 585 | 7 610 | 6 700 |
| `koh-rok-koh-haa` | 10 466 | 7 676 | 27 % | 1 058 (hors écran) | 594 | 6 922 | 5 685 |
| `koh-phi-phi` | 7 648 | 6 857 | 10 % | 989 (hors écran) | 594 | 5 226 | 5 191 |
| `koh-talabeng-koh-bubu` | 7 808 | 5 518 | 29 % | 1 032 (hors écran) | 585 | 5 080 | 4 478 |
| `mangroves` | 9 818 | 7 289 | 26 % | 946 (hors écran) | 594 | 6 039 | 5 500 |
| `fishing-trip` | 7 020 | 6 079 | 13 % | 868 (hors écran) | 549 | 4 698 | 4 653 |
| `elephant-sanctuary` | 8 753 | 6 866 | 22 % | 990 (hors écran) | 585 | 5 719 | 5 267 |
| `kayak` | 9 243 | 5 546 | 40 % | 921 (hors écran) | 549 | 5 849 | 4 533 |
| `cooking-class` | 7 526 | 6 490 | 14 % | 833 | 585 | 4 928 | 5 107 |
| `scuba-diving` | 11 760 | 7 116 | 39 % | 893 (hors écran) | 495 | 7 164 | 5 609 |
| `atv` | 7 414 | 5 120 | 31 % | 867 (hors écran) | 549 | 4 689 | 4 086 |
| `batik` | 6 765 | 5 241 | 23 % | 842 | 585 | 4 426 | 4 273 |
| `go-kart` | 5 526 | 4 453 | 19 % | 840 | 594 | 3 755 | 3 711 |

La cuisine grandit de 180 px au bureau : les trois créneaux écrits passent en tête du bloc.

### Contrôles

- `STT_ALLOW_PLACEHOLDERS=1 npm run build` : OK, `check-dist` OK. `npm test` : 245 tests, 245 verts. `node scripts/check-v3.mjs` : 106 contrôles OK.
- Tests adaptés, aucun test de prix ou de fait affaibli : le test « chaque ligne de chaque option du JSON est sur la page » passe sans changement (140 lignes) ; « message » vérifie maintenant le choix de chaque option dans le bloc au lieu d'un bouton par option, la référence et l'absence de « Guests » pour une option à compteurs, et la présence du total ou de « confirmed on WhatsApp » ; le comparateur de la 4 Islands devient le bloc « Choose your boat » (chaque ligne de chaque bateau, plus le départ par Koh Lanta Noi) ; références `FOUR`, `ROK`, `RENT`, `SPEED` ; libellé du bouton « Choose a date » (`partenaires`).
- Playwright (Chrome) sur les 13 fiches à 390 (DPR 2, tactile) et 1 440 : premier écran avec prix et bouton visibles, aucune erreur console, aucun défilement horizontal, axe-core 0 violation (page, et feuille ouverte à 390). Parcours complet jusqu'à `wa.me` avec une option à sous-choix sur chaque fiche (longtail privé avec Koh Kradan, catamaran avec un enfant de 2 ans, demi-journée avec créneau, radeau à 3 adultes, programme B, parc de pêche avec créneau et kayak ou longtail, cuisine un lundi, Open Water choisi sur la page, ATV forêt avec un pilote, batik du matin, karting sans hôtel) : le lien `wa.me` porte le message affiché, avec `Estimated total` ou `Total: to be confirmed on WhatsApp`.
- Accueil, hub, location et speedboat après les règles communes : aucune erreur, aucun défilement horizontal, axe 0 à 390 et 1 440. La page taxi garde deux remarques axe (`region` sur sa barre `.vbar`, `scrollable-region-focusable`) qui viennent de `stt.css` et de son gabarit, non touchés.
- Lighthouse 12 mobile, serveur local en gzip : 4 Islands 98 (LCP 2,3 s), Koh Rok 99 (1,8 s), kayak 99 (1,8 s), ATV 99 (2,2 s), éléphants 99 (2,1 s) ; CLS 0 et TBT 0 ms partout, accessibilité 100.
- Captures avant et après (non commitées) : `docs/refonte/design-v4/build/shots/phase1/avant/` et `apres/` (premier écran de chaque fiche à 390 et 1 440, page pleine de 4 Islands, Koh Rok, kayak, ATV et éléphants, aperçu du message de la 4 Islands, du kayak et de l'ATV), avec `mesures.json`.

### Points des revues non traités, et pourquoi

| Point | Raison |
|---|---|
| Doublons de produits (kayak, Talabeng et mangroves ; radeau de pêche vendu deux fois) | décision du client, comme demandé |
| Noms d'options (« Later trip, back at sunset »), préfixe « Private speedboat option: » des notes, règle météo double de Koh Rok, « Pickup » de « Before you book » qui redit les pontons, légende « Bold times are fixed… » | textes des données, à faire valider par le client |
| « Included » filtré sur l'option choisie | les lignes des données ne disent pas à quelle option elles appartiennent ; un tri par mots serait une lecture inventée. Seule la ligne « On a private boat » de la 4 Islands est mise en avant, comme avant |
| Faits du haut absents : durée de l'ATV, de la cuisine, du batik et de la plongée ; prise en charge des mangroves, des éléphants et de la plongée | aucune valeur dans les données (pas de durée calculée, pas de prise en charge déduite) |
| Message : seule la tranche qui s'applique au groupe (bateaux privés) | le message garde toutes les lignes de prix de l'option ; le total estimé dit maintenant le montant retenu |
| Jours de la cuisine dans le message (« Class: Dinner, Tuesday, Thursday, Friday, 16:00–21:00 ») | libellé de la donnée, vérifié tel quel par un test de faits |
| Galerie de la 4 Islands fondue dans un rail de la photo du haut | la galerie passe après le bloc de réservation, sans phrase d'aide ; le rail du hero aurait demandé une seconde visionneuse |
| Liste de sorties (prix, une ligne par sortie, adresse à Ao Nang) | composant partagé avec l'accueil et le hub, prévu pour la phase 2 ; elle garde son fonctionnement |
| Brouillon restauré signalé (« Same group as your last trip »), jours impossibles grisés pour la cuisine, certification de plongée en deux champs | changements de la feuille non demandés dans le brief de la phase 1 |
| Safari et Firefox | non testés sur appareil |

Rien n'est poussé.
