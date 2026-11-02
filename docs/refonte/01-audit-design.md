# Audit design, UX et images : secrettravelandtour.com

Audit réalisé le 2 novembre 2026. Captures fournies dans `stt/shots/`, mes captures dans `stt/reports/img/`. Mesures faites avec Playwright (1440 px desktop, 390 px mobile en DPR 2). Les 40 images ont été téléchargées et mesurées (`stt/dl/img/`, inventaire dans `stt/dl/inventory.json`).

## 1. Verdict en 10 secondes

Le site est propre techniquement : contrastes de texte conformes, WebP, LCP à 0,72 s sur desktop, formulaire WhatsApp bien codé. En revanche, il ressemble à un **gabarit « affiche tropicale »** : titres sur des coups de pinceau, polaroïds inclinés, légendes manuscrites, post-it jaune. Le même gabarit est appliqué à 15 produits très différents. On ne voit **aucun signe humain** : ni équipe, ni bureau, ni avis, ni licence. Il n'y a **pas de navigation**. Le bouton « Book now » renvoie l'utilisateur hors de la page produit. Enfin, environ la moitié des photos sont des **scans de brochures**, des **photos de banque** ou des **images probablement générées par IA**.

## 2. Problèmes classés par gravité

### P0 : bloquants

| # | Problème | Preuve |
|---|---|---|
| 1 | **Aucun menu.** L'accueil n'a ni `<nav>` ni lien dans le header, seulement le logo. Les pages excursion n'ont qu'un lien, « All boat tours » ou « All activities », qui renvoie vers une ancre de l'accueil. Depuis une excursion, impossible de rejoindre les transferts ou une activité sans redescendre tout l'accueil. | `nav: 0`, `headerLinks: ["SECRET TRAVEL & TOUR"]` ; `shots/home_desk_00.png` |
| 2 | **La réservation fait quitter la page produit.** « Book now » sur /tours/4-islands/ mène à `/?tour=4%20Islands#tell-us`, à 2 272 px de scroll sur l'accueil. L'utilisateur perd le prix et le contexte. Sur mobile, le formulaire de l'accueil commence à 2 284 px, soit 2,7 écrans. | `reports/img/t4_booknow_landing_mob.png` |
| 3 | **Aucun élément fixe sur mobile.** Ni barre de réservation, ni bouton WhatsApp flottant, ni header collant : 0 élément `fixed` ou `sticky` sur l'accueil comme sur les pages excursion. Pour un public 100 % mobile, c'est rédhibitoire. | test `position: fixed\|sticky` |
| 4 | **Deux identités sur le même domaine.** Secret utilise vert #0A4C44, jaune, Concert One et Kaushan. /taxi/ utilise un fond espresso #140D09, de l'or, Marcellus et Figtree. Le CSS nomme ce style « direction "Night cabin" ». Le visiteur croit changer de site. | `shots/taxi_desk_00.png` contre `shots/home_desk_00.png` |
| 5 | **Le formulaire « Boat tour » ne demande pas longtail ou speedboat**, alors que le prix double (4 Islands : 1 000 contre 2 000 THB). Le message envoyé dit seulement « 4 Islands… Private boat ». Le choix par défaut est « Private », l'option la plus chère. | `reports/img/form_desk_boattour.png` |
| 6 | **Zéro preuve de confiance** : pas d'avis Google intégrés, pas de photo du bureau ni de l'équipe, pas de numéro de licence TAT. Le seul élément est le lien « Rated 5 stars on Google », sur /taxi/ uniquement. | toutes pages |
| 7 | **Images non fiables** (détail en section 4) : scans de brochures, photos hors Thaïlande, image vraisemblablement générée par IA, logos floutés. | `reports/img/evidence_brochures.png`, `evidence_stock_ia.png` |

### P1 : majeurs

- **Le catalogue mobile est caché dans 3 carrousels horizontaux** (cartes à 74 % de largeur, `scroll-snap`), sans compteur ni flèches. Les 15 produits ne sont découvrables qu'en faisant défiler latéralement (`shots/home_mobsheet_00.png`).
- **Le prix est l'information la moins visible.** Sur les cartes, il s'affiche en 13,5 px, blanc à 66 % d'opacité. Sur la page produit, il fait 14 px sous le chapeau. Il devrait être le deuxième élément lu.
- **Une colonne morte de 300 px sur desktop.** Chaque section met son titre-pinceau à gauche et laisse le vide en dessous. Le contenu (horaires, prix) tient dans environ 560 px et 40 % de l'écran reste vide (`shots/home_desk_01.png`, `t4islands_desk_01.png`).
- **La page Speedboat n'affiche aucun prix**, et sa photo principale montre une longtail à Phi Phi, pas un speedboat (`reports/img/speedboat_desk_00.png`). Les pages trajet taxi n'affichent pas de prix non plus (`taxiroute_desk_00.png`).
- **Erreurs de gabarit.** La timeline du cours de cuisine a une colonne d'heures vide (`cooking_desk_00.png`). « Questions we get about this trip » apparaît sur les 15 pages, y compris location de scooter et go-kart. L'accueil enchaîne deux titres redondants, « Tell us what you need » puis « What do you need? ».
- **Accessibilité non textuelle.** L'anneau de focus jaune #F2C230 sur blanc ou crème mesure **1,68:1 et 1,58:1**, sous le seuil de 3:1 (WCAG 1.4.11 et 2.4.11). Les bordures des champs #8A9A96 sur blanc mesurent 2,94:1.
- **Cibles tactiles.** 24 éléments font moins de 44 px sur l'accueil mobile : les titres de carte font 25 px de haut, les liens de pied de page 18 à 19 px. Avec trois liens par carte, la navigation clavier compte 45 tabulations pour 15 cartes.

### P2 : mineurs

- Les attributs `width`/`height` ne correspondent pas aux fichiers : 900×600 sont déclarés pour un fichier de 575×224 (rok-lagoon). Les images sont affichées agrandies de 1,5 à 2,6 fois sur écran Retina, donc floues.
- La photo d'accueil est un portrait 900×1600, recadré en bandeau de 300 px sur mobile.
- Site en anglais seulement, sans sélecteur de langue.
- Icône « + » des FAQ minuscule.
- **Points positifs à conserver** : contraste minimal du texte à 5,27:1, page d'accueil légère (961 Ko, 18 requêtes), polices auto-hébergées, brouillon du formulaire gardé 7 jours, dates calculées à l'heure de Bangkok, erreurs claires sous chaque champ (`form_desk_errors.png`).

## 3. Signes « fait par une IA » : liste exhaustive

| Signe | Où / combien | Pourquoi ça fait IA | À faire à la place |
|---|---|---|---|
| Coup de pinceau derrière les titres (`brush.webp`) | 60 occurrences | Effet Canva ou Midjourney par défaut, utilisé sans raison | Titres typographiques nets, éventuellement un surtitre court ou une numérotation |
| Polaroïds inclinés à ±1,5° avec ombre | 136 `.pol` | Scrapbook générique. Le cadre blanc mange environ 15 % de la photo et tout se ressemble | Photos droites, ratio constant, coins de 4 à 6 px, pleine largeur sur mobile |
| Légendes manuscrites (Kaushan Script) | 15 | Faux « fait main ». Elles contredisent souvent l'image : « Market day » sur une cuisine, « Sea cave » sur une mangrove, « Koh Ngai » sur une photo de bateau non localisée | Pas de légende, ou une légende factuelle dans la police de texte |
| Post-it jaune incliné « Bring cash for the park » | 3 pages | Skeuomorphisme décoratif | Encadré d'information plat avec pictogramme |
| Double CTA « Book now → » + « Learn more » | 39 + 100 | Remplissage de gabarit, « Learn more » ne dit rien | Carte entièrement cliquable, une seule action explicite |
| Gabarit identique pour 15 produits | toutes les /tours/ | Une ligne de génération répétée : « How the day goes / Prices / In the price / Good to know / Questions… trip » | 4 gabarits : excursion bateau, activité, location, transfert |
| Accroches génériques | H1 « Your travel agency in Koh Lanta », « See what we do », OG « Explore • Discover • Experience » | Formules interchangeables, triade de verbes | Promesse locale et concrète (bureau à Sala Dan, départs du jour, prix affichés) |
| Blocs « Why us » et « How it works 1-2-3 » | /taxi/ et ses 17 trajets | Structure de landing page standard. Triade « No sharing, no stress, no waiting ». Promesse vague « Friendly drivers who know the region well » | Faits vérifiables : véhicules réels, nom et photo du chauffeur, prix par trajet |
| Logos illustrés | `emblem.webp` (van Mercedes, palmiers, karst, longtail dans un badge), `taxi/logo.webp` (éléphant couronné, van noir, temple doré, filigranes) | Accumulation de motifs et dégradés typiques d'un générateur. Un van dans le logo d'une agence d'excursions | Logotype typographique sobre et un pictogramme simple (voir questions) |
| Faux gras du nom | Sniglet + `-webkit-text-stroke` | Bricolage typographique | Graisse native d'une vraie police |
| Pile de polices | 6 familles : Sniglet, Concert One, Kaushan, Open Sans, Marcellus, Figtree | Une police « fun » par rôle | 2 familles au maximum |
| Flèches « → » partout, ornement « KOH LANTA —— » | tous les liens | Tics décoratifs | Liens soulignés sobres |
| Photos lissées ou saturées, scans | voir section 4 | Le visiteur sent le faux en une seconde | Shooting réel |
| Absence d'humains | tout le site | Aucun visage d'équipe, aucun lieu réel, aucun avis : le site pourrait appartenir à n'importe qui | Bureau, équipe, bateaux maison, avis Google réels |

## 4. Images : inventaire et verdict

**Volume** : 34 photos, 2 logos, `brush.webp` et l'image OG. Tout est en WebP, de 24 à 188 Ko. Les photos font **800 px de large au maximum**, sauf le hero taxi. 16 photos de galerie font moins de 1 000 px, et rok-lagoon ne fait que 575×224. Les alt sont présents et descriptifs ; l'emblème a un alt vide sur l'accueil.

**Doublons** :
- `longtail.webp` : hero de l'accueil, carte 4 Islands et hero 4 Islands.
- `koh-phi-phi.webp` : Phi Phi, Speedboat et les 18 pages taxi.
- `lanta-old-town.webp` : tour en songthaew et location.
- `kayak-karst` : kayak et Talabeng.
- `kayak-mangrove` : kayak et mangroves.

### Garder (provisoirement, si les droits sont confirmés)
- `longtail.webp` : vraie photo, bateau maison selon l'alt. La garder une seule fois et la refaire en paysage.
- `lanta-old-town.webp` : uniquement pour le tour de l'île.
- `fishing.webp`, `atv.webp`, `batik.webp` (en détail), `elephant-sanctuary.webp` (635 px, à remplacer à terme).
- Taxi : `van-exterior`, `van-seats`, `van-welcome`, `hero-ceiling`. Ce sont de vraies photos du véhicule et le plafond est un vrai signe distinctif.

### Remplacer : scans de brochures papier
Trame d'impression, cadres verts, texte résiduel (`reports/img/evidence_brochures.png`) :

`gallery/kart-kid` (trame), `rok-lagoon` (texte « …k Fee » en bas à gauche), `kayak-karst` (cadre vert, grain du papier), `elephant-hug` et `elephant-herbal` (bandes vertes de mise en page), `kayak-mangrove`, `gallery/mangrove-longtail` (filets verts), `elephant-bath` (710×264), `phiphi-bay`, `kayak-cave`, `kayak-cave-2`, `longtail-cave` (dominante magenta), `beach-palm`, `batik-morning`, `batik-afternoon`, `batik-kayak`, `atv-riders`, `mangrove-guide`.

Ces images viennent probablement des prospectus des prestataires partenaires. **Il faut demander les fichiers originaux.**

### Remplacer : photos de banque, hors sujet ou probablement générées par IA
Voir `reports/img/evidence_stock_ia.png`.
- `mangrove-kayak.webp` (hero Kayak, légendé « Sea cave ») : broméliacées épiphytes sur les racines, une flore des Amériques. **Ce n'est pas Koh Lanta.**
- `mangrove-longtail.webp` (hero Mangroves) : eau turquoise translucide dans une mangrove, textures lissées, longtail sans moteur. **Très probablement générée par IA.**
- `koh-rok.webp` : paysage de karsts typique de Krabi ou Phang Nga, peu plausible pour Koh Rok, saturé comme une photo de banque.
- `scuba-diving.webp` : composition de banque classique.
- `koh-talabeng-kayak.webp` : image molle, probablement extraite d'une vidéo.
- `koh-phi-phi.webp` : plausible mais générique.
- `cooking-class.webp` : capture vidéo avec **logos de tabliers floutés**, ce qui suggère une image d'un tiers.
- `go-kart.webp` : vraie photo mais mal cadrée (entrejambe au premier plan).

À vérifier par recherche d'image inversée avant publication.

### Liste de prises de vue à demander au client
Format : paysage 3:2 d'au moins 2 400 px et vertical 4:5 pour le mobile, JPEG de qualité maximale ou RAW, sans filtre, autorisations écrites des personnes photographiées.

1. **Marque** : façade du bureau de Sala Dan, équipe au comptoir (visages, prénoms), panneau des départs.
2. **Bateaux** : longtail et speedboat au quai à l'aube, capitaine, embarquement, équipement, buffet sur la plage.
3. **Excursions** : grotte d'Émeraude et Koh Ngai (4 Islands) ; lagon de Koh Rok ; Pileh et Bamboo (Phi Phi) ; grotte de Talabeng en kayak ; guide en mangrove ; prise de pêche au coucher du soleil.
4. **Activités** : plongée (photos du centre partenaire), quads, bain des éléphants sans monte, cuisine (marché, mortier, plats), batik, go-kart, parc de scooters, songthaew aux points de vue.
5. **Transferts** : minivan devant un hôtel, Mr. Brown avec une pancarte à l'aéroport de Krabi, valises chargées.
6. **OG** : une image 1200×630 par produit, tirée de ces photos.

## 5. Direction artistique proposée

**Positionnement : « le comptoir du quai de Sala Dan ».** Une agence locale sérieuse, précise et chaleureuse, pas une affiche de vacances. Le meilleur atout du site, ce sont ses **faits** : horaires, prix détaillés, inclusions, frais de parc. Le design doit les mettre en scène comme un tableau des départs ou un billet de ferry : chiffres alignés, tableaux nets, grandes photos réelles. Cela se distingue des marketplaces saturées comme des petits sites « tropicaux » génériques.

**Palette**, contrastes vérifiés :

| Rôle | Hex | Contraste |
|---|---|---|
| Encre (texte) | `#14282A` | 13,5:1 sur sable |
| Mer d'Andaman (marque, liens) | `#0D5C63` | 6,8:1 sur sable, 7,7:1 sur blanc |
| Mer profonde (fonds sombres) | `#0A3F44` | blanc 11,6:1 |
| Sable (fond) | `#F5F0E6` | |
| Blanc (cartes, champs) | `#FFFFFF` | |
| Texte secondaire | `#56625F` | 5,6:1 sur sable |
| Bordure de champ | `#6F7B78` | 4,4:1 sur blanc |
| Rouge bouée (CTA principal) | `#B83A16` | texte blanc 5,75:1 |
| Soleil (badges sur fond sombre) | `#F0B429` | 6,2:1 sur #0A3F44 |
| Lagon (teinte d'aplat) | `#BFE6DF` | #0A3F44 dessus 8,6:1 |

Anneau de focus : 3 px `#0D5C63` avec un décalage blanc de 2 px.

**Typographies (Google Fonts, auto-hébergées)** :
- **Archivo** (variable, axe de largeur) pour les titres, en largeur 85 à 90 et graisse 600 à 700. Son côté grotesque de signalétique rappelle les panneaux de quai et les billets. Ses chiffres tabulaires servent les horaires et les prix.
- **Atkinson Hyperlegible Next** pour le texte. Elle a été conçue pour la lisibilité, ce qui compte pour une lecture sur téléphone en plein soleil. Elle couvre le latin étendu nécessaire au FR, DE et SV.
- Repli thaï : Noto Sans Thai, pour les noms de lieux.
- À éviter : Inter, Poppins, Montserrat, DM Sans, Space Grotesk, Fraunces et Playfair, devenues les marqueurs des sites générés.

**Grille et rythme** : mobile sur 4 colonnes, marges de 20 px, gouttières de 16 px. Desktop sur 12 colonnes, 1 200 px au maximum, gouttières de 24 px. Espacements sur une base de 8 px (8 / 16 / 24 / 40 / 64 / 96). Photos pleine largeur sur mobile, texte limité à 68 caractères.

**Composants clés** :
- **Carte d'excursion** : photo 4:3 droite, titre, une ligne de promesse, ligne de faits (« Full day · Longtail or speedboat · Hotel pickup »), puis « from 1,000 THB » en gras et chiffres tabulaires. Badges éventuels « Oct–Apr » ou « Join-in / Private ». Toute la carte est cliquable ; aucun second bouton.
- **Page excursion** : galerie balayable avec compteur « 1/6 ». Titre, puis bandeau de faits clés (durée, prise en charge, bateau, saison, enfants). Bloc prix. Timeline « How the day goes ». Colonnes « Included / Not included », avec les frais de parc dans un encadré plat. À prévoir, FAQ, puis produits liés.
- **Bloc prix** : sélecteur segmenté (Join-in longtail / Join-in speedboat / Private), tableau adulte et enfant, estimation du total selon le nombre de passagers, mention « cash on the island ».
- **Barre de réservation mobile** collante de 64 px, avec la zone sûre en bas : « from 1,000 THB / adult » à gauche, « Check availability » (icône WhatsApp) à droite. Elle ouvre un panneau qui monte depuis le bas, sur la page même.
- **Formulaire** en 3 écrans au maximum, prérempli avec le produit et l'option. Puis **aperçu du message** avant l'ouverture de WhatsApp. Lien secondaire « Just ask a question » pour discuter sans formulaire.
- **Header** collant et compact : logo, Boat tours, Activities, Transfers, langue, bouton WhatsApp.

**Principes photo** : vraies personnes et vrais lieux, lumière naturelle, saturation d'origine, un sujet par image, horizon droit. Jamais de cadre, d'inclinaison ni de filtre. Une photo n'est jamais réutilisée pour un autre produit.

**À éviter absolument** : pinceaux, polaroïds, scripts manuscrits, post-it, dégradés « sunset », icônes en vrac, carrousels automatiques, avis inventés, double CTA, blocs « Why choose us » génériques.

**Architecture de l'information** :
- Menu : *Boat tours · Island activities · Transfers (Shared minivan · Speedboat & ferry times · Private taxi) · Our office · WhatsApp*.
- URLs : `/boat-tours/…`, `/activities/…`, `/transfers/…`, `/about/`, avec 301 depuis `/tours/*` et `/taxi/*` si on renomme.
- **Ordre de l'accueil** :
  1. Hero : vraie photo, H1 local, CTA « See today's boat tours » et WhatsApp, trois raccourcis.
  2. Trois excursions phares.
  3. Transferts : extrait des horaires et trajets populaires avec prix.
  4. Activités en grille, sans carrousel.
  5. Comment réserver : WhatsApp, confirmation, paiement selon les faits fournis par le client.
  6. Le bureau de Sala Dan : photo, équipe, horaires, carte.
  7. Avis Google réels.
  8. FAQ courte.
  9. Pied de page avec la licence TAT.
- **Page excursion type** : galerie, titre et faits clés, prix et barre collante, déroulé de la journée, inclus / non inclus, à prévoir, point de rendez-vous et horaires de prise en charge, FAQ, avis, produits liés.

**Parcours WhatsApp idéal** :
1. Le visiteur ouvre une carte, puis la page produit.
2. Il touche la barre collante.
3. Le panneau s'ouvre, prérempli (produit, option, date, passagers par âge, hôtel, nom).
4. Il voit l'aperçu du message.
5. WhatsApp s'ouvre avec un message structuré qui inclut l'URL du produit et une référence courte, par exemple `4I-0311-2A1C`.
6. L'équipe répond avec un modèle de confirmation : prix total, heure de prise en charge, modalités de paiement.

Le délai de réponse annoncé doit être un fait fourni par le client.

## 6. Benchmark

- **Simba Sea Trips, Phuket** — https://www.simbaseatrips.com/ : tableau comparatif **Join-in contre Private**, section « Your day, step by step », fondateurs visibles, **numéro de licence TAT**, cartes avec taille de groupe, prix « from » et annulation. Le comparatif est directement transposable aux 4 Islands et à Phi Phi.
- **Tao Philippines** — https://www.taophilippines.com/ : photographie documentaire de l'équipage et des îles, ton « nous » sincère, « Book now » permanent dans le header et chat WhatsApp. C'est la référence pour « zéro effet IA ».
- **Bangkok Food Tours** — https://www.bangkokfoodtours.com/ : à reprendre pour le contenu, pas pour le design (il utilise lui aussi une police pinceau). Ligne d'horaires sur chaque carte (« Join-in & Private: Everyday · 6pm »), notes par produit, licence TAT en pied de page, adresse du bureau.
- **GetYourGuide** (pages activité) — https://www.getyourguide.com/ : bandeau de faits clés (durée, prise en charge, annulation), inclus / exclus, point de rendez-vous, bouton de disponibilité collant sur mobile.
- **Airbnb Experiences** — https://www.airbnb.com/experiences : présentation de l'hôte avec photo, mosaïque d'images, barre de prix collante « from X / person ».

## 7. Questions au client

1. Le logo emblème (van, palmiers, longtail) est-il imprimé sur l'enseigne, les flyers ou les véhicules ? Peut-on le refaire ? Même question pour le logo VIP Taxi.
2. VIP Taxi Lanta doit-il garder une identité séparée, voire son propre domaine, ou devenir la rubrique « Private transfers » du même design ?
3. Quelles photos vous appartiennent ? Pouvez-vous obtenir des partenaires (plongée, éléphants, cuisine, quads) les **fichiers originaux** de leurs brochures, et l'autorisation de les utiliser ?
4. Accepteriez-vous une demi-journée de shooting (bureau, équipe, bateaux, une excursion) ?
5. Numéro de licence TAT ? Année d'ouverture du bureau ? Horaires d'ouverture ?
6. Fiche Google : note, nombre d'avis, et accord pour en citer quelques-uns nommément ?
7. Modalités de paiement des excursions (cash, acompte, carte au bureau) et conditions d'annulation ?
8. Délai de réponse réel sur WhatsApp, et horaires où quelqu'un répond ?
9. Les bateaux (longtail, speedboat) sont-ils à vous ou à des partenaires ? Peut-on écrire « our boat » ?
10. Les prix des transferts (minivan partagé, speedboat, taxi privé par trajet) peuvent-ils être affichés, au moins sous forme de « from » ?
11. Langues prioritaires après l'anglais : FR, DE, SV ?
12. Prénoms et photos de l'équipe, et de Mr. Brown, autorisés sur le site ?
