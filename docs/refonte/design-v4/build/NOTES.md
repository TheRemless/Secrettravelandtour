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
