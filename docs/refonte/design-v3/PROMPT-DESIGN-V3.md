# Secret Travel & Tour — design v3 : prompt de conception

## Fichiers joints, à lire dans cet ordre avant d'écrire une ligne de code

1. `docs/refonte/design-v3/references/index.html` — planche de références annotée : ZTP (étalon) avec son ADN chiffré, 5 sites de référence avec « on reprend / on ne reprend pas », contre-exemples, et les deux versions rejetées avec la raison du rejet. **Ouvre-la dans un navigateur et regarde chaque capture.**
2. `docs/refonte/00-BRIEF.md` — architecture, données, formulaire WhatsApp, interdits §7, faits manquants §9 : tout reste valable. **La section §5 « direction artistique » est annulée** et remplacée par ce document (plus d'Archivo, plus de rouge bouée, plus de « tableau des départs »).
3. `docs/refonte/01-audit-design.md` §3 (signes IA) et §4 (état des photos : lesquelles garder, lesquelles jeter).
4. `docs/refonte/03-audit-contenu.md` §6 (règles de texte, mots bannis §6.6) et §7 (textes de 4 Islands, du trajet Krabi Airport et du hero : ce sont les textes à utiliser).
5. `docs/refonte/design-v3/context/ztp_*.png` — captures de zwaldtravelplanner.com desktop et mobile. Site en ligne : https://zwaldtravelplanner.com et /services/. Son CSS est public (`/css/site.css`, `/css/system.css`, `/css/home.css`) : tu as le droit de le lire, pas de le copier.

## 0. Pourquoi on recommence

Deux tentatives ont été rejetées. La v1 (Archivo condensé, panneaux vert foncé, heures jaunes) a été lue comme « un tableau de bord d'administration ». La v2 (serif lourde, rouge brique, blocs de couleur vides à la place des photos) a reçu ce verdict : « les couleurs ne sont pas bien et je n'aime pas comment le site est construit, franchement ce n'est pas beau ». Le client juge le résultat par rapport au site sœur, Zwald Travel Planner, même société : « ça n'a rien à voir avec le niveau du site de ZTP ».

L'objectif v3 tient en une phrase : **un site de la même famille visuelle que ZTP, chaleureux, photo d'abord, où chaque produit a une grande image et un prix lisible, et où rien ne ressemble à un gabarit.** STT n'est pas une copie de ZTP : ZTP est menthe et teal, parle à la première personne, vend du sur-mesure ; STT est sable et vert profond, parle au nom d'un comptoir, vend des départs avec des prix. Même serif, même sans, même calme, autre température.

Ce document est une maquette décrite en mots et en chiffres. Là où une valeur est donnée, elle n'est pas négociable. Là où rien n'est dit, choisis l'option la plus simple et la plus proche de ZTP.

## 1. ADN à reprendre de ZTP (mesuré dans son CSS, voir planche §2)

- Cormorant Garamond 600 pour les titres, Manrope 400/600 pour tout le reste, 4 fichiers woff2 auto-hébergés, `font-variant-numeric: lining-nums` partout.
- Corps 17 px / 1.65. Conteneur 1200 px, gouttière 32 px (20 px sous 560 px). Sections : 96 px de respiration verticale sur desktop, 56 px sur mobile. Grilles à gap 28 px.
- **Un seul rayon : 12 px** (photos, cartes, encarts). Boutons : 14 px. **Aucune ombre** sur les cartes au repos.
- Rien n'est jamais écrit sur une photo. Pas de voile sombre. Pas de surtitre en capitales espacées. Pas de pastilles sur les vignettes, pas de cartes à icône.
- Hero : texte à gauche, photo à droite qui **déborde jusqu'au bord droit de l'écran**, coins gauches arrondis. Sur mobile, le texte d'abord, puis la photo en bandeau pleine largeur.
- Alternance des fonds : blanc → teinté → blanc → sombre → teinté. Jamais deux fonds teintés qui se suivent.
- Listes à filets 1 px (titre serif + une ligne grise) à la place des puces et des icônes.
- Prix en serif 600, unité en sans 15 px à côté.

## 2. Direction STT

### 2.1 Palette (contrastes WCAG calculés)

| Jeton | Hex | Rôle | Contraste |
|---|---|---|---|
| `--ink` | `#14262B` | texte, titres | 15,6:1 sur blanc, 13,7:1 sur sable |
| `--ink-soft` | `#3B5551` | texte d'intro (lead) | |
| `--ink-mute` | `#546A65` | texte secondaire, lignes de faits | 5,8:1 blanc, 5,1:1 sable, 4,5:1 coquille |
| `--deep` | `#0B3B3C` | **fonds sombres, bouton principal, footer** | blanc dessus 12,3:1 |
| `--deep-soft` | `#124B4C` | cartes posées sur `--deep` | blanc dessus 9,8:1 |
| `--sea` | `#0F6B61` | liens, prix « from », état sélectionné, soulignés | 6,4:1 blanc, 5,6:1 sable |
| `--sand` | `#F6EFE4` | **bande teintée** (remplace la menthe de ZTP) | |
| `--shell` | `#EFE2D0` | bande CTA finale, fond d'encart | ink dessus 12,3:1 |
| `--line` | `#E3DACB` | filets, bordures de carte | |
| `--field` | `#7A8884` | bordure des champs de formulaire | 3,7:1 blanc, 3,2:1 sable |
| `--on-dark` | `#EEF3F1` | texte sur `--deep` | |
| `--on-dark-mute` | `#B5CBC6` | texte secondaire sur `--deep` | 7,2:1 |
| blanc | `#FFFFFF` | fond de page, cartes sur sable | |

Focus : 2 px `--sea` à 3 px de décalage ; sur fond sombre, 2 px `--on-dark`. Le vert WhatsApp `#25D366` n'existe que comme point de 8 px dans la pastille flottante, jamais comme fond de bouton. **Aucun rouge, aucun orange, aucun jaune nulle part**, pas même pour une erreur de formulaire (erreur = texte `--ink` 600 + bordure de champ 2 px `--ink`).

Ce qui distingue STT de ZTP dans la palette : la bande teintée est sable et non menthe ; le bouton principal est vert profond `--deep` et non teal ; le teal lumineux `#0A828D` de ZTP n'est pas utilisé.

### 2.2 Typographie (échelle fixe, pas de clamp fantaisiste)

| Rôle | Police | Desktop 1440 | Mobile 390 | Interligne | Espacement |
|---|---|---|---|---|---|
| H1 | Cormorant 600 | 64 px | 42 px | 0.98 | -0.02em |
| H2 | Cormorant 600 | 44 px | 34 px | 1.04 | -0.015em |
| H3 (titre de carte, sous-section) | Cormorant 600 | 26 px | 24 px | 1.15 | 0 |
| Grand prix | Cormorant 600 | 40 px | 32 px | 1 | 0 |
| Prix de carte | Cormorant 600 | 24 px | 22 px | 1 | 0 |
| Lead | Manrope 400 | 19 px | 17 px | 1.6 | 0 |
| Corps | Manrope 400 | 17 px | 17 px | 1.65 | 0 |
| Ligne de faits, légende, unité de prix | Manrope 400 | 15 px | 14 px | 1.5 | 0 |
| Bouton, lien nav, prénom d'avis | Manrope 600 | 15 px | 15 px | 1 | 0.01em |
| Petites capitales (uniquement titres de colonnes du footer) | Manrope 700 | 12 px | 12 px | 1.3 | 0.18em |

Largeur de texte : H1 max 14ch, lead max 46ch, corps max 62ch. Pas d'italique script, pas de mot en italique dans un titre. Titres en casse de phrase, jamais `text-transform: uppercase` en dehors du footer.

### 2.3 Composants

**Header** : 76 px, blanc, bordure basse 1 px `--line` à partir du premier défilement, collant. Logo d'origine (`emblem.webp`, tel quel, **non modifié**) 44 px de haut + « Secret Travel & Tour » Cormorant 600 22 px, « Sala Dan, Koh Lanta » Manrope 13 px `--ink-mute` dessous. Liens Manrope 600 15 px : Boat trips · Activities · Transfers · Rental · About. Lien actif souligné 2 px `--sea` à 8 px sous le texte. À droite, bouton `--deep` 44 px de haut, « WhatsApp » avec icône 18 px. Mobile : logo + bouton WhatsApp 44 px + bouton menu ; menu plein écran blanc, liens Cormorant 600 34 px empilés, adresse et numéro en bas.

**Bouton principal** : fond `--deep`, texte blanc Manrope 600 15 px, padding 16 × 28 px, min-height 48 px (54 px dans les heros et la barre collante), rayon 14 px, flèche « → » 16 px qui glisse de 4 px au survol. Pas de dégradé, pas d'ombre, pas de second bouton plein. L'action secondaire est toujours un **lien texte** Manrope 600 `--sea` souligné 1 px à 5 px de décalage.

**Carte produit** (le composant le plus important du site, voir Sawday's et Flash Pack sur la planche) :
- `<a>` qui enveloppe toute la carte. Pas de bouton, pas de « Learn more », pas de chevron.
- Photo 4:3, rayon 12 px, `object-fit: cover`, zoom 1.04 en 600 ms au survol. **Jamais de texte sur la photo.**
- 16 px sous la photo : titre H3 Cormorant 600 26 px ; 6 px : promesse Manrope 400 16 px `--ink-mute`, une ligne (ex. « Emerald Cave, Koh Ngai and two snorkelling stops ») ; 10 px : ligne de faits 15 px `--ink-mute` séparés par « · » (ex. « Full day · Longtail or speedboat · Hotel pickup ») ; 14 px : ligne de prix = « from » 15 px `--ink-mute` + « 1,000 THB » Cormorant 600 24 px `--ink` + « per adult, join-in longtail » 15 px `--ink-mute`, le tout aligné sur la ligne de base.
- Étiquette de saison uniquement si elle existe : « October to April » en 14 px `--ink-mute` sur la ligne de faits, pas de badge.
- Sur fond blanc : pas de bordure. Sur bande sable : carte blanche, bordure 1 px `--line`, photo collée aux bords intérieurs (padding 0 sur la photo, 20 px sur le texte).
- Grille : 3 colonnes à 1440 px (gap 28), 2 colonnes de 700 à 1023 px, **1 colonne pleine largeur sur mobile**, photos 4:3 pleine largeur. Aucun défilement horizontal, nulle part.

**Liste à filets** : chaque item = titre Cormorant 600 23 px + texte 16 px `--ink-mute`, padding 18 px 0, bordure haute 1 px `--line`, dernière avec bordure basse. Sert pour Included / Not included, Before you book, Vehicles, FAQ (titre = question, `<details>`, texte = réponse ; icône « + » 20 px `--sea` à droite, tourne à 45° à l'ouverture).

**Bloc options et prix** : une ligne par option = `<label>` radio pleine largeur, padding 20 px, bordure 1 px `--line`, rayon 12 px, espacées de 12 px. À gauche : nom de l'option Cormorant 600 22 px + une ligne 15 px `--ink-mute` (« shared with other travellers »). À droite : prix Cormorant 600 24 px + unité 14 px. Sous la ligne de prix : âges exacts en 14 px. Sélectionnée : bordure 2 px `--sea`, fond blanc. Sous le bloc : « Not included: national park fee, 200 THB per adult… » en 15 px `--ink-mute` avec un filet 1 px au-dessus, **pas d'encadré coloré**.

**Déroulé de la journée** : liste verticale (pas horizontale, pas de points colorés) : colonne gauche 88 px « 07:45–08:30 » Manrope 600 15 px `--ink`, colonne droite titre Cormorant 600 22 px + texte 16 px `--ink-mute`, filet 1 px entre chaque étape, trait vertical 1 px `--line` continu à gauche de la colonne droite. Note de fin « Times shift a little with the tide and the sea. » 14 px.

**Barre collante mobile** (pages produit et trajet) : 64 px + zone sûre, blanc, bordure haute 1 px `--line`. Gauche : « from » 13 px `--ink-mute` au-dessus de « 1,000 THB » Cormorant 600 22 px. Droite : bouton `--deep` 48 px « Check availability ». Apparaît après 480 px de défilement, disparaît quand la feuille de réservation est ouverte.

**Pastille WhatsApp flottante** (desktop uniquement, en bas à droite, comme ZTP) : blanc, rayon 999, bordure 1 px `--line`, 48 px de haut : icône WhatsApp 20 px `--sea`, « Secret Travel & Tour » Manrope 600 14 px, « +66 95 868 38 46 » 13 px `--ink-mute`, point vert 8 px. Pas de photo tant qu'il n'y a pas de vraie photo d'équipe.

**Footer** : fond `--deep`, padding 84 px 0 32 px, 4 colonnes 1.6fr 1fr 1fr 1.2fr (1 colonne sur mobile). Col. 1 : logo + nom + « 292 Moo 2, Sala Dan, Koh Lanta Yai, Krabi 81150 » + lien Google Maps + WhatsApp. Col. 2 Boat trips (6 liens), col. 3 Activities (9 liens), col. 4 Transfers, Rental, About, Contact, FAQ. Ligne du bas : « © 2026 Zwald Travel Planner Co., Ltd · Legal · Privacy · Terms » 14 px `--on-dark-mute`. Licence TAT seulement si fournie.

### 2.4 Photos : règles

- Droites, sans cadre, sans inclinaison, sans filtre, sans légende visible. Ratio 3:2 pour les heros, 4:3 pour les cartes et galeries, 4:5 pour les portraits et les photos de colonne, 16:9 pour le bandeau mobile du hero.
- `object-position` choisi image par image (horizon dans le tiers supérieur, sujet jamais coupé).
- Une image = un usage. La même photo n'apparaît jamais deux fois sur le site.
- Hero en `fetchpriority="high"`, le reste `loading="lazy"`, AVIF + WebP, `srcset` 480/800/1200/1600/2000, `width`/`height` réels.
- Pas de section sans photo : si une section ne peut pas avoir d'image réelle ou placeholder, elle est construite en texte et filets (liste à filets, bande sable), **jamais un aplat de couleur avec un titre dedans**.

## 3. Spécification page par page

Textes : ceux de `03-audit-contenu.md` §7 ; les crochets `[À CONFIRMER]` ne s'affichent jamais, la ligne saute (00-BRIEF §9). Les photos citées sont des placeholders (voir §4).

### 3.1 Accueil `/`

**S1 · Hero** (fond blanc, padding haut 96 px après le header, bas 96 px). Desktop : grille 1.05fr / 0.95fr, gap 72 px, alignement centré. Colonne gauche : H1 « Boat trips, activities and transfers on Koh Lanta » (64 px, 4 lignes), 20 px, lead « Book at our desk in Sala Dan or on WhatsApp. Prices are on the site and hotel pickup is included on every boat trip. » (19 px, 46ch), 34 px, bouton « See boat trips → » + lien texte « Ask on WhatsApp » à 24 px à droite, 28 px, ligne de faits 15 px `--ink-mute` : « 4 Islands from 1,000 THB · Koh Rok from 2,000 THB · Private airport transfers ». Colonne droite : photo 3:2 hauteur 720 px, `margin-right` négatif jusqu'au bord de l'écran, rayon 12 px côté gauche uniquement. Photo : **longtail amarrée sur une plage de Koh Ngai ou Koh Kradan, eau claire, karst au loin, lumière du matin, personne au premier plan.** Mobile : H1 42 px, lead 17 px, bouton pleine largeur 54 px, lien texte centré dessous, puis la photo en 16:9 bord à bord (marges -20 px), 24 px sous le lien, puis la ligne de faits en deux lignes.

**S2 · Bande comptoir** (fond `--sand`, padding 40 px, pas de photo). Une ligne desktop, trois lignes mobile, Manrope 16 px : « Our desk: 292 Moo 2, Sala Dan, next to the pier » · « WhatsApp +66 95 868 38 46 » · « Pay on the day, nothing online ». Chaque item séparé par un filet vertical 1 px `--line` (desktop) ou empilé avec filets horizontaux (mobile). Si les horaires d'ouverture arrivent, ils remplacent le troisième item.

**S3 · Boat trips** (blanc, 96 px). H2 « Boat trips » à gauche, lien texte « All six boat trips → » aligné à droite sur la même ligne de base. 40 px. Grille 3 colonnes de cartes produit : 4 Islands (from 1,000 THB per adult, join-in longtail), Koh Rok & Koh Haa (from 2,000 THB, speedboat, October to April), Koh Phi Phi (from 2,000 THB, speedboat). Photos : 4 Islands = **intérieur du lagon de la grotte d'Émeraude (Tham Morakot), Koh Mook** ; Koh Rok = **plage blanche et eau turquoise de Koh Rok Nai vue de la plage** ; Phi Phi = **lagon de Pileh entre les falaises, longtails au mouillage**. Mobile : 1 colonne, cartes empilées, 32 px entre chaque.

**S4 · Transfers** (fond `--shell`, padding 0, voir composition « Girls Trips » de ZTP). Desktop : photo 4:3 à gauche occupant 50 % de la largeur, collée au bord gauche de l'écran, hauteur 560 px ; panneau blanc rayon 12 px qui **chevauche la photo de 48 px** vers la gauche, padding 56 px, largeur 560 px, centré verticalement. Dans le panneau : H2 « Transfers to and from Koh Lanta » (44 px), 16 px, texte 17 px « Private car or minivan from Krabi and Phuket airports, Ao Nang, Trang and Khao Sok, and speedboat tickets to Phi Phi and Koh Lipe. You pay the driver on the day. », 24 px, liste à filets de 3 trajets : titre « Krabi Airport → Koh Lanta » + « about 2–3 hours, including the car ferry » ; « Phuket Airport → Koh Lanta » + « about 4–5 hours » ; « Koh Lanta → Ao Nang » + « about 3 hours ». Chaque item est un lien. 28 px, bouton « All transfers → ». Photo : **la vraie photo `van-exterior` (minivan Toyota Commuter) à garder** ; si sa résolution est insuffisante pour 1 100 px, placeholder : minivan blanc Toyota Commuter garé devant un hôtel ou sur le ferry de Koh Lanta. Mobile : photo 4:3 pleine largeur, puis panneau blanc avec marges 20 px, remontant de 24 px sur la photo.

**S5 · Island activities** (blanc, 96 px). H2 « Island activities » + lien « All nine activities → ». Grille 3 colonnes × 2 rangées = 6 cartes : Elephant sanctuary, Kayak at Koh Talabeng, Thai cooking class, Scuba diving, ATV, Batik painting (prix « from » issus des données). Les 3 autres (go-kart, mangroves, fishing) sont sur le hub. Mobile : 1 colonne, 6 cartes.

**S6 · How booking works** (fond `--sand`, 96 px). H2 « How booking works » (44 px), 40 px, 3 étapes en colonnes (1 colonne sur mobile) : numéro dans un cercle 36 px bordure 1 px `--sea` texte `--sea` 15 px, titre Cormorant 600 23 px, texte 16 px `--ink-mute`. 1 « Pick a trip, a date and your pickup » / « On the page you choose the option and the number of people. » · 2 « Send it on WhatsApp » / « The message is written for you. We reply with the total and the pickup time. » · 3 « Pay on the day » / « Cash at the desk or on the day. The park fee goes to the ranger. ». Si le délai de réponse est fourni, il remplace « We reply with the total ». Pas de photo dans cette section, pas d'icône, pas de pointillé.

**S7 · Our desk in Sala Dan** (blanc, 96 px). Desktop grille 0.9fr / 1.1fr : gauche H2 « Our desk in Sala Dan » + texte « 292 Moo 2, Sala Dan, Koh Lanta Yai. Two minutes on foot from Saladan Pier. » + liste à filets « Address » / « WhatsApp » / « Operated by Zwald Travel Planner Co., Ltd » + lien « Open in Google Maps → » ; droite : photo 4:5 hauteur 560 px. Photo : **rue principale de Sala Dan vue vers le ponton, bateaux au fond** (lieu réel, jamais présentée comme « notre bureau »). Le jour où la vraie photo de la devanture arrive, elle prend cette place.

**S8 · Reviews** : **n'existe pas tant que les avis Google ne sont pas fournis.** Quand ils arrivent : fond `--deep`, 96 px, H2 blanc « What travellers say », pastille blanche « 4.x on Google, N reviews », grille 2 colonnes de cartes `--deep-soft` (citation Cormorant 500 24 px blanc, prénom Manrope 600 15 px, contexte 14 px `--on-dark-mute`), bouton contour blanc « Read the reviews on Google → ».

**S9 · Bande finale** (fond `--shell`, 2 colonnes 50/50, min-height 520 px, voir « cta-band » ZTP). Gauche : photo pleine hauteur sans rayon : **speedboat ou longtail en mer, vue depuis le bateau, passagers de dos, îles devant** ; droite : panneau padding 96 px 72 px, H2 « Not sure which trip? » 48 px, texte « Tell us your dates, who's coming and where you're staying. We'll tell you what runs that day and what it costs. », bouton « Ask on WhatsApp → ». Mobile : photo 4:3 puis texte, padding 48 px 20 px.

**S10 · Footer** (voir §2.3).

### 3.2 Page excursion `/tours/4-islands/`

**S1 · Hero** (blanc). Même grille que l'accueil (1.05fr / 0.95fr). Gauche : fil d'Ariane 14 px `--ink-mute` « Home / Boat trips / 4 Islands », 24 px, H1 « 4 Islands tour from Koh Lanta » (64 px, 2 lignes), 20 px, lead §7.2 (19 px), 28 px, **ligne de faits** 15 px `--ink-mute` sur une ou deux lignes séparées par « · » : « Full day · Pickup 07:45–08:30 · Longtail or speedboat · Join-in or private » (pas de cases, pas de grille de 4 cellules), 28 px, ligne prix + bouton sur la même ligne de base comme sur ZTP /services/ : « from » 15 px + « 1,000 THB » Cormorant 600 40 px + « per adult, join-in longtail » 15 px, puis à 32 px à droite le bouton « Check availability → » 54 px, puis le lien « Ask on WhatsApp ». Droite : photo 3:2 hauteur 680 px débordant à droite : **passage sombre de la grotte d'Émeraude vu depuis le lagon intérieur, nageurs minuscules, paroi et végétation** (pas la longtail du site actuel, déjà utilisée ailleurs). Mobile : fil d'Ariane, H1 42 px, lead, faits en 2 lignes, prix 32 px, bouton pleine largeur, puis photo 16:9 bord à bord.

**S2 · Galerie** (blanc, 64 px sous le hero). Desktop : grille 3 colonnes gap 12 px, 1 grande photo 4:3 (2 colonnes × 2 rangées) + 4 photos 4:3 ; rayon 12 px chacune ; au clic, visionneuse plein écran avec compteur « 2 / 5 » en Manrope 14 px et flèches textuelles « Previous / Next ». Mobile : galerie balayable horizontale **autorisée ici uniquement** (c'est une galerie, pas une liste de produits), photos 4:3 à 88 % de largeur, compteur « 1 / 5 » sous la galerie. Photos : récif de Koh Chueak sous l'eau avec poissons ; plage de Koh Ngai avec longtails ; vue aérienne de Koh Kradan ; buffet thaï posé sur une table de plage ; ponton de Lanta Old Town au matin.

**S3 · Longtail or speedboat?** (fond `--sand`, 96 px). Encart blanc rayon 12 px (comme « Appel conseil » de ZTP) : texte 58 % + photo 42 % collée au bord droit de l'encart, hauteur 480 px. Texte : H2 « Longtail or speedboat? » + les 3 paragraphes de §7.2 + un comparatif à filets en 2 colonnes (modèle Simba) : **Boat** longtail / speedboat ; **Stops** Koh Ma / Koh Kradan ; **Lunch** Koh Ngai / Koh Kradan ; **Pier** Lanta Old Town / (ligne masquée tant que non confirmé) ; **Price** from 1,000 / from 2,000 THB. Photo : **longtail en bois vue de trois quarts, moteur visible, eau claire** (différente du hero de l'accueil). Mobile : photo 4:3 en haut de l'encart, texte dessous, comparatif en 2 colonnes conservé (14 px).

**S4 · Prices** (blanc, 96 px). H2 « Prices », 32 px, bloc options et prix (§2.3) avec les 3 options de §7.2, puis la ligne « Not included… ». Toucher une option ouvre la feuille de réservation avec l'option préremplie (00-BRIEF §10).

**S5 · The day** (blanc, 64 px après S4, séparé par un filet 1 px pleine largeur du conteneur). H2 « The day, join-in longtail », déroulé vertical (§2.3) avec les 7 étapes de §7.2. Pas de photo.

**S6 · Included / Not included** (fond `--sand`, 96 px). 2 colonnes (1 sur mobile), chacune H3 Cormorant 600 26 px « Included » / « Not included » + liste à filets, un item par ligne, texte 17 px `--ink`. Aucune icône de coche.

**S7 · Before you book** (blanc, 96 px). Grille 1fr / 1fr : à gauche H2 « Before you book » + texte d'une phrase ; à droite liste à filets avec les rubriques de §7.2 dont le contenu est confirmé (Pickup, Bring, Children, The Emerald Cave, Weather and cancellation…). Les rubriques non confirmées n'apparaissent pas. Sous la liste, photo 3:2 : **masque et tuba posés sur le bord d'un bateau, eau en fond** (placeholder) — seulement si la liste compte au moins 4 rubriques, sinon pas de photo.

**S8 · Questions** (blanc, 64 px). H2 « Questions », liste à filets en `<details>`, les 4 questions de §7.2. Largeur max 760 px.

**S9 · Who runs this trip** (fond `--deep`, 72 px). Texte blanc : H2 « Who runs this trip » 44 px + « Booked through our desk at 292 Moo 2, Sala Dan. » + le nom du partenaire s'il est fourni. **Pas de photo placeholder de personnes.** Si le client fournit la photo de l'équipe, elle vient à droite en 4:5 avec la composition « Hosted by islanders » de Tao (planche §5).

**S10 · More boat trips** (blanc, 96 px). H2 « More boat trips », grille de 3 cartes produit : Koh Rok & Koh Haa, Koh Phi Phi, Koh Talabeng & Koh Bubu. Puis une ligne 16 px : « Arriving from Krabi Airport? → Private transfer to Koh Lanta ».

**S11 · Barre collante mobile** (§2.3) et pastille desktop.

### 3.3 Page trajet `/transfers/krabi-airport-koh-lanta/`

**S1 · Hero** (blanc, même grille). Gauche : fil d'Ariane « Home / Transfers / Krabi Airport to Koh Lanta », H1 « Krabi Airport to Koh Lanta » (64 px), lead §7.3, ligne de faits « About 2–3 hours · Your group only · Cash to the driver · Both directions », prix « from … THB per vehicle » seulement s'il est fourni (sinon la ligne de prix est remplacée par « Price on WhatsApp, usually the same day » en 17 px, à condition que ce délai soit confirmé ; sinon rien), bouton « Check availability → » + lien « Ask on WhatsApp ». Droite : photo 3:2 hauteur 640 px : **hall des arrivées de l'aéroport de Krabi (KBV), panneau « Arrivals », voyageurs avec valises** (Wikimedia Commons). Mobile : idem accueil.

**S2 · How it works** (fond `--sand`, 96 px). H2 « How it works » + 3 étapes numérotées (§3.1 S6 pour le style) avec les textes de §7.3. L'étape 3 n'apparaît que si le point de rencontre est confirmé ; sinon 2 étapes.

**S3 · Vehicles** (blanc, 96 px). Grille 2 colonnes, 2 cartes blanches bordure 1 px `--line` rayon 12 px : photo 4:3 en haut, puis padding 24 px : H3 « Car » / « Minivan », liste à filets « Passengers », « Bags », « Child seats » (lignes masquées tant que non confirmées). Photos : **la vraie `van-seats` (intérieur) pour le minivan** ; pour la voiture, placeholder : berline Toyota blanche en Thaïlande, plaque non lisible. Si aucune capacité n'est confirmée, la section est réduite à une ligne de texte sous le hero et les photos ne sont pas affichées.

**S4 · The road** (fond `--shell`, composition photo + panneau comme S4 de l'accueil, photo à droite cette fois). Panneau : H2 « The road to Koh Lanta », texte : « From the airport the road runs south through Krabi province to Hua Hin pier, then the car ferry to Koh Lanta Noi and the Siri Lanta bridge to Koh Lanta Yai. » + les lignes de « Good to know » §7.3 qui sont confirmées (retard de vol, ferry, départ conseillé). Photo 4:3 : **ferry véhicule de Koh Lanta, minivans à bord, mer en fond**.

**S5 · Questions** (blanc). Les 3 questions de §7.3 en `<details>`.

**S6 · Your drivers** (fond `--deep`, 72 px). H2 « Your drivers », texte « Run by Mr. Brown and the VIP Taxi Lanta team, based on Koh Lanta. » Pas de photo placeholder de personne.

**S7 · Other transfers and a first day out** (blanc, 96 px). Liste à filets de 3 trajets (Phuket Airport → Koh Lanta, Koh Lanta → Ao Nang, Koh Lanta → Krabi Town) à gauche, et à droite 1 carte produit « 4 Islands » avec la mention au-dessus : « Most people take this one on their second day. »

**S8 · Barre collante mobile** : « Private transfer » à gauche (pas de prix si non confirmé) + « Check availability ».

### 3.4 Hub `/tours/`

**S1 · En-tête de page** (blanc, padding 72 px 0 48 px, pas de photo plein écran). Fil d'Ariane « Home / Tours », H1 « Boat trips and activities from Koh Lanta » 56 px, lead « Fifteen things we book from our desk in Sala Dan. Prices are per adult unless the line says otherwise. Hotel pickup is included on every boat trip. » Sous le lead, 2 liens d'ancre Manrope 600 `--sea` : « Boat trips (6) » · « Island activities (9) ».

**S2 · Boat trips** (blanc). H2 « Boat trips », grille 3 colonnes × 2 rangées de cartes produit : 4 Islands, Koh Rok & Koh Haa, Koh Phi Phi, Koh Talabeng & Koh Bubu, Mangroves at Thung Yee Peng, Fishing trip. Chaque carte avec sa photo propre (§4). La carte Fishing affiche « 3,900 THB per raft, 1–2 people » (unité explicite).

**S3 · Bande sable** (fond `--sand`, 48 px) : une phrase 19 px centrée max 60ch : « Every boat trip includes hotel pickup, lunch and snorkelling gear. The national park fee is paid in cash on the island. » Pas de bouton.

**S4 · Island activities** (blanc). H2 « Island activities », grille 3 × 3 : Scuba diving, ATV, Kayak, Elephant sanctuary, Thai cooking class, Batik painting, Go-kart, Island tour by songthaew (seulement si programme + prix fournis), et la 9e selon les données.

**S5 · Bande finale** identique à l'accueil S9 mais avec la photo **vue aérienne d'une longtail sur eau turquoise** et le texte « Can't decide? Send us your dates and we'll say what runs that day. »

Mobile : tout en 1 colonne ; les ancres du S1 deviennent deux boutons contour pleine largeur.

## 4. Plan des photos placeholders

Principe : **chaque produit et chaque section a une vraie image dès maintenant**, libre de droits, prise dans la région (Koh Lanta, Trang, Krabi, mer d'Andaman). Pas d'image générée, pas de scan, pas d'image hors Thaïlande. Les vraies photos du shooting les remplaceront une par une.

Sources autorisées : Unsplash (licence Unsplash), Pexels (licence Pexels), Wikimedia Commons (**uniquement CC0, CC BY ou CC BY-SA, avec attribution dans `credits.json`**). Interdits : Flickr non-CC, Google Images, Shutterstock, Getty, TripAdvisor, Instagram, images « free » de sites inconnus, IA.

| Usage | Sujet exact | Mots-clés de recherche | Ratio, recadrage |
|---|---|---|---|
| Hero accueil | longtail amarrée, plage blanche, karst au loin, matin | `longtail boat Koh Ngai`, `Koh Kradan beach longtail`, `Trang islands longtail` | 3:2, sujet à droite |
| Carte + hero 4 Islands | lagon intérieur de la grotte d'Émeraude ; passage sombre vu du lagon | `Emerald Cave Koh Mook`, `Tham Morakot lagoon`, `Morakot cave` | 4:3 carte, 3:2 hero (2 images différentes) |
| Galerie 4 Islands (5) | récif de Koh Chueak ; plage de Koh Ngai ; Koh Kradan aérien ; buffet de plage ; ponton Old Town | `Koh Chueak snorkelling`, `Koh Ngai beach`, `Koh Kradan aerial`, `Thai beach lunch buffet`, `Lanta Old Town pier` | 4:3 |
| Koh Rok & Koh Haa | plage de Koh Rok Nai, eau turquoise, lagon de Koh Haa | `Koh Rok island`, `Ko Rok Nai beach`, `Koh Haa lagoon` | 4:3 |
| Koh Phi Phi | lagon de Pileh, longtails au mouillage | `Pileh Lagoon`, `Phi Phi Leh lagoon longtail` | 4:3 |
| Koh Talabeng & Koh Bubu | kayak jaune au pied d'une falaise, grotte marine | `Koh Talabeng kayak`, `sea kayak cave Krabi` | 4:3 |
| Mangroves | chenal de mangrove, racines, longtail ou passerelle de Thung Yee Peng | `Thung Yee Peng mangrove`, `Koh Lanta mangrove boardwalk` | 4:3 |
| Fishing trip | canne à pêche à l'arrière d'un bateau, mer d'Andaman, fin d'après-midi | `fishing longtail Thailand sunset`, `Andaman sea fishing boat` | 4:3 (pas de ciel rouge saturé) |
| Scuba diving | plongeur au-dessus d'un récif, eau bleue | `scuba diving Koh Haa`, `Hin Daeng diving`, `Koh Lanta diving` | 4:3 |
| ATV | quad sur une piste de latérite dans la forêt | `ATV jungle trail Thailand` | 4:3 |
| Kayak | kayak de mer en mangrove ou près du karst, vue depuis l'eau | `sea kayaking Krabi mangrove` | 4:3 (différent de Talabeng) |
| Elephant sanctuary | éléphant qui se baigne dans une rivière, personne sur son dos | `elephant sanctuary bathing Thailand`, `elephant river Krabi` | 4:3 |
| Cooking class | mortier et pilon, pâte de curry, mains ; ou étal de marché | `Thai cooking class mortar`, `Thai market herbs` | 4:3 |
| Batik | mains qui peignent à la cire sur tissu tendu | `batik painting Thailand`, `batik wax canting` | 4:3 |
| Go-kart | kart sur piste extérieure, casque | `outdoor go kart track` | 4:3 |
| Island tour | Lanta Old Town sur pilotis | la vraie `lanta-old-town.webp` (à garder, usage unique) | 4:3 |
| Transfers (accueil S4) | minivan Toyota Commuter blanc | vraie `van-exterior` sinon `Toyota Commuter van Thailand` | 4:3 |
| Hero Krabi Airport | hall des arrivées de KBV | Wikimedia `Krabi International Airport arrivals` | 3:2 |
| The road | ferry véhicule de Koh Lanta avec minivans | `Koh Lanta car ferry`, `Hua Hin pier Lanta ferry` | 4:3 |
| Vehicles : car | berline blanche, plaque illisible | `Toyota sedan Thailand road` | 4:3 |
| Our desk (S7) | rue de Sala Dan vers le ponton | `Saladan pier Koh Lanta`, `Sala Dan village` | 4:5 |
| Bande finale accueil | vue depuis un bateau, passagers de dos, îles devant | `speedboat passengers Andaman islands` | pleine hauteur, 3:2 min |
| Bande finale hub | longtail vue d'en haut sur eau turquoise | `longtail boat aerial turquoise Thailand` | 3:2 |
| Rental | scooter garé devant une plage de Koh Lanta | `scooter Koh Lanta road`, `motorbike rental Thailand beach` | 4:3 |

Règles de marquage et de blocage :
- Chaque image placeholder est déclarée dans les données du produit ou de la section avec `placeholder: true`, `source`, `author`, `licence`, `url`, `downloaded_at`.
- `src/data/placeholders.json` est généré au build et liste toutes les images encore marquées, par page. `docs/refonte/photos-a-fournir.md` est régénéré à partir de cette liste avec, pour chaque entrée, la prise de vue réelle attendue (01-audit-design §4).
- **Le build de production (`NODE_ENV=production`) échoue** tant que `placeholders.json` n'est pas vide. Les deploy previews passent avec `STT_ALLOW_PLACEHOLDERS=1`.
- Aucun placeholder ne représente une personne présentée comme membre de l'équipe, un chauffeur, un bateau « à nous » ou le bureau. Les alt des placeholders décrivent le lieu, jamais « our boat », « our team ».
- Résolution minimale 1 600 px de large ; recadrage à la main pour chaque ratio (pas de `object-position: center` par défaut).

## 5. Interdits (rappel, en plus de 00-BRIEF §7)

Pinceaux, polaroïds, scripts manuscrits, émojis, icônes en vrac ou cartes à icône, dégradés sunset ou tout dégradé, légendes ou titres posés sur les photos, voiles sombres, faits inventés, modification du logo, double CTA « Book now / Learn more » (et le mot « Learn more » tout court), carrousels mobiles de produits, **blocs de couleur vides avec un titre dedans**, tableaux de bord et panneaux d'affichage, polices condensées, titres en gras sans serif, titres en capitales, rouge brique et tout rouge/orange/jaune, badges colorés, ombres portées sur les cartes, bords arrondis autres que 12 px, surtitres en capitales espacées, triades de promesses (« Why choose us »), avis inventés, `AggregateRating` auto-déclaré, polices Inter / Poppins / Montserrat / DM Sans / Space Grotesk / Playfair / Fraunces / Archivo / Source Serif.

## 6. Critères d'acceptation

Vérifiables sur la preview, desktop 1440 et mobile 390 :

1. Chaque produit du hub et de l'accueil a une photo 4:3 réelle ou placeholder déclaré. **0 aplat de couleur à la place d'une image.** `grep` de la classe d'aplat ou d'un `background` coloré sans `<img>` dans une carte = échec.
2. Mesures : H1 64/42 px, H2 44/34 px, corps 17 px, sections 96/56 px, conteneur 1200 px, rayon 12 px partout (`grep -c "border-radius"` ne doit retourner que 12px, 14px pour les boutons et 999px pour les pastilles).
3. Palette : les seules couleurs du CSS sont celles de §2.1 + blanc + `#25D366` (point de 8 px). Un script liste tous les hex du CSS compilé ; tout hex hors liste = échec.
4. Polices : 4 fichiers woff2 (Cormorant 600, Cormorant 500 italique facultatif, Manrope 400, Manrope 600). Pas de requête vers fonts.googleapis.com.
5. Rien n'est posé sur une photo : aucun élément positionné en absolu au-dessus d'un `<img>` à part le compteur de galerie en visionneuse.
6. Une image = un usage : le script de build échoue si le même fichier est référencé deux fois.
7. Mobile : aucun `overflow-x: auto` en dehors de la galerie produit ; barre collante 64 px présente sur les pages produit et trajet ; cibles tactiles ≥ 44 px ; hero tient dans un écran de 844 px avant la photo.
8. Contrastes : texte ≥ 4,5:1, bordures de champ et focus ≥ 3:1 (vérifiés avec axe ou pa11y sur les 4 pages).
9. Performance mobile slow 4G : LCP < 2,5 s, CLS < 0,05, poids initial < 500 Ko par page (Lighthouse en mode mobile, 3 passes).
10. Texte : 0 mot de la liste 03-audit-contenu §6.6, 0 `[À CONFIRMER]`, 0 `TODO(client)` dans `dist/`, 0 point d'exclamation.
11. Formulaire : parcours 00-BRIEF §1 et §10 respecté sur 4 Islands et Krabi Airport (option préremplie, aperçu du message, message structuré avec URL).
12. **Test de substitution** : prends une capture de l'accueil, remplace mentalement les photos par d'autres photos de voyage et le nom par « Island Tours Co. ». Si le résultat pourrait être n'importe quel site d'excursions, c'est raté. Ce qui doit rester reconnaissable sans les photos : la bande comptoir sable sous le hero, le panneau blanc qui chevauche la photo des transferts, la ligne « prix serif + bouton » des heros produit, la liste à filets du déroulé de la journée, le footer vert profond. Un second test, inverse : pose la capture STT à côté de la capture ZTP équivalente. On doit voir la même famille (serif, air, photos droites) **et** une différence nette (sable contre menthe, vert profond contre teal, prix sur chaque carte). Si on confond les deux sites, c'est raté aussi.

## 7. Procédure et livrables

1. **Lecture** (planche, brief, audits, captures ZTP, CSS ZTP en ligne). Écris en 15 lignes ce que tu as compris de la différence entre ZTP et STT. Point d'arrêt ✋ : attends la validation de ce résumé avant de coder.
2. **Tokens et composants** : `tokens.css` (palette §2.1, échelle §2.2), header, bouton, carte produit, liste à filets, bloc options, déroulé, barre collante, footer. Page de composants `/_components/` sur la preview, desktop + mobile.
3. **Photos placeholders** : téléchargement, recadrage, `credits.json`, `placeholders.json`, blocage du build de production. Aucune page n'est construite tant que toutes les images de §4 ne sont pas en place.
4. **Les 4 pages** en HTML réel sur la preview Netlify : `/`, `/tours/4-islands/`, `/transfers/krabi-airport-koh-lanta/`, `/tours/`. Textes de 03-audit-contenu §7, données existantes, formulaire fonctionnel.
5. **Contrôle** : exécute les 12 critères de §6, corrige, recommence.
6. Point d'arrêt ✋ : livraison et attente de la validation du client. **Ne pas commencer les autres pages avant.**

Format du retour attendu :
- URL de la preview + URL de `/_components/`.
- Pour chaque page : capture pleine page desktop 1440 et mobile 390 (PNG, DPR 2 pour le mobile), **avec à côté la capture ZTP équivalente** (accueil ↔ ztp_accueil, 4 Islands ↔ ztp_services, hub ↔ ztp_accueil section formules), montées dans une seule page HTML `docs/refonte/design-v3/livraison/index.html`.
- Un tableau Fait / Partiel / Non fait pour chaque section de §3 (S1 à S11) et chaque critère de §6, avec, pour chaque « Partiel » ou « Non fait », la raison en une ligne et ce qu'il manque (donnée client, photo, décision).
- La liste des placeholders restants (contenu de `placeholders.json`) et la liste des lignes masquées faute de donnée confirmée.
- Rien d'autre : pas de récit, pas d'auto-évaluation qualitative. Le client juge sur les captures.
