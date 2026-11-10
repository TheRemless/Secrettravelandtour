# Revue contenu, fonctionnement, accessibilité et SEO : VIP Taxi Lanta (taxi v1)

Revue faite le 10.11.2026 sur http://localhost:8731 (build du worktree `/Users/admin/Desktop/stt-taxi`, branche `taxi-v1`, commit 9b1c1a4), en lecture seule. Chrome sans interface via Playwright, à 390 et 1440 px, axe-core et lecture du code. Scripts de test dans ce dossier (`t2.mjs` réservation, `t3.mjs` liste des lieux et anciens liens, `t4.mjs` axe, `t6.mjs` tabulation).

Bilan : **2 bloquants, 5 visibles, 9 finitions** (16 défauts).

## Ce qui a été vérifié et qui fonctionne

| Point | Résultat |
|---|---|
| axe-core (wcag2a/aa, 21aa, 22aa, best-practice), hub et 17 trajets à 390 et 1440, feuille ouverte sur le hub et un trajet | 0 violation. Seuls cas « à vérifier » : C12 et des fonds non calculables (texte sur le cadre SVG), contrôlés à la main |
| Contrastes mesurés (voir `t5.mjs`) | le plus bas : 5,77 (`.rr-word` bronze sur ivoire), tout le reste entre 7,29 et 16,8 |
| Ordre de tabulation, hub à 1440 et trajet à 390 | il suit l'ordre visuel. Lien d'évitement en premier, contour de 3 px visible partout (or sur laque, bronze sur ivoire, ivoire sur le vert de Secret) |
| Titres | un seul h1 par page, h2 puis h3 sans saut |
| `.cart-h1` lu par le lecteur d'écran | nom accessible propre : « Krabi Airport to Koh Lanta by private minivan », puis « About 2 to 3 hours by road » |
| `prefers-reduced-motion` | aucune animation, ni au chargement ni à l'ouverture de la feuille (`document.getAnimations()` vide) |
| Boutons du haut, de la barre du bas et « Ask for another route » | les trois ouvrent la feuille. Échap la ferme et le focus revient sur le bouton qui l'a ouverte |
| Anciens liens `/taxi/?from=Krabi%20Airport&to=Ao%20Nang` et `/taxi/#request` | la feuille s'ouvre. From et To sont remplis quand l'URL les donne |
| Liste des lieux populaires sous From et To | flèches avec retour au début, Entrée sur une option, Échap ferme seulement la liste, clic souris OK |
| Brouillon | gardé entre deux ouvertures, sens du trajet compris |
| Message WhatsApp | ni référence ni adresse de page. Aller et retour inversent bien le trajet. Enfants avec âges, sièges, bagages, vol ou ferry et prénom sont tous présents |
| Interdits | aucun prix de trajet, aucun `tel:`, pas de Sala Dan, pas de note ni d'AggregateRating dans le JSON-LD, pas de Marcellus, Figtree ni « Night cabin » dans le rendu. « Our partner » ne survit que dans `taxi.json` `tours.tag`, qui n'est pas affiché |
| Liens internes | 42 URL distinctes sur les 18 pages, aucune morte |
| SEO de base | title et description uniques sur les 18 pages (50 à 60 et 135 à 152 caractères). Canonical et og:url justes. Les 18 URL sont dans le sitemap |

---

## Gravité 1 : bloquant

### C1 Trajets au départ de Koh Lanta ou d'une ville : le lieu de prise en charge n'est jamais demandé
- Pages, largeurs : les 17 trajets, toutes largeurs. Le cas le plus grave concerne les 8 trajets « Koh Lanta to … » et les 4 qui partent d'une ville (Krabi, Phuket, Surat Thani, Hat Yai).
- Ce qui ne va pas : la feuille n'a qu'un champ d'adresse. À l'aller il devient « Drop-off hotel or address », au retour « Pickup hotel or address ». Sur `/taxi/koh-lanta-ao-nang/` à l'aller, on donne l'hôtel d'Ao Nang mais jamais celui de Koh Lanta où le chauffeur doit venir. Message obtenu : `Transfer request: Koh Lanta to Ao Nang / … / Drop-off: Ao Nang Cliff Beach Resort`. Sur Krabi → Khao Sok, rien ne dit si on part de Krabi Town, d'Ao Nang ou de l'aéroport, alors que la page le demande. Le commentaire du code dit pourtant que « le lieu côté Koh Lanta fait le prix ». Chaque demande repartira en question sur WhatsApp.
- Capture : captures/sheet-adresse-unique-koh-lanta-ao-nang-390.png, captures/apercu-sans-hotel-lanta-koh-lanta-ao-nang-390.png
- Cause : `src/_includes/components/booking.njk:254-261` (un seul champ `address`), `src/js/booking.js:251-255` (une seule ligne Pickup ou Drop-off), `src/js/booking.js:478-479` (une seule adresse exigée).
- Correction : dans la variante taxi, remplacer `address` par deux champs, `pickup` (« Pickup: hotel, address, airport or pier ») et `dropoff` (« Drop-off: hotel or address »), tous deux obligatoires. Sur une page trajet, préremplir le côté qui est un lieu précis (champ `code` présent ou nom en `Pier`) avec `r.from` ou `r.to`, et échanger les deux valeurs quand on change de sens. Dans `buildMessage`, écrire les deux lignes `Pickup:` et `Drop-off:`. Risque : il faut monter `DRAFT_VERSION` à 2, sinon un ancien brouillon garde `address` sans le recopier. Il faut aussi mettre à jour `tests/booking.test.js` et `tests/taxi-v1.test.js`. Secret n'est pas touché (branche `taxi` seule).

### C2 Hub : l'hôtel d'arrivée part en « Pickup: »
- Pages, largeurs : `/taxi/`, toutes largeurs.
- Ce qui ne va pas : sur le hub, le champ s'appelle « Hotel or address » sans dire de quel côté il se trouve, et le message l'écrit toujours en `Pickup:`. Test : From « Krabi Airport », To « Koh Lanta », hôtel « Pimalai Resort ». On obtient `Transfer request: Krabi Airport to Koh Lanta … Pickup: Pimalai Resort`. Le chauffeur lit qu'il doit prendre le client au Pimalai alors que le client atterrit à Krabi.
- Capture : captures/apercu-hub-pickup-faux-390.png
- Cause : `src/js/booking.js:253` (`dropOff` vaut `false` dès qu'il n'y a pas de trajet fixé), `src/_includes/components/booking.njk:258` (libellé neutre).
- Correction : avec les deux champs de C1, rien à deviner. From et To disent les lieux, Pickup et Drop-off disent les adresses. Solution minimale si C1 attend : sur le hub, écrire `Hotel or address:` dans le message au lieu de `Pickup:`. Risque nul.

## Gravité 2 : visible

### C3 Les consignes du texte ne correspondent pas à la feuille
- Pages, largeurs : 9 trajets, toutes largeurs. Krabi Airport → Koh Lanta, Surat Thani → Koh Lanta, Koh Lanta → Khao Sok, Krabi → Khao Sok, Koh Lanta → Krabi Town, Koh Lanta → Trang, Phuket Airport → Ao Nang, et les FAQ JSON-LD des mêmes pages.
- Ce qui ne va pas : les textes disent « Enter your hotel as the pickup and Krabi Airport as the destination » (paragraphe et FAQ de Krabi Airport), « Enter it as the pickup or the destination » (Donsak, sur Surat Thani) ou « Enter Cheow Lan Pier / the bus terminal / the station as your destination ». Or une page trajet n'a ni champ From ni champ To : seulement « Direction » et une adresse. Sur Surat Thani → Koh Lanta, la page promet une prise en charge au terminal de bus ou à Donsak Pier, mais le message part forcément en `Surat Thani Airport to Koh Lanta`.
- Capture : captures/route-consignes-pickup-destination-krabi-airport-koh-lanta-390.png, captures/sheet-surat-thani-sans-donsak-390.png
- Cause : `src/_data/products/taxi/krabi-airport-koh-lanta.json:47` et `:86`, `surat-thani-koh-lanta.json:49`, `koh-lanta-khao-sok.json:43`, `koh-lanta-krabi-town.json:43`, `koh-lanta-trang.json:44`, `southern-thailand.json:112` et `:200`.
- Correction : réécrire ces réponses d'après la feuille, sans ajouter de fait. Exemple : « Yes. Choose Koh Lanta to Krabi Airport in the form and add your hotel. » et « Yes. Write Donsak Pier as your pickup. » (cette seconde phrase suppose C1). Passer les textes par `redaction-fr`, puis les faire valider par Jérémy. Risque : le texte change dans le JSON-LD FAQ, ce qui est sans effet sur l'indexation.

### C4 Entrée dans From ou To envoie la feuille avec 5 erreurs
- Pages, largeurs : `/taxi/`, 390 et 1440.
- Ce qui ne va pas : on tape « kra », la liste montre Krabi Airport et Krabi Town, on appuie sur Entrée. Aucune option n'est choisie, la feuille est envoyée et affiche 5 erreurs à la fois (« Tell us where you're going », « Pick a date »…), puis saute au champ To. Au téléphone, la touche « OK » du clavier fait la même chose.
- Capture : captures/combo-entree-soumet-390.png
- Cause : `src/js/vip-taxi.js:147` (Entrée n'est interceptée que si `active >= 0`).
- Correction : `else if (e.key === "Enter" && !pop.hidden) { e.preventDefault(); var l = shown(); if (active >= 0) choose(l[active]); else if (l.length === 1) choose(l[0]); else close(); }`. Risque faible : Entrée n'envoie plus la feuille tant que la liste est ouverte.

### C5 Même information répétée sur une même page
- Pages, largeurs : toutes, toutes largeurs.
- Ce qui ne va pas :
  - Krabi Airport → Khao Lak et Koh Lanta → Khao Lak : le bloc « Private only » est suivi de la seule FAQ, « Is the Khao Lak transfer private? Yes… your group only ». Le doublon est déjà noté dans `koh-lanta-khao-lak.json:112` mais il est toujours là.
  - Surat Thani → Koh Lanta et Koh Lanta → Donsak Pier : le chapeau finit par « Private vehicle, your group only », puis « Private only » le redit.
  - Krabi Airport → Koh Lanta : le 2ᵉ paragraphe et la 2ᵉ FAQ donnent la même consigne. La 3ᵉ FAQ (« How long is the drive… About 2 to 3 hours ») répète la durée déjà affichée dans le cartouche.
  - Phuket Airport → Koh Lanta : « one vehicle / no change of vehicle » revient 3 fois (chapeau, paragraphe, FAQ) et « stops » 2 fois. « The same transfer runs from Koh Lanta… » redit « in either direction ».
  - Hub : « Private only » et la FAQ « Is the transfer private? » disent la même chose. L'étape 2, « Direct confirmation » et la FAQ « How do I book » répètent la confirmation sur WhatsApp. Le texte de « Clean and comfortable vehicles » reprend le h1, et la FAQ « Is it a taxi or a minivan? » le redit. Les listes de lieux reviennent 4 fois (chapeau, liste des trajets, FAQ « Where do you drive », FAQ « Do you offer airport transfers »).
- Capture : captures/route-repetition-prive-krabi-airport-khao-lak-390.png (la barre du bas en haut de la capture est la barre sticky, ce n'est pas un défaut)
- Cause : `src/taxi-route.njk:79-83` (bloc `T.how` commun) combiné aux FAQ de `products/taxi/*.json` (`koh-lanta-khao-lak.json:45`, `southern-thailand.json:226`, `krabi-airport-koh-lanta.json:50` et `:86`, `phuket-airport-koh-lanta.json:54-58` et `:92-93`, lead de `surat-thani-koh-lanta.json:12` et `koh-lanta-donsak-pier.json:12`). Sur le hub : `src/taxi.njk:91-93`, `:117-121`, `:131-133` et `src/_data/taxi.json:129-136`, `:150`, `:166-176`.
- Correction : retirer des données les FAQ et les phrases qui redisent un bloc voisin. Une page qui n'a plus de FAQ propre n'affiche plus la section (`taxi-route.njk:89`, comportement déjà prévu). Sur le hub, retirer « Direct confirmation » et « Clean and comfortable vehicles » de `taxi.why`, ou bien les FAQ privé et réservation. Le tri FAQ fait par chaîne en dur (`taxi.njk:132`) passe dans les données (`"hub": false`). Risque : moins de texte. Voir C6.

### C6 Pages trajet minces et presque identiques
- Pages, largeurs : les 17 trajets.
- Ce qui ne va pas : on a compté la part de texte qu'on ne retrouve sur aucune autre page trajet. Elle va de 8 % (Krabi Airport → Khao Lak, 26 mots propres sur 315) à 39 % (Krabi Airport → Koh Lanta, 163 sur 409). Le reste est commun : bloc « How », encart Secret, pied de page, et un paragraphe copié d'un trajet à l'autre (« Give us your flight time, your hotel in … The team confirms the price… » sur 4 pages). Google risque de ne garder que quelques-unes de ces pages, alors que Jérémy vise la première place sur chaque trajet.
- Capture : —
- Cause : données. `taxiRoutes.json` et `products/taxi/*.json` n'ont qu'un ou deux paragraphes par trajet.
- Correction : rien à inventer. Poser à Mr. Brown les questions déjà listées dans `site.json brands.vip.caseByCase` (point de rencontre à l'aéroport, capacité et bagages, attente en cas de retard, ferry, supplément de nuit) et ajouter une réponse par trajet. En attendant, C5 réduit le texte commun visible. Risque nul côté code.

### C7 Surat Thani et Donsak : deux durées pour le même trajet
- Pages, largeurs : `/taxi/surat-thani-koh-lanta/`, `/taxi/koh-lanta-donsak-pier/` et le hub.
- Ce qui ne va pas : la page Surat Thani → Koh Lanta dit qu'on y prend aussi les clients à Donsak Pier, en « about 4 to 5 hours ». La page Koh Lanta → Donsak Pier donne « about 5 hours ». Les deux trajets sont côte à côte dans la région « Surat Thani and the Gulf ».
- Capture : — (visible dans la liste des trajets du hub, région « Surat Thani and the Gulf »)
- Cause : `src/_data/taxiRoutes.json` (`drive` des deux trajets) et `products/taxi/surat-thani-koh-lanta.json:12`.
- Correction : retirer Donsak Pier du chapeau, du paragraphe et de la FAQ de Surat Thani → Koh Lanta, puisqu'il a sa propre page, et renvoyer vers `/taxi/koh-lanta-donsak-pier/`. Sinon, faire confirmer une seule durée par Mr. Brown. Risque nul.

## Gravité 3 : finition

### C8 Krabi Airport → Khao Lak : seul trajet sans durée
- Pages, largeurs : hub, liste « Krabi province », cartouche et meta de `/taxi/krabi-airport-khao-lak/`.
- Ce qui ne va pas : la ligne reste vide là où les 16 autres donnent une durée. C'est correct de ne rien inventer, mais la ligne a l'air cassée. La page n'a pas non plus de FAQ propre (voir C5).
- Capture : captures/hub-krabi-province-sans-duree-390.png
- Cause : `src/_data/products/taxi/southern-thailand.json:294` (TODO client).
- Correction : obtenir la durée de Mr. Brown. D'ici là, afficher « Ask on WhatsApp » dans `.rr-time` quand `drive` manque (`components/taxi.njk:34`). Risque nul.

### C9 « Child seat or a baby seat » promis, un seul compteur « Child seats »
- Pages, largeurs : hub (FAQ) et 17 trajets (bloc « Children and babies »), feuille.
- Ce qui ne va pas : le texte dit qu'on peut demander un siège enfant ou un siège bébé. La feuille n'a qu'un compteur « Child seats », qui n'apparaît qu'après avoir ajouté un enfant. Le choix de l'âge va jusqu'à 17 ans, sans repère sur l'âge adulte.
- Capture : captures/sheet-krabi-airport-koh-lanta-390.png
- Cause : `src/_includes/components/booking.njk:248` et `:338`, `src/_data/taxiRoutes.json` `common.how[3]`, `src/_data/taxi.json` FAQ « Can I travel with children or babies? ».
- Correction : appeler le compteur « Child or baby seats », ou bien écrire « ask for a child seat » dans les textes. Arrêter les âges à 11, puisque le formulaire de 2026-10 comptait les adultes à partir de 12 ans, ou bien ajouter « Adults 12+ ». Risque nul.

### C10 Champ « Flight number or ferry time » montré sur des trajets sans aéroport ni port
- Pages, largeurs : Koh Lanta → Ao Nang, Krabi Town, Khao Lak, Khao Sok.
- Ce qui ne va pas : le champ et son aide « If we pick you up at an airport or a pier » restent affichés là où aucun des deux bouts n'est un aéroport ou un port (dans le sens aller).
- Capture : captures/sheet-adresse-unique-koh-lanta-ao-nang-390.png
- Cause : `src/_includes/components/booking.njk:236`.
- Correction : passer `cfg.transit` (vrai quand `code` existe ou qu'un bout finit par `Pier`) depuis `view.bookingRoute`, et n'afficher le champ que sur ces trajets et sur le hub. Risque : une gare de bus ou de train n'est pas couverte, l'aide devra le dire.

### C11 Faits non traçables au registre
- Pages, largeurs : hub (intros de région), Phuket Airport → Koh Lanta, Koh Lanta → Khao Lak.
- Ce qui ne va pas : « Phuket town » (aucun trajet ne part de Phuket town), « Donsak Pier for the Gulf islands », « from any side », « with stops when you want them », « Can we stop on the way? Tell the driver. It is your vehicle for the trip. » Aucune de ces phrases ne vient de `taxi.json` ni de `site.json`.
- Capture : —
- Cause : `src/_data/taxiRoutes.json:407`, `:417`, `:427`, `products/taxi/phuket-airport-koh-lanta.json:58` et `:92`, `koh-lanta-khao-lak.json:74`.
- Correction : faire confirmer les arrêts en route par Mr. Brown (via Jérémy). Sinon, les retirer. Réécrire les intros de région avec les seuls lieux des trajets, par exemple « Phuket Airport, hotels in Phuket and Khao Lak ». Risque nul.

### C12 `aria-describedby` vers des éléments absents
- Pages, largeurs : feuille, toutes pages.
- Ce qui ne va pas : `#book-children`, `#book-bags` et `#book-childSeats` pointent vers `book-e-children`, `book-e-bags` et `book-e-childSeats`, qui n'existent pas (axe : `aria-valid-attr-value` « à vérifier »).
- Capture : —
- Cause : `src/_includes/components/booking.njk:12` (la macro `stepper` met toujours `aria-describedby`, mais seul `adults` a son `<p class="err">`, ligne 243).
- Correction : n'ajouter `aria-describedby` que si un paramètre `err=true` est passé, ou bien ajouter les trois `<p class="err" hidden>`. Risque nul.

### C13 JSON-LD : entité VIP éclatée et zone de service ramenée à Koh Lanta
- Pages, largeurs : hub et 17 trajets.
- Ce qui ne va pas : le hub publie un `TaxiService` sans `@id`. Les trajets citent comme fournisseur `https://secrettravelandtour.com/taxi/#vip`, qui n'est défini nulle part, et Google voit donc deux VIP Taxi Lanta. Le hub écrit `serviceType` et le nom du catalogue « Private minivan transfers and taxi rides on Koh Lanta », ce qui rattache aussi les minivans à l'île. C'est contraire à la règle « ne jamais tout ancrer sur Koh Lanta ». Chaque trajet porte enfin un `Offer` sans prix, réduit à `availability: InStock`, qui n'apporte rien.
- Capture : —
- Cause : `src/_data/taxiView.js:22-31` et `:46`, `src/_includes/components/schema.js:98-100` et `:318`.
- Correction : donner au hub `"@id": site.url + "/taxi/#vip"` (même nœud que le `provider` des trajets). Écrire `serviceType: "Private minivan transfers across Southern Thailand, taxi rides on Koh Lanta"` (texte tiré de `site.json brands.vip.offer`). Retirer `offers` de `schema.route()`. Risque : `tests/taxi-seo.test.js` et `tests/schema.test.js` sont à ajuster. Aucun prix ni aucune note n'entre.

### C14 og:image des trajets sans dimensions
- Pages, largeurs : les 17 trajets.
- Ce qui ne va pas : `og:image:width` et `og:image:height` sont présents sur le hub mais pas sur les trajets. Au premier partage WhatsApp ou Facebook, l'aperçu peut sortir sans image.
- Capture : —
- Cause : `src/taxi-route.njk:31-32`.
- Correction : reprendre les lignes 28 à 30 de `src/taxi.njk` (`1200` et `630`). Risque nul.

### C15 Section « Questions » sans le nom du trajet
- Pages, largeurs : les 17 trajets.
- Ce qui ne va pas : le h2 vaut « Questions » partout. Pour Google comme pour un lecteur d'écran qui parcourt les titres, il ne dit pas de quel trajet il s'agit.
- Capture : captures/route-repetition-prive-krabi-airport-khao-lak-390.png
- Cause : `src/taxi-route.njk:92`.
- Correction : `<h2 id="h-faq">{{ r.from }} to {{ r.to }}: questions</h2>`, ou bien garder « Questions » visible et ajouter un complément `sr-only`. Risque : la ligne de titre s'allonge au téléphone, à vérifier à 390.

### C16 Le bouton dit « Request a transfer », la feuille dit « Check availability »
- Pages, largeurs : `/taxi/`.
- Ce qui ne va pas : sur le hub, le bouton annonce une demande de transfert, mais la feuille s'ouvre sur le petit titre « Check availability » au-dessus de « Private transfer ». Sur un trajet, les deux disent « Check availability ».
- Capture : captures/combo-open-390.png
- Cause : `src/_includes/components/booking.njk:37`.
- Correction : passer `cfg.kicker` depuis `taxiPages.js:98-107` (« Request a transfer » sur le hub) et l'afficher à la place du texte fixe. Risque nul.

---

## Les 3 corrections qui amélioreraient le plus la page
1. **C1 et C2 : deux champs, Pickup et Drop-off, dans la feuille taxi.** Aujourd'hui, une demande sur deux arrive sans le lieu où le chauffeur doit aller.
2. **C3 : réécrire les consignes d'après la feuille réelle.** Elles envoient le client chercher des champs qui n'existent pas. C'est à faire en même temps que C1, parce que « Write Donsak Pier as your pickup » n'est vrai qu'avec le champ Pickup.
3. **C5 et C6 : retirer les répétitions et demander à Mr. Brown une vraie réponse par trajet.** La page paraît moins « remplie par une machine » et Google a une raison de garder chacune des 17 pages.
