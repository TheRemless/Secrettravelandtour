# Audit SEO : secrettravelandtour.com, et stratégie pour la refonte

*Audit du 2 novembre 2026, établi à partir de :*

- *le HTML des 37 pages (stt/html/) ;*
- *des requêtes HTTP réelles (curl) ;*
- *des mesures Playwright en mobile simulé (390×844, DPR 3), sans bridage puis en « slow 4G » (1,6 Mbit/s, 150 ms de latence, CPU ×4) ;*
- *WebSearch et l'autocomplétion DuckDuckGo.*

*Scripts et données : scratchpad/seo/.*

> **Limites.** Je n'ai ni Search Console ni outil de volumes, donc **aucun volume de recherche n'est chiffré**. WebSearch n'est pas Google : il montre qui est présent dans les résultats, pas le classement Google exact. La fiche Google Maps est protégée par un contrôle anti-robot, donc le nombre d'avis et les horaires sont à confirmer.

## 0. En bref

La base technique est saine : HTTPS, canonicals, titles uniques, CLS à 0, sitemap, JSON-LD partout. Ce qui coûte du trafic :

1. **Deux marques et deux fiches Google sur un seul domaine.** Les fiches de STT et de VIP Taxi Lanta sont à environ 30 m l'une de l'autre, avec le même téléphone. Les pages /taxi/ portent « | VIP Taxi Lanta » sur le domaine STT, et il existe en plus un site WordPress concurrent.
2. **17 pages /taxi/ minces et quasi identiques.** Elles partagent 55 % de texte, sans prix et avec une seule photo ; 7 d'entre elles ne concernent même pas Koh Lanta.
3. **Un maillage pauvre.** Pas de menu, `/tours/` en 404, `/tours/speedboat/` liée une seule fois, et des boutons « Book now » qui renvoient vers l'accueil.
4. **Un schéma incomplet.** Les `Offer` n'ont pas de `price` alors que les prix sont affichés, il n'y a pas d'horaires, et `TouristAttraction` est appliqué à des activités.
5. **Presque aucune présence hors du site.** « Secret Travel Koh Lanta » ne renvoie que « Secret Beach », et le site n'apparaît ni dans les résultats testés ni dans les annuaires locaux.

## 1. Technique

### 1.1 Indexation et HTTP

| Contrôle | Constat | Action |
|---|---|---|
| http→https, www→apex, ajout du slash final | 301 corrects | — |
| `/index.html`, `/tours/4-islands/index.html` | 200 (doublons, compensés par le canonical) | 301 vers la version propre |
| `/tours/` | **404**, alors que c'est le parent de 15 pages | Créer la page catégorie |
| robots.txt | `Allow: /` + sitemap | OK |
| sitemap.xml | 34 URL (pages légales exclues), **aucun `lastmod`** | Générer `lastmod` au build |
| Pages légales FR | 200, hreflang en/fr, `noindex` | OK. C'est le seul hreflang du site. |
| Page 404 | Vrai code 404, `noindex` | OK |

### 1.2 Titles, meta et titres Hn

- **Titles** : uniques, de 46 à 70 caractères. Celui de l'accueil (70) sera tronqué et commence par une marque que personne ne cherche. Le suffixe de marque varie : « | Secret Travel & Tour » (10 pages), « | Secret Travel » (5 pages : elephant, kayak, phi-phi, scuba…) et « | VIP Taxi Lanta » (18 pages).
- **Meta descriptions** : uniques, factuelles (135 à 160 caractères, avec prix, inclusions et saison). C'est le point fort du site. Seules les pages taxi suivent toutes le même gabarit.
- **H1** : un seul par page, mais plusieurs ne contiennent pas la requête visée. L'accueil dit « Your travel agency in Koh Lanta » sans parler de tours ni de transferts ; mangroves dit « Mangroves of Thung Yee Peng » sans « Koh Lanta » ; cooking-class omet aussi « Koh Lanta ». Sur `taxi/surat-thani-koh-lanta/`, le H1 parle de « Surat Thani **Airport** », ce qui ne correspond ni au slug ni au title.
- **H2 tapés en capitales** dans le HTML (« HOW THE DAY GOES », « PRICES »). Il faut écrire en casse normale et mettre les capitales en CSS (`text-transform`).

### 1.3 Maillage interne (liens entrants, calculés sur les 37 fichiers)

| Page | Liens entrants | Problème |
|---|---|---|
| /tours/speedboat/ | **1** | Quasi orpheline, sur une requête transactionnelle forte |
| 6 excursions en bateau / 8 activités | 6 / 8 | Liées seulement entre elles et depuis l'accueil |
| 17 trajets taxi | 17 | Un bloc commun à toutes les pages taxi, **aucun lien depuis STT** |
| legal / privacy / terms | 35–36 | Le footer pèse plus que le contenu |

- Aucun `<nav>` sur les pages STT.
- Le bouton « Book now » d'une excursion mène à `/?tour=4%20Islands#tell-us`, ce qui fait quitter la fiche produit.
- Aucune excursion ne propose de transfert, et aucun trajet ne propose d'excursion.

### 1.4 Données structurées (JSON-LD valide partout, mais incomplet)

| Pages | Types | Défauts |
|---|---|---|
| Accueil | `TravelAgency` | Manquent : `@id`, `openingHoursSpecification`, `priceRange`, et le `WebSite` (qui sert au nom du site dans Google). `sameAs` ne contient que la fiche Maps, et `addressLocality` vaut « Sala Dan, Koh Lanta Yai ». |
| 6 excursions en bateau | `TouristTrip`, `FAQPage`, `BreadcrumbList` | `offers` sans **`price` ni `priceCurrency`** alors que « from 1,000 THB » est affiché. `offers.url` pointe vers l'accueil. Le fil d'Ariane saute la catégorie. |
| atv, batik, elephant, go-kart, kayak, scuba | `TouristAttraction` | **Type erroné** : il désigne un lieu, pas une prestation |
| rental, speedboat | `Service` | Pas de prix. Le tableau des tarifs n'est pas balisé. |
| /taxi/ et 17 trajets | `TaxiService` (+ FAQ et fil d'Ariane sur les trajets) | `sameAs` renvoie vers la **fiche Maps de VIP Taxi** et vers le site WordPress, donc vers une autre entité. Pas de prix. Le fil d'Ariane commence à « VIP Taxi Lanta ». Les FAQ sont identiques d'une page à l'autre. |

À savoir : depuis 2023, Google n'affiche plus de résultats enrichis FAQ pour ce type de site, et `TouristTrip` n'en produit aucun. Ces balises restent utiles pour la compréhension par les moteurs et les assistants IA.

### 1.5 Open Graph et images

- **Une seule image OG** pour les 15 pages STT et une autre pour les 18 pages taxi. Sur WhatsApp, le canal de vente, « Koh Rok » et « Go-kart » s'affichent donc avec la même vignette.
- **Aucun `srcset` côté STT** :
  - `longtail.webp` (119 Ko, 900×1600) est affiché en 390×300 ;
  - `mangrove-kayak.webp` (184 Ko) est affiché en 250×192 ;
  - le logo taxi (640×640, 65 Ko) est affiché en 56 px sur 36 pages.
- **Attributs `width`/`height` faux.** Toutes les images déclarent 900×600, quelles que soient leurs dimensions réelles.
- **Hero de l'accueil sans `fetchpriority`.** Les pages excursion l'ont.
- **Trop peu de photos.** Il y a environ 30 photos uniques pour 34 pages. `koh-phi-phi.webp` revient sur 26 pages, et les 17 trajets n'ont que `van-seats.webp`.
- **À vérifier.** Le hero dit « *Our* longtail boat » (c'est son alt), mais le bateau est peint « HANTHALE PRIVATE TOUR » (home_mob_first.png). C'est un risque de crédibilité et de droits.

### 1.6 Performance mobile mesurée

| Page | LCP non bridé | **LCP slow 4G** | CLS | Poids |
|---|---|---|---|---|
| / | 0,74 s | **4,5 s** ❌ | 0 | **962 Ko** |
| /tours/elephant-sanctuary/ | 0,59 s | **3,3 s** ⚠️ | 0 | 524 Ko |
| /tours/4-islands/ | 0,68 s | **2,7 s** ⚠️ | 0 | 455 Ko |
| /tours/scuba-diving/ | 0,93 s | 2,0 s | 0 | 260 Ko |
| /taxi/ et /taxi/krabi-airport-koh-lanta/ | 0,6–0,8 s | 1,2 s | 0 | 221–331 Ko |

L'élément LCP est la photo hero. Chaque page charge 3 à 4 familles de polices (STT : Concert One, Open Sans, Kaushan, Sniglet ; taxi : Figtree ×3, Marcellus, Concert One, Kaushan). Le TTFB a été mesuré depuis un datacenter et ne reflète pas les conditions en Thaïlande.

### 1.7 Accessibilité

Les bases sont correctes : formulaires libellés, boutons nommés, `lang="en"`, zoom autorisé, pas de défilement horizontal. Il manque un lien d'évitement et un `<nav>` côté STT.

### 1.8 Contenu dupliqué /taxi/

J'ai mesuré la similarité Jaccard sur des 5-grammes du `<main>` :

- **Entre les 17 trajets** : 58 % en médiane (de 48 à 72 %), et 55 % du texte de chaque page est commun à toutes. Chaque page fait 380 à 460 mots. Le seul contenu propre est une durée et une ou deux FAQ, sans prix, distance, itinéraire ni photo du trajet.
- **Chez les concurrents** (12Go, Suntransfers, GeckoRoutes), les pages équivalentes affichent prix, horaires et options.
- **Entre les 15 pages /tours/** : 3 % de similarité, ce qui montre un contenu réel.

Ces pages taxi ont exactement le profil que Google classe comme « contenu produit en série à faible valeur ».

## 2. Architecture et marques

**Constats :**

- **Deux fiches Google** : STT (`cid=9417984697980129551`, 7.58224 / 99.03551) et VIP Taxi Lanta (`maps.app.goo.gl/hnm3donEq7uR56Dr6`, 7.58214 / 99.03523). Elles sont à environ 30 m l'une de l'autre et partagent le **même téléphone**, également affiché sur viptaxilanta.wordpress.com. Pour Google, cela ressemble à un doublon.
- **18 pages de la marque VIP Taxi sur le domaine STT**, avec leur propre title, logo, palette, polices et `provider` dans le schéma.
- **Cannibalisation.** L'accueil STT vend « Transfers by minivan, private & shared » et /taxi/ vend « Private minivan transfers ». Aucune page n'est clairement désignée pour « krabi airport to koh lanta transfer ».
- **Un troisième site**, le WordPress, sans canonical, annonce « Rated 5 Stars on Google ».

**Options :**

| Option | Pour | Contre |
|---|---|---|
| **A. Fusion sous STT (/transfers/)** | Autorité concentrée, vente combinée transfert + excursion, une seule identité NAP, moins de travail | VIP Taxi devient une ligne de service |
| B. Sous-domaine | Aucun avantage | Autorité séparée et marque toujours mélangée. **À rejeter.** |
| C. Domaine séparé | Une entité propre par fiche Google | Deux sites sans autorité, même téléphone et même adresse, deux fois plus de contenu à produire |

**Recommandation : option A.** La société, le bureau et le WhatsApp sont les mêmes, et les transferts sont le premier service de l'accueil STT. Concrètement :

- VIP Taxi Lanta apparaît comme le service de voitures et minivans privés (« driven by Mr. Brown's team ») sur /transfers/, et dans le schéma via `brand`.
- Sa fiche Google passe en **zone desservie, adresse masquée**, avec /transfers/ comme site web. Elle reçoit un numéro distinct, ou bien elle est fusionnée.
- On bascule vers l'option C seulement si Mr. Brown est indépendant et que sa fiche apporte l'essentiel des avis et des demandes.

**Redirections 301** (fichier `_redirects` de Netlify) :

```
/taxi/                         /transfers/                       301
/taxi/:route/                  /transfers/:route/                301   # pour les 10 trajets passant par Koh Lanta
/taxi/krabi-airport-ao-nang/   /transfers/southern-thailand/     301
/taxi/krabi-airport-khao-lak/  /transfers/southern-thailand/     301
/taxi/phuket-airport-ao-nang/  /transfers/southern-thailand/     301
/taxi/phuket-airport-khao-lak/ /transfers/southern-thailand/     301
/taxi/krabi-khao-sok/          /transfers/southern-thailand/     301
/taxi/phuket-khao-sok/         /transfers/southern-thailand/     301
/taxi/surat-thani-khao-sok/    /transfers/southern-thailand/     301
/tours/speedboat/              /transfers/speedboat-ferry/       301
/tours/rental/                 /rental/                          301
/index.html                    /                                 301
```

Placer les 7 règles spécifiques **avant** la règle générique `:route`.

- Les 10 trajets Koh Lanta concernés sont : krabi-airport, phuket-airport, surat-thani, krabi-town, ao-nang, trang, khao-lak, khao-sok, donsak-pier et hat-yai.
- Les 13 autres URL `/tours/` ne changent pas.
- Le site WordPress doit soit être redirigé (option payante « Site Redirect »), soit pointer vers /transfers/.

## 3. Mots-clés

**Signaux** : A = autocomplétion DuckDuckGo (nombre et variété des suggestions), S = résultats WebSearch. La force indiquée est qualitative.

| Requête | Signal | Force | Présents dans les résultats | Cible / opportunité |
|---|---|---|---|---|
| koh lanta 4 islands tour | A (1re suggestion), S saturé | **Fort** | Expedia/Travelocity (plusieurs fiches), Musement, Magpie, Trip.com | /tours/4-islands/ : le top 10 est dur ; viser le pack Maps et la longue traîne (« emerald cave », « longtail vs speedboat ») |
| koh rok koh haa / koh rok snorkeling tour | A, S | Moyen-fort | Headout, Musement, Pelago, Expedia (Tin Adventure) | Fiche + guide de saison (réouverture le 1er octobre, selon Khaosod) |
| koh phi phi day trip from koh lanta | S | Moyen | Musement, Expedia, exotravel | /tours/koh-phi-phi/ |
| koh lanta elephant sanctuary (ethical, best) | A (7 suggestions) | **Fort** | visitthailandtoday, exotravel (Following Giants), World Animal Protection | Nommer le sanctuaire |
| koh lanta cooking class | A (une école citée par son nom) | Moyen | Expedia/Wotif, byfood, cookly | Nommer l'école |
| koh lanta scooter / car rental (+price) | A | Moyen | — | **/rental/** : opportunité, le tableau de 35 véhicules existe déjà |
| koh lanta diving | A | Moyen | Centres de plongée | Priorité basse (revendeur) |
| koh lanta tours / excursions | A | Moyen | OTA, annuaires | /tours/ |
| koh lanta mangrove, kayak, atv | aucun (pour « atv », noyé par l'émission TV) | Faible | — | Pages existantes |
| krabi airport to koh lanta (+transfer, taxi) | A (5 suggestions) | **Fort** | Suntransfers, 12Go, amazinglanta, airporttransferportal | Trajet enrichi **avec prix** |
| koh lanta to krabi airport / to krabi | A | **Fort** | 12Go, visitthailandtoday | Même page dans les deux sens, + krabi-town |
| koh lanta to phuket (+ferry) | A, S | **Fort** | 12Go, GeckoRoutes, phuketferry | phuket-airport-koh-lanta |
| koh lanta to koh lipe / koh mook / koh samui | A | Moyen | phuketferry, 12Go | **Pages speedboat à créer** |
| things to do in koh lanta | A (8 variantes) | **Fort** | journeyera, Agoda, Expedia, voyagetips | Guide, à moyen terme |
| how to get to / around koh lanta ; best time koh rok | A, S | Moyen | amazinglanta, blogs | Guides reliés aux transferts |

**Requêtes de marque.** « Secret Travel » Koh Lanta renvoie vers « Secret Beach », et `site:secrettravelandtour.com` ne donne rien dans WebSearch. L'indexation est à vérifier dans Search Console.

**Français.** « koh lanta » renvoie surtout à **l'émission TV** (suggestions « toulouse », « candidats »). Il faut viser des requêtes longues : « excursion koh lanta » (A), « koh rok ou 4 îles » (fil voyageforum), « que faire à koh lanta ».

**Allemand.** Exemples relevés : « koh lanta ausflüge » (A), « koh lanta anreise transfer » (homeiswhereyourbagis), « phuket nach koh lanta » (GeckoRoutes /de/).

**Concurrents :**

- **OTA** : Expedia, Musement, Headout, Pelago, Trip.com, et GetYourGuide via des sites affiliés.
- **Plateformes de transfert** : 12Go, Suntransfers, GeckoRoutes, gobytaxi.
- **Acteurs locaux** : **amazinglanta.com**, le modèle à suivre (transferts, excursions et un blog qui se classe bien), Tin Adventure, et les agences recensées sur visitthailandtoday.com.

**Opportunités réalistes**, par ordre :

1. Le pack Google Maps.
2. Des trajets depuis Koh Lanta avec prix.
3. Des routes en speedboat.
4. La location avec prix.
5. Du contenu vécu sur place que les OTA ne publient pas : « 4 Islands ou Koh Rok ? », frais du parc, saison.

## 4. Multilingue

**Oui, en phase 2, sur peu de pages.**

- **Ordre des langues** : le FR d'abord (synergie avec Zwald Travel Planner, forte clientèle francophone), puis le DE (demande visible sur GeckoRoutes /de/ et des blogs). Pas de version scandinave : ces visiteurs lisent l'anglais.
- **Structure** : `/fr/` et `/de/`, slugs traduits (`/fr/excursions/4-iles/`), hreflang réciproque avec `x-default` en anglais, sans redirection automatique par IP.
- **Pages prioritaires** : accueil, /tours/, 4 Islands, Koh Rok, Phi Phi, Elephant, Cooking, /transfers/, et les trajets Krabi Airport, Phuket Airport et Ao Nang.
- **WhatsApp** : message pré-rempli dans la langue de la page.
- **Qualité** : relecture par un natif obligatoire, sinon la traduction trahit l'IA.

## 5. SEO local

| Point | Constat | Action |
|---|---|---|
| NAP STT | Cohérent sur le site (292, Moo 2, Sala Dan… +66 95 868 38 46) | Exactement la même forme sur la fiche Google et dans les annuaires |
| NAP taxi | Pas d'adresse, même téléphone, fiche Google distincte | Voir §2 |
| Horaires, e-mail | **Absents** | À fournir, puis `openingHoursSpecification` |
| Avis | Aucun sur le site, nombre sur Google inconnu | Lien d'avis direct envoyé après chaque prestation ; n'afficher que de vrais avis |
| Citations | Rien trouvé sur TripAdvisor, visitthailandtoday ou Bing Places | TripAdvisor, Bing Places, Apple Business Connect, Facebook, visitthailandtoday, hôtels partenaires |
| Page lieu | Le bloc « Find us » n'a ni carte, ni horaires, ni repères | /contact/ avec carte, accès depuis Saladan Pier, photo de façade, horaires |
| Confiance | Le n° de société figure dans les mentions légales, pas de licence TAT visible | Afficher la licence TAT dans le footer si elle existe |

## 6. Plan SEO de la refonte

### 6.1 Arborescence

```
/  ·  /tours/ (hub, nouveau)  ·  /tours/{les 13 slugs actuels}/  ·  /tours/island-tour/ (songthaew, nouveau)
/transfers/  ·  /transfers/{10 trajets Koh Lanta}/  ·  /transfers/southern-thailand/
/transfers/speedboat-ferry/  ·  /transfers/koh-lanta-koh-lipe/ · koh-lanta-koh-phi-phi/ · koh-lanta-koh-mook-koh-ngai/ (si vendus)
/rental/  ·  /guide/{things-to-do-koh-lanta, koh-rok-best-time, 4-islands-or-koh-rok, how-to-get-to-koh-lanta, national-park-fees}/
/faq/  ·  /contact/  ·  /about/  ·  /legal/ /privacy/ /terms/
```

### 6.2 Title, meta et H1 (prix repris du site actuel, à confirmer)

| URL | Title | Meta description | H1 |
|---|---|---|---|
| / | Koh Lanta Tours & Transfers – Secret Travel & Tour | Local travel agency in Sala Dan, Koh Lanta. Island tours, airport transfers, speedboats and activities. Book on WhatsApp, pay on the day. | Tours, transfers and activities on Koh Lanta |
| /tours/ | Koh Lanta Tours: Boat Trips & Activities | Every boat trip and activity we run from Koh Lanta: 4 Islands, Koh Rok, Phi Phi, kayaking, elephants, cooking. Prices and hotel pickup. | Tours and activities from Koh Lanta |
| /tours/4-islands/ | 4 Islands Tour from Koh Lanta – Emerald Cave | Longtail or speedboat to the Emerald Cave, Koh Ngai, Koh Chueak and Koh Ma or Kradan. Lunch and snorkel gear included. From 1,000 THB. | 4 Islands tour from Koh Lanta |
| /tours/koh-rok-koh-haa/ | Koh Rok & Koh Haa Snorkeling Tour from Koh Lanta | Speedboat or private longtail to Koh Rok and Koh Haa, October to April. Beach lunch, snorkel gear, hotel transfer. From 2,000 THB. | Koh Rok and Koh Haa snorkeling tour |
| /tours/koh-phi-phi/ | Koh Phi Phi Day Trip from Koh Lanta by Speedboat | Maya Bay, Pileh Lagoon, Monkey Beach and Bamboo Island in one day from Koh Lanta. Lunch and snorkeling included. From 2,000 THB. | Koh Phi Phi day trip from Koh Lanta |
| /tours/koh-talabeng-koh-bubu/ | Koh Talabeng Kayak & Koh Bubu, Koh Lanta Half Day | meta actuelle | Koh Talabeng kayaking and Koh Bubu |
| /tours/mangroves/ | Koh Lanta Mangrove Tour – Thung Yee Peng | meta actuelle | Mangrove tour at Thung Yee Peng, Koh Lanta |
| /tours/fishing-trip/ | Fishing Trip Koh Lanta – Longtail or Private Raft | meta actuelle | Fishing trips from Koh Lanta |
| /tours/elephant-sanctuary/ | Ethical Elephant Sanctuary Koh Lanta – No Riding | meta actuelle, avec le nom du sanctuaire | Ethical elephant sanctuary on Koh Lanta |
| /tours/cooking-class/ | Thai Cooking Class Koh Lanta – Market & 4 Dishes | meta actuelle | Thai cooking class on Koh Lanta |
| scuba-diving, atv, kayak, batik, go-kart | « {Activité} Koh Lanta – {différenciateur} » | metas actuelles (bonnes) | « {Activité} on Koh Lanta » |
| /tours/island-tour/ | Koh Lanta Island Tour by Songthaew – Old Town | à écrire avec les faits du client | Koh Lanta island tour by songthaew |
| /transfers/ | Koh Lanta Transfers – Airport, Minivan & Speedboat | Private car, minivan and speedboat transfers to and from Koh Lanta: Krabi and Phuket airports, Ao Nang, Trang, Khao Sok, Koh Lipe. Cash on the day. | Transfers to and from Koh Lanta |
| /transfers/krabi-airport-koh-lanta/ | Krabi Airport to Koh Lanta Private Transfer | Private car or minivan between Krabi Airport (KBV) and your Koh Lanta hotel, both ways. About 2–3 h including the car ferry. Cash on the day. | Krabi Airport to Koh Lanta private transfer |
| /transfers/{a}-{b}/ | « {A} to {B} Private Transfer » | durée, ferry, point de rendez-vous, prix | « {A} to {B} transfer » |
| /transfers/speedboat-ferry/ | Koh Lanta Speedboat & Ferry: Times and Tickets | meta actuelle | Speedboats and ferries from Koh Lanta |
| /rental/ | Scooter & Car Rental Koh Lanta – Daily Prices | meta actuelle | Scooter and car rental on Koh Lanta |
| /guide/things-to-do-koh-lanta/ | Things to Do in Koh Lanta, From a Local Agency | — | Things to do in Koh Lanta |

**Contenu minimum d'une page trajet :**

- prix « à partir de » par véhicule ;
- durée et distance ;
- ferry inclus ;
- point de rendez-vous à l'aéroport, avec photo ;
- horaires conseillés ;
- bagages et sièges enfant ;
- 3 FAQ propres au trajet ;
- 3 excursions suggérées.

### 6.3 JSON-LD type

- **Tout le site** :
  - `TravelAgency` `@id …/#agency` : adresse (`addressLocality: "Sala Dan"`), geo, téléphone, `openingHoursSpecification`, `priceRange`, `sameAs` (fiche Maps, Facebook, Instagram, TripAdvisor) et `parentOrganization` vers Zwald Travel Planner ;
  - un `WebSite` nommé « Secret Travel & Tour ».
- **Excursions** : `TouristTrip` (images ×3, `itinerary`, `provider` pointant vers `#agency`) avec des `Offer` complets : `price`, `priceCurrency: "THB"`, `availability`, `url` de la page, `category` (Join-in ou Private).
- **Transferts** : `Service` (`serviceType`, `areaServed`, `provider` = #agency, `brand` = VIP Taxi Lanta) avec un `Offer` portant le prix minimum. **Location** : `Service` avec `OfferCatalog`.
- **Partout** : `BreadcrumbList` sur 3 niveaux ; `FAQPage` seulement si les questions sont propres à la page.
- **À proscrire** : `TouristAttraction` et un `AggregateRating` déclaré par l'entreprise elle-même.

### 6.4 Checklist développeurs

1. **Génération.** Site statique (SSG) piloté par les données : title, meta, H1, OG et schéma viennent d'un fichier unique par produit.
2. **URL et redirections.** Minuscules, slash final, canonical absolu, `_redirects` du §2. **Chaque ancienne URL doit répondre par une 301 directe vers une page en 200, sans chaîne de redirections.**
3. **Sitemap.** `lastmod` réel ; hreflang ajouté au moment des versions FR/DE ; pages légales en `noindex`.
4. **Navigation.** Un `<nav>` (Tours, Transfers, Rental, Guide, Contact) et un fil d'Ariane visible. **Formulaire de réservation sur chaque fiche**, sans renvoi vers l'accueil. Liens croisés excursion ↔ transfert.
5. **Titres.** Un seul H1, des H2 en casse normale, un suffixe de marque unique (supprimé si le title dépasse 60 caractères).
6. **Images.**
   - AVIF/WebP avec `srcset`/`sizes` (400, 800, 1200), `width`/`height` réels ;
   - hero en `fetchpriority="high"`, sans lazy, moins de 80 Ko sur mobile ; `loading="lazy"` pour tout le reste ;
   - logo en SVG, alt vrais, une image OG 1200×630 par page.
7. **Performance.** Deux familles de polices au maximum (`woff2`, `font-display: swap`). Objectifs : moins de 500 Ko au chargement initial, LCP sous 2,5 s en slow 4G, CLS sous 0,05.
8. **Données structurées.** Valider le JSON-LD du §6.3 avec le Rich Results Test et le validateur schema.org.
9. **Accessibilité.** Lien d'évitement, contraste AA, cibles tactiles d'au moins 44 px.
10. **Mesure.** Search Console (propriété de domaine) et Bing Webmaster ; un événement « clic WhatsApp » par produit.
11. **Après la mise en ligne.** Suivre les 404 pendant 8 semaines ; mettre à jour le site web des deux fiches Google et le site WordPress.

## Questions au client

1. **VIP Taxi Lanta.** Mr. Brown est-il indépendant ? Combien d'avis a chaque fiche Google, et qui les gère ? Êtes-vous d'accord pour fusionner sous STT et masquer l'adresse de la fiche taxi ?
2. **Trajets hors Koh Lanta.** Les 7 trajets concernés (Phuket↔Khao Lak, Krabi↔Khao Sok, etc.) sont-ils vendus régulièrement ?
3. **Prix des transferts.** Avez-vous un prix « à partir de » par trajet et par véhicule ? Proposez-vous du **partagé** ? L'accueil dit « shared », les pages taxi disent « private only ».
4. **Speedboats.** Vendez-vous des billets vers Koh Lipe, Phi Phi, Koh Mook/Ngai et Samui ? À quels tarifs ?
5. **Partenaires.** Quels sont les noms du sanctuaire d'éléphants, de l'école de cuisine et du centre de plongée ?
6. **Infos pratiques et confiance.** Horaires, e-mail, réseaux sociaux ? Êtes-vous présents sur TripAdvisor ? Avez-vous une licence TAT ?
7. **Photos.** La photo du longtail « HANTHALE PRIVATE TOUR » est-elle la vôtre ? Avez-vous des photos propres (bureau, équipe, véhicules, bateaux) ?
8. **Accès.** Avez-vous accès à Search Console et à la fiche Google de STT ?
9. **Langues.** L'équipe peut-elle répondre sur WhatsApp en français et en allemand ?
10. **Réservation en ligne.** Est-elle envisagée ? C'est la condition pour apparaître dans le module « Things to do » de Google, via un partenaire de connectivité.
