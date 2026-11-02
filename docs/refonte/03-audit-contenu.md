# Audit contenu, textes et conversion : secrettravelandtour.com

Périmètre : les 37 pages (`stt/html/*.html`, texte extrait dans `stt/work/text/*.txt`), les scripts du formulaire (`/js/secret-form.js`, `/js/secret.js`, `/js/taxi-form.js`), un test Playwright mobile 390 px de chaque onglet (`stt/work/formtest.py`, résultats dans `stt/work/formtest.json`, captures `stt/work/shot_*.png`) et 6 pages concurrentes. Date : 2 novembre 2026.

---

## 0. Verdict

1. Le texte ne trahit pas ChatGPT par ses adjectifs. Il le trahit par le **gabarit** : 16 pages produit avec les mêmes 8 sections et les mêmes formules, et 17 pages taxi qui ne diffèrent que d'une phrase. Personne ne parle : aucun nom, aucun visage, aucun avis.
2. L'anglais est correct mais plat, avec des calques du français (« a visit of Lanta Old Town », « 1h30 », « time to do nothing ») et un mélange d'orthographe US et UK.
3. Il manque ce qui fait réserver. Annulation et météo : 1 page sur 16. Paiement des excursions : 0. Zones de prise en charge, langue du guide, taille du groupe : absentes partout.
4. Le site se contredit sur les âges (9 tranches différentes), sur le partagé et le privé, sur ce qui est inclus et sur les horaires.
5. Le formulaire produit un message **inutilisable pour 10 produits sur 16** : pas d'option, pas d'âges. Par défaut, il demande un **bateau privé**.
6. La confiance est à zéro côté Secret Travel & Tour : ni avis, ni licence TAT, ni équipe. Le concurrent local kohlanta.tours, à Sala Dan, affiche tout cela et vend le 4 Islands à 995 THB.

---

## 1. Qualité des textes par type de page

**Accueil.**
- H1 « Your travel agency *in* Koh Lanta » : en anglais, on dit **on** Koh Lanta, comme le site lui-même le fait 83 fois ailleurs.
- Les fiches de l'accueil contredisent les pages produit :
  - 4 Islands : « plus Koh Kradan or Koh Ngai: your choice ». En réalité, Koh Ngai est toujours au programme, et Koh Ma ou Koh Kradan dépend du bateau. Le client ne choisit pas.
  - Mangroves : « gondola », un mot absent de la page produit, qui parle d'un *raft*.
  - Pêche : le texte dit « on a longtail », le prix dit « Raft from 3,900 THB ».
  - « Every boat tour includes hotel transfer, lunch and snorkel gear » : faux pour la pêche et pour le raft au lever du soleil.
- « Book now » (13 fois) ne réserve rien. Le bouton du haut dit « Get a price » alors que les prix sont affichés juste en dessous.
- Deux titres se répètent l'un sous l'autre au-dessus du formulaire : « Tell us what you need » puis « What do you need? » (capture `stt/work/shot_landing_from_tour.png`).
- Le songthaew a une fiche, mais ni page ni prix.

**Excursions en bateau (6 pages).**
- Le gabarit est identique partout (« HOW THE DAY GOES / PRICES / IN THE PRICE / Good to know / Questions we get about this trip »), avec des titres en CAPITALES.
- Contradictions :
  - 4 Islands : la chronologie dit « Back on Koh Lanta between 15:30 and 16:00 », puis « Good to know » dit « The return is usually between 14:30 and 16:00 ».
  - Mangroves : enfants « 3 to 9 » et « 4 to 11 » sur la même page.
  - Koh Talabeng : la page dit « Ask us for a price », alors que la page kayak vend ce circuit à 1 000 THB. Les deux pages se cannibalisent.
- Affirmation fausse : « National park fees are never included by any boat operator on Koh Lanta. » Simply Life Tours et une annonce privée de GetYourGuide incluent ces frais (§5).
- Le parc n'est jamais nommé.
- Le `<title>` est tronqué en « | Secret Travel » sur Phi Phi, la plongée, le kayak et l'éléphant.

**Activités (9 pages).**
- H1 cassé : « Thai cooking class market and lunch ».
- Plongée : « never more than two students per instructor » contre « two or three students at most ». L'agence de certification SSI n'apparaît que dans la meta. Les heures passent en format « 4.30 pm ».
- Éléphants : « The sanctuary is on Koh Lanta », mais le programme C inclut l'Emerald Pool et la hot spring waterfall, situées à Khlong Thom, sur le continent [À VÉRIFIER]. « Ethical » n'est appuyé par aucun nom ni aucune règle.
- Kayak : « Tungyeepeng » (10 fois) et « Thung Yee Peng » (8 fois) ; « Koh Aung » et « Koh Ung » dans la même liste.
- Go-kart : « The price list is for a minimum of 2 programmes » est incompréhensible. La page ne dit ni où est la piste, ni l'âge minimum.
- Location : « we confirm it is free » (pour dire *available*). Rien sur le permis, la caution, le passeport, l'assurance ou le casque.
- Speedboat : le titre dit « Speedboat and ferry », mais la page ne parle d'aucun ferry et n'affiche aucun tarif.

**Taxi (hub + 17 trajets).**
- Autre marque, autre logo, autre formulaire, sur le même domaine.
- Les 17 pages partagent les mêmes blocs Vehicle / Payment / Drive / Return, « How it works » et 3 FAQ. Le contenu unique tient en 1 ou 2 phrases : c'est du contenu quasi dupliqué.
- Contradictions :
  - « no sharing » (taxi) contre « private & shared » (accueil).
  - « Secret Travel & Tour runs **private** day tours », alors qu'une bonne partie de l'offre est en join-in.
  - « Private minivan » dans le H1, « Taxi or minivan » dans le bloc.
- FAQ en double : « Is the Khao Lak transfer private? » suivi de « Is the transfer private? ». Krabi Airport → Khao Lak n'a pas de durée.
- Espace avant le point : « destination . » (18 pages).
- « Rated 5 stars on Google by international travelers » : *travelers* en US, aucun nombre d'avis.
- « Minivan Taxi » dans les 17 `<title>` : ce n'est pas un terme que les gens recherchent.

**Pages légales.** Ce sont les meilleurs textes du site. Il reste trois problèmes :
- Le paiement « bank transfer, cash or another method » (art. 3) contredit « no prepayment » côté taxi.
- Les âges 0–2 et 3–11 (art. 4) contredisent 6 pages produit.
- Aucun **numéro de licence TAT** n'apparaît. Le numéro d'immatriculation 0815569000065 semble indiquer une société enregistrée en 2569 BE, soit 2026 [À CONFIRMER] : aucune ancienneté de la société ne doit être revendiquée.

**Cohérence de l'anglais** (relevé chiffré dans `stt/work/all.txt`) :
- US/UK mélangés : snorkeling ×20 et snorkelling ×2 ; travellers ×5 et travelers ×2 ; organise, programme, tyres (UK) ; specialties (US).
- Heures mélangées : « 7:45 », « 4.30 pm », « 1h30 ».
- « in Koh Lanta » ×3 aux endroits les plus visibles (H1, title, meta).
- Le séparateur « · » est utilisé sur l'accueil, des virgules sur les pages produit.
- Majuscules incohérentes : « Booking Terms » contre « Legal notice ».

## 2. Tics d'écriture générée (citations exactes et réécritures)

| # | Tic | Citation exacte (page) | Réécriture |
|---|---|---|---|
| 1 | Intitulé de gabarit répété partout | « Questions we get about this trip » ×15, y compris sur la location de voitures et la grille des speedboats | « Before you book » ou une vraie question en H2 : « Longtail or speedboat? » |
| 2 | Lien générique | « Learn more » sur chaque carte de chaque page | « See the 4 Islands tour » |
| 3 | Triade d'accroche | « Transfers, boat tours and island activities, booked with a local team. » (accueil) | « Boat trips, island activities and transfers, booked at our desk in Sala Dan or on WhatsApp. » |
| 4 | Triade de qualités | « Small groups, a professional instructor and the reefs of the Andaman Sea. » (plongée) | « Two dives at Koh Haa or Koh Bida, never more than [2 ou 3, À CONFIRMER] students per instructor. » |
| 5 | Triade négative | « No sharing, no stress, no waiting. » (taxi) | « Just your group in the car, from the airport to your hotel door. » |
| 6 | Promesse creuse | « Friendly drivers who know the region well. » / « Clean and comfortable vehicles » (taxi) | Des faits : modèle du véhicule, climatisation, nombre de places, nom du chauffeur [À CONFIRMER] |
| 7 | Question rhétorique en titre | « Ready to explore? », « Planning a bigger trip? », « Something else in mind? », « Need a ride? » | Des titres qui disent ce qu'il y a dessous : « Day tours on Koh Lanta », « Private transfers » |
| 8 | Chute mignonne en fin de phrase | « then swimming and time to do nothing. » (4 Islands) ; « Then you eat it all. » (cuisine) ; « in time for a second breakfast » (mangroves) | « Lunch is a Thai buffet on the beach, then free time to swim. » / « You eat what you cook. » / « Back at your hotel by 07:30. » |
| 9 | Formule pseudo-littéraire | « A half day of fishing the way the island does it » (pêche) ; « train from your first breath to advanced diver » (plongée) | « Half a day fishing with a local captain. » / « From your first dive to Advanced Open Water. » |
| 10 | Tournure « Nobody… » répétée (×10) | « Nobody rides. » « Nobody needs experience for the one-day Basic Diver. » « Nobody sits on them. » | « There is no riding. » / « No experience needed. » |
| 11 | Deux-points de révélation | « plus Koh Kradan or Koh Ngai: your choice. » ; « One more island and one more snorkeling stop: Koh Ma on the longtail… » | « The longtail visits Koh Ma, the speedboat Koh Kradan. » |
| 12 | Rassurance répétée jusqu'à l'usure | « no hidden fees » ×37, « your group only » ×31, « No sharing » ×21 | Le dire une fois, en clair, dans le bloc des faits clés |
| 13 | Voix sans personne : « the team » ×22, « we » 4 fois sur toute la page 4 Islands | « The team confirms the price on WhatsApp » | « [Prénom] replies on WhatsApp, usually within [X] minutes [À CONFIRMER]. » |
| 14 | Meta descriptions toutes bâties sur le même moule « X: a, b, c. From N THB. » | « ATV on Koh Lanta: 30 minutes on a closed track, an hour in the forest… From 1,200 THB, transfer included. » | Varier : commencer par le bénéfice ou par la question de l'internaute (§4.4) |
| 15 | Affirmation absolue invérifiable | « National park fees are never included by any boat operator on Koh Lanta. » | « The park fee isn't in our price. You pay it in cash to the ranger on the island. » |
| 16 | Alt et légende qui ne correspondent pas | Même photo : alt « Our longtail boat on clear turquoise water » (accueil), légende « Koh Ngai » (4 Islands) | Une photo par lieu, une légende vraie |
| 17 | Calques du français | « a visit of Lanta Old Town », « the beach of Koh Bubu », « the mangrove », « in the Trang sea », « on Malaysian time », « Give us the ages », « a box for what you could not finish », « we confirm it is free » | « a walk around Lanta Old Town », « Koh Bubu's beach », « the mangroves », « south of Koh Lanta », « Malaysia time », « Tell us your children's ages », « a box to take leftovers home », « we confirm it's available » |

Note sur le rythme : la longueur des phrases varie correctement (écart-type de 9 à 17 mots selon les pages, mesuré). Le problème n'est pas la monotonie des phrases, c'est la **monotonie des pages** et l'absence de voix.

---

## 3. Informations manquantes avant réservation

Légende : **O** = présent, **~** = partiel, ambigu ou contradictoire, **–** = absent.

### 3.1 Excursions en bateau
| Info | 4 Islands | Koh Rok | Phi Phi | Talabeng | Mangroves | Pêche |
|---|---|---|---|---|---|---|
| Prix | O | ~ (pas de prix pour le speedboat privé) | ~ (privé : « ask us ») | – | O | ~ (longtail : « ask us ») |
| Inclus | O | O | O | O | O | O |
| Non inclus (liste) | ~ (frais de parc seulement) | ~ | ~ | – | ~ | – |
| Horaires | O (contradiction 14:30/15:30) | O | O | – | ~ (raft seulement) | O (raft) |
| Durée | O | O | O | ~ | ~ | O |
| Prise en charge / zones | ~ « hotel », sans zones ni supplément | ~ | ~ | ~ | ~ | O (ponton Thung Yee Peng) |
| Âges / enfants | ~ (4–11 sur la page, 3–11 dans le formulaire) | ~ | ~ | – | ~ (3–9 et 4–11) | ~ |
| Que prendre | ~ (cash seulement) | ~ | ~ | – | ~ (anti-moustique) | – |
| Annulation (client) | – | – | – | – | – | – |
| Météo / mer agitée | ~ | ~ (saison) | ~ (Maya Bay) | – | – | – |
| Paiement (cash, acompte, sur place ?) | – | – | – | – | – | – |
| Taille du groupe | – | – | – | – | ~ (raft privé) | ~ |
| Type et capacité du bateau | ~ | ~ | ~ | ~ | ~ | ~ |
| Langue du guide | – | – | – | – | – | – |
| Frais de parc | O | O | O | – | O (droit d'entrée du village) | – |
| Santé, grossesse, savoir nager | – | – | – | ~ (« never kayaked ») | – | – |
| Accessibilité (mobilité réduite) | – | – | – | – | – | – |
| Grotte d'Émeraude (nage d'environ 80 m dans le noir, fermée si houle, selon Headout et Simply Life) | – | n/a | n/a | n/a | n/a | n/a |

### 3.2 Activités
| Info | Plongée | Quad | Kayak | Éléphants | Cuisine | Batik | Kart | Location | Speedboat |
|---|---|---|---|---|---|---|---|---|---|
| Prix | O | O | O | O | O | O | O | O | – |
| Inclus / non inclus | O | O | O | O | O | O | ~ | – | ~ |
| Horaires | ~ | – | O | O | O | O | – | n/a | O |
| Lieu | ~ | – | O | – | – | – | – | – | O |
| Âge minimum | O | O | ~ | ~ | ~ | ~ | – | – (âge, permis) | n/a |
| Que prendre | O | O | – | O | – | – | – | – | – |
| Annulation | – | **O** (24 h, 50 %) | – | – | – | – | – | – | – |
| Paiement | – | – | – | – | – | – | – | – (caution) | – |
| Groupe | O | – | – | ~ | – | – | – | n/a | n/a |
| Langue | – | – | ~ | – | – | O | – | n/a | n/a |
| Santé | O | – | – | – | – (allergies, régime végétarien) | – | – | n/a | – |
| Enfants | O | O | O | O | O | O | – | n/a | – |

Les **pages taxi** n'ont ni prix (même pas « à partir de »), ni capacité du véhicule, ni bagages, ni temps d'attente en cas de retard du vol. Le point de rencontre à l'aéroport n'est pas décrit (pancarte au nom du client ? sortie ?), pas plus que le trajet en ferry et ce qu'il coûte, le supplément de nuit ou les conditions d'annulation. Le seul élément solide est le paiement en cash au chauffeur.

### 3.3 Confiance : ce qui prouve qu'il s'agit d'une vraie agence
| Présent | Absent |
|---|---|
| Adresse physique + lien Google Maps (accueil, pied de page) | Avis clients, note Google, extraits d'avis (0 sur les 20 pages Secret) |
| Raison sociale + numéro d'immatriculation (pages légales) | **Numéro de licence TAT** (le concurrent kohlanta.tours affiche « TAT licence No. 42/00462 ») |
| Conditions de vente sérieuses | Photos de l'équipe, du comptoir, de la devanture, prénoms |
| Prix détaillés (c'est un vrai atout face aux sites qui disent « ask for price ») | Horaires d'ouverture du bureau, langues parlées, délai de réponse |
| | E-mail, téléphone (autre que WhatsApp) |
| | Nom des prestataires partenaires (centre de plongée, sanctuaire, école de cuisine), sans lequel « ethical » ne vaut rien |
| | Assurance : « Guide and insurance » sans préciser quel type ni quelle couverture |
| | Des photos propres : la même photo de longtail sert 3 fois, celle de l'Old Town 2 fois, et la photo de la grotte d'Émeraude est floue (capture `t4islands_mobsheet_00.png`) |

### 3.4 Cohérence des noms et des mentions
- Trois marques se côtoient sans hiérarchie claire : « Secret Travel & Tour » (logo), « VIP Taxi Lanta by Mr. Brown » (/taxi/, autre logo), « Zwald Travel Planner » (bandeau « Planning a bigger trip? » et pied de page). Le pied de page dit tantôt « operated by », tantôt « Bookings are sold by ».
- Côté prix, on trouve « From 1,000 THB per adult », « Speedboat from 2,000 THB per adult », « Raft from 3,900 THB » (par raft et non par personne, sans le dire sur la carte), « From 399 THB » (avec un minimum de 2 non signalé), « From 250 THB per day ». Le prix de référence doit toujours être expliqué de la même façon : « from 1,000 THB per adult » ou « 3,900 THB per raft (1–2 people) ».
- Tranches d'âge enfant : 3–11 (formulaire et conditions), 4–11 (bateaux, kayak), 3–9 (raft), 4–10 (éléphants), 3–10 (batik), 5–11 (snorkelling sur le bateau de plongée), 5–12 (cuisine), 6–12 et 4–12 (quad). Soit on aligne, soit on affiche **l'âge exact sur chaque ligne de prix** et le formulaire demande **l'âge** de chaque enfant plutôt qu'une catégorie.

---

## 4. Parcours de conversion (test Playwright, iPhone 390 × 844)

### 4.1 Messages réellement produits (URL wa.me interceptée, non ouverte)
**Onglet Boat tour depuis la page 4 Islands, bouton « Book now », sans toucher aux options :**
```
Hi Secret Travel & Tour!
I'm interested in a boat tour: 4 Islands.
Name: Anna Muller
Date: Tomorrow (Tue 3 Nov)
Adults: 2
Private boat
```
Activity (éléphants) : « I'm interested in an activity: Ethical elephant sanctuary. / Name / Date: Sun 20 Dec 2026 / People: 2 / Hotel… », sans programme A/B/C ni âges. Transfer : From, To, date, heure, voyageurs, siège enfant, « Private minivan », sans numéro de vol ni bagages.

**Page Speedboat, bouton « Get a price » (Koh Lanta → Koh Lipe) :** le message se termine par « Private speedboat ». Le client voulait une place sur le bateau régulier de 10:30 ; l'agence lit une demande de bateau privé.

### 4.2 Frictions (par gravité)
1. **« Private » est présélectionné** dans l'onglet bateau (`b-mode` coché sur `private`, `secret.js`) alors que le prix d'appel (1 000 THB) est celui du join-in. Résultat : une demande à 5 900 THB par défaut, une confusion pour l'agence et un risque de choc pour le client.
2. **Aucun choix d'option** : pas de longtail ou speedboat (le prix double), pas de programme A/B/C pour les éléphants, pas de durée pour le quad ni de choix pilote/passager, rien sur les 7 sorties kayak, les 11 programmes de plongée (ni le niveau de certification), les 3 formules de cuisine, ni le modèle de véhicule et la **date de retour** pour la location. Le message « I'm interested in an activity: Kayaking. People: 2 » impose 2 à 3 allers-retours avant de pouvoir donner un prix.
3. **Pas d'âge des enfants** dans l'onglet Activity (seulement « People »), alors que tous les prix dépendent de l'âge.
4. **Hôtel facultatif** pour les excursions alors que la prise en charge à l'hôtel est incluse : l'agence doit le redemander. Pour les transferts, il manque le **numéro de vol**, l'heure d'atterrissage et le nombre de bagages (que les pages taxi réclament pourtant dans leur texte).
5. **« Pickup time » obligatoire** pour un speedboat à horaire fixe, que le client ne connaît pas.
6. **Les pages produit n'ont pas de formulaire** : « Book now » recharge l'accueil et descend à y = 2 272 px. Le client quitte les prix et les options qu'il était en train de lire.
7. Dates relatives dans le message (« Tomorrow (Tue 3 Nov) ») : si l'agence lit le message après minuit, « Tomorrow » devient faux. Il faut une date absolue avec l'année.
8. Le message ne contient ni la page d'origine, ni le prix vu, ni la langue du client.
9. « Full name » est obligatoire (message d'erreur « Tell us your full name. »), alors que WhatsApp transmet déjà le nom et le numéro. Un prénom suffit.
10. Aucun texte ne dit ce qui se passe ensuite : quand l'agence répond, à quelles heures, comment on paie.

### 4.3 Nombre d'actions, de Google à l'envoi
| Parcours | Actions |
|---|---|
| Google → /tours/4-islands/ → Book now (rechargement) → date → Join-in → hôtel (saisie) → nom (saisie) → Send → envoyer dans WhatsApp | **7 touchers + 2 saisies + 1 rechargement**, puis 1 à 2 échanges supplémentaires pour longtail/speedboat et âges |
| Accueil → bouton « Get a price » (ouvre l'onglet **Transfer** par défaut) → onglet Boat tour → choisir l'excursion (2) → date → Join-in → hôtel → nom → Send → WhatsApp | **10 touchers + 2 saisies** |
| Transfert depuis l'accueil (From, To, date, heure, voyageurs, nom) | **8 touchers + 3 saisies** ; formulaire de 1 095 px (1,3 écran), bouton d'envoi à y = 3 461 px sur 4 295 |

### 4.4 Parcours idéal
1. Sur chaque page produit, une **barre collante en bas** : « From 1,000 THB · Check availability ».
2. Chaque **ligne de prix est sélectionnable** (« Join-in longtail · Adult 1,000 / Child 700 »). Toucher une ligne ouvre une feuille en bas d'écran, avec l'option déjà choisie.
3. La feuille contient : date (Today / Tomorrow / calendrier), adultes, enfants **avec l'âge** de chacun, hôtel (obligatoire, suggestions par plage), prénom. Pour les transferts : numéro de vol ou heure du ferry, bagages.
4. Le bouton « Send on WhatsApp » ouvre WhatsApp. En revenant sur la page, le client voit un écran de confirmation : « WhatsApp should open now. We usually reply within [X] minutes, 08:00–20:00 [À CONFIRMER]. Nothing opened? Copy your message / Call +66 95 868 38 46. »
5. Objectif : **4 touchers + 2 saisies**, avec un message que l'agence peut chiffrer sans poser de question.

### 4.5 Modèle de message WhatsApp idéal
```
Hello Secret Travel & Tour,
Booking request: 4 Islands – Join-in longtail
Date: Wed 4 Nov 2026
Guests: 2 adults, 1 child (age 7)
Pickup: Lanta Sand Resort (Klong Dao)
Name: Anna
Price on website: 1,000 THB adult / 700 THB child
Page: secrettravelandtour.com/tours/4-islands/
```
Transfert :
```
Hello Secret Travel & Tour,
Transfer request: Krabi Airport → Koh Lanta (private minivan)
Date: Tue 3 Nov 2026
Flight: FD3xxx, lands 14:30
Guests: 2 adults, 1 child (age 5) – child seat please
Bags: 2 large, 2 small
Drop-off: [hotel]
Name: Anna
```
La première ligne sert de tri immédiat pour l'agence (produit + option). Les lignes suivantes donnent tout ce qu'il faut pour chiffrer. Il n'y a ni « Hi…! » ni point d'exclamation.

---

## 5. Benchmark (même excursion : 4 Islands)

| Info donnée par les concurrents | Klook / Trip Store Krabi | Expedia / Trip Store | Headout | Expedia / Siam Scape (privé) | kohlanta.tours (local, Sala Dan) | Simply Life (local, privé) | **Nous** |
|---|---|---|---|---|---|---|---|
| Annulation gratuite 24 h affichée | O | ~ | O | ~ | O | acompte non remboursable | – |
| Zones de prise en charge citées (Kantiang, Klong Nin, Long Beach…) | O | O | – | – | O (section « Hotel pickup areas ») | – | – |
| Que prendre | O | – | ~ | – | O | ~ | ~ |
| Durée de chaque arrêt | O | O | – | O | O | – | ~ |
| Grotte d'Émeraude : nage d'environ 80 m dans le noir, fermée si houle | – | – | O | O | – | O | – |
| Groupe max ou minimum (27 par bateau / départ garanti à 10) | – | O | O | n/a | – | n/a | – |
| Langue du guide (EN/TH) | O | O | – | – | O | – | – |
| Santé (grossesse, cœur, dos) | O | O | O | O | – | – | – |
| Régimes alimentaires (végétarien, halal) | O | – | O (« options limitées ») | – | – | – | – |
| Nom du parc | – | O (Hat Chao Mai) | – | – | O (Trang) | – | – |
| Licence TAT, note Google, horaires du bureau | – | – | – | – | **O** | ~ (TripAdvisor) | – |
| Prix | ~41 USD | 36 USD | 30,69 USD | dès 227 GBP/pers. | **995 THB** | 7 200 THB (2 pers., privé) | 1 000 THB / privé 5 900 THB |

À retenir :
- Notre itinéraire est **identique, presque à la minute**, au produit Trip Store Krabi revendu sur Expedia. Ce n'est pas un problème, mais le texte ne peut pas se différencier par le programme. Il doit le faire par la clarté, les prix nets, le conseil et la présence physique.
- Le concurrent le plus dangereux est **kohlanta.tours** : même quartier, 5 THB moins cher, licence affichée, 4,7 sur Google, horaires 07:00–22:00, réservation en ligne + WhatsApp.
- Atout à exploiter : notre longtail privé est moins cher que Simply Life (5 900 contre 7 200 THB pour 2), et c'est écrit nulle part.

Sources : [Klook, Trip Store Krabi](https://www.klook.com/activity/82842-join-4-island-tour-emerald-cave-longtail-boat-koh-lanta-krabi/) · [Expedia, Trip Store Krabi](https://www.expedia.com/things-to-do/4-island-tour-to-emerald-cave-by-longtail-boat-from-koh-lanta.a479973.activity-details) · [Headout](https://www.headout.com/krabi-island-tours/from-koh-lanta-4-islands-longtail-boat-tour-with-emerald-cave-e-49371/) · [Expedia UK, Siam Scape privé](https://www.expedia.co.uk/things-to-do/koh-lanta-4-islands-by-private-longtail-boat-with-emerald-cave.a50874667.activity-details) · [Annonce GetYourGuide relayée (frais de parc inclus)](https://theabroadguide.com/ko-lanta-4-islands-tour-by-private-longtail-boat/) · [kohlanta.tours](https://kohlanta.tours/tours/4-island-tour-longtail-boat) · [Simply Life Tours](https://www.simplylifetours.com/4-islands-tour-ko-lanta/). GetYourGuide bloque la lecture automatique, d'où le relais par theabroadguide.com.

---

## 6. Règles éditoriales pour la refonte

### 6.1 Ton de voix
**« Le comptoir de Sala Dan sur WhatsApp. »** Quelqu'un de l'équipe vous répond, connaît les bateaux, dit franchement ce qui va et ce qui ne va pas. Première personne du pluriel (« we »), deuxième personne pour le client. Le ton est concret, court et un peu sec, avec de l'humour seulement quand il est factuel.

| Avant | Après |
|---|---|
| « Your travel agency in Koh Lanta » | « Boat trips and transfers from Sala Dan, Koh Lanta » |
| « Friendly drivers who know the region well. » | « Mr. Brown and his drivers [nombre, À CONFIRMER] do the Krabi Airport run every day. » |
| « then swimming and time to do nothing. » | « then an hour on the beach at Koh Ngai. » |
| « National park fees are never included by any boat operator » | « The park fee isn't in our price: 200 THB per adult, cash, paid to the ranger. » |
| « Nobody needs experience for the one-day Basic Diver. » | « Never dived? The one-day Basic Diver is made for you. » |

### 6.2 Règles de style anglais
- Anglais britannique (travellers, snorkelling, organise, colour, programme, specialities).
- « on Koh Lanta », « at Sala Dan pier », « in Krabi Town ».
- Heures sur 24 h : « 07:45 », plages avec tiret demi-cadratin « 09:00–16:00 ». Durées : « 45 min », « 1 hr 30 min », « about 2–3 hours ».
- Prix : « 1,000 THB », unité toujours précisée (« per adult », « per boat », « per raft, 1–2 people »).
- Majuscule au premier mot seulement dans les titres, jamais de titre en CAPITALES. Le style visuel peut mettre en capitales par CSS, mais le texte source reste en minuscules.
- Un seul deux-points par paragraphe au maximum, aucun deux-points « de révélation ».
- Pas de point d'exclamation, sauf dans une vraie citation d'avis.
- Le « · » est réservé aux lignes de faits courtes (3 éléments au maximum), jamais dans une phrase.
- Contractions autorisées (« isn't », « you'll ») : elles rendent le texte humain.
- Pas de liste de 3 adjectifs. Si l'on énumère, c'est que les éléments sont concrets (noms d'îles, objets inclus).

### 6.3 Longueurs
| Élément | Limite |
|---|---|
| `<title>` | 60 caractères maximum, la marque courte en fin (« \| Secret Travel & Tour ») ; vérifier qu'aucun titre n'est tronqué |
| Meta description | 140 à 155 caractères, avec prix, durée et un élément différenciant ; jamais le même moule d'une page à l'autre |
| H1 | 8 mots maximum, avec le mot-clé de recherche (« 4 Islands tour from Koh Lanta ») |
| Accroche sous le H1 | 25 mots maximum |
| Intro produit | 2 paragraphes, 80 mots maximum au total |
| Étape de chronologie | 20 mots maximum |
| Réponse FAQ | 50 mots maximum, réponse dans la 1re phrase |
| Bouton | 3 mots maximum (plus le pictogramme WhatsApp) |

### 6.4 Structure type d'une page excursion (dans l'ordre)
1. Fil d'Ariane, puis H1, accroche, **faits clés** (prix d'appel, durée, horaire de prise en charge, type de bateau, join-in ou privé, saison), puis bouton principal + lien WhatsApp.
2. Galerie de 4 à 6 vraies photos légendées.
3. **Options et prix** : chaque ligne est sélectionnable, avec « Not included: park fee 200 THB, cash » juste sous le prix.
4. **The day** (chronologie, une version par option si les itinéraires diffèrent).
5. **Included / Not included** (deux colonnes).
6. **Before you book** : zones de prise en charge, que prendre, enfants et âges, santé et grossesse, savoir nager, météo et annulation, paiement.
7. **Reviews** (vrais avis Google datés, avec lien) [À CONFIRMER].
8. **FAQ** : 4 à 6 questions réelles posées sur WhatsApp.
9. **Who runs this trip** : notre comptoir, le prestataire partenaire, l'adresse et les horaires.
10. 3 excursions liées au maximum, puis la barre d'action collante sur mobile.

### 6.5 Micro-textes
| Contexte | Texte |
|---|---|
| Bouton principal | « Check availability » (et non « Book now », puisqu'il n'y a pas de paiement) |
| Bouton secondaire | « Ask on WhatsApp » |
| Envoi | « Send on WhatsApp » |
| Sous le bouton | « Opens WhatsApp with your message ready. Nothing is booked until we confirm. » |
| Champ hôtel | « Hotel or address » · aide : « We pick you up here. » |
| Champ enfants | « Children » puis, par enfant : « Age » |
| Erreurs | « Pick a date. » · « Add your hotel so we know where to pick you up. » · « Add at least one adult. » · « That date has passed. » |
| Confirmation | « WhatsApp should be open. We usually reply within [X] minutes between [08:00 et 20:00, À CONFIRMER]. Nothing happened? Copy your message or call +66 95 868 38 46. » |
| Hors ligne / pas de WhatsApp | « No WhatsApp? Copy the message and send it by SMS to +66 95 868 38 46. » |

### 6.6 Mots et tournures à bannir
discover, explore, unforgettable, breathtaking, stunning, paradise, hidden gem, nestled, crystal-clear, vibrant, immerse, embark, curated, seamless, hassle-free, stress-free, world-class, memories, dream, « Whether you're… », « Look no further », « Ready to…? », « Planning a…? », « Something else in mind? », « a bit of everything », « time to do nothing », « the way the island does it », « Nobody… », « no hidden fees » (plus d'une fois par page), « Learn more », « Questions we get about this trip », « Minivan Taxi », « 1h30 », « in Koh Lanta ».

### 6.7 Toponymes de référence
Koh Lanta · Sala Dan (pier) · Lanta Old Town (pier) · Koh Chueak · Koh Mook (Emerald Cave) · Koh Ngai · Koh Ma · Koh Kradan · Koh Rok (Nok, Nai) · Koh Haa · Koh Phi Phi (Phi Phi Leh, Phi Phi Don) · Maya Bay · Pileh Lagoon · Bamboo Island · Koh Talabeng · Koh Bubu · Thung Yee Peng (choix à valider avec le client, mais un seul) · Krabi Airport (KBV) · Phuket Airport (HKT) · Surat Thani Airport (URT) · Khao Sok · Cheow Lan Pier · Donsak Pier.

---

## 7. Réécritures (faits du site uniquement)

### 7.1 Hero de l'accueil
```
[H1]  Boat trips, activities and transfers on Koh Lanta
[Lead] Book at our desk in Sala Dan or on WhatsApp. Prices are on the site,
       hotel pickup is included on every boat trip, and you pay [cash on the day / À CONFIRMER].
[Btn]  See boat trips        [Link] Ask on WhatsApp
[Facts strip] 4 Islands from 1,000 THB · Koh Rok from 2,000 THB · Airport transfers, private
[Trust strip] [★ 4.x on Google – N reviews, À CONFIRMER] · TAT licence [n°, À CONFIRMER] · 292 Moo 2, Sala Dan
```

### 7.2 Page 4 Islands complète
```
<title> 4 Islands Tour from Koh Lanta – from 1,000 THB | Secret Travel & Tour   (59 car. hors marque à vérifier)
<meta>  Emerald Cave, Koh Ngai and two snorkelling stops, by longtail or speedboat. Join-in from 1,000 THB, private longtail from 5,900 THB, hotel pickup included.

[Breadcrumb] Home › Boat trips › 4 Islands

[H1] 4 Islands tour from Koh Lanta
[Lead] A full day south of Koh Lanta: snorkelling at Koh Chueak, the swim through
       the Emerald Cave on Koh Mook, and a beach lunch on Koh Ngai or Koh Kradan.

[Key facts]
From 1,000 THB per adult · Full day, pickup 07:45–08:30 · Longtail or speedboat · Join-in or private
[Btn] Check availability   [Link] Ask on WhatsApp

[Gallery] Koh Chueak reef · Emerald Cave entrance · Koh Ngai beach · our longtail at Old Town pier [photos réelles, À FOURNIR]

[H2] Longtail or speedboat?
The longtail is the traditional wooden boat: open, slower, and it stops at Koh Ma.
Lunch is on Koh Ngai. It leaves from Lanta Old Town pier.
The speedboat is faster, stops at Koh Kradan instead of Koh Ma, and lunch is on
Koh Kradan. It leaves from [nom du ponton, À CONFIRMER].
On a private longtail you choose the order of the islands and can add Koh Kradan.

[H2] Prices
Join-in longtail – shared with other travellers
  Adult 1,000 THB · Child (4–11) 700 THB · Under 4 free           [Choose]
Join-in speedboat
  Adult 2,000 THB · Child (4–11) 1,000 THB · Under 4 [À CONFIRMER] [Choose]
Private longtail – the boat and captain for your group
  1–2 people 5,900 THB · 3–4 people 6,400 THB · each extra person +400 THB
  Add Koh Kradan +500 THB per boat                                  [Choose]
Not included: national park fee, 200 THB per adult and 100 THB per child
(Thai nationals 40 / 20 THB), paid in cash to the ranger on the island.

[H2] The day (join-in longtail)
07:45–08:30  Pickup at your hotel, then Lanta Old Town pier
09:00        Boat leaves. About 45 min to the first island
09:45        Koh Chueak: snorkelling over the reef, about 45 min
11:00        Koh Mook: swim through the Emerald Cave into the lagoon
12:00        Thai buffet lunch on the beach at Koh Ngai, then free time
13:45        Koh Ma: last snorkelling stop
15:30–16:00  Back on Koh Lanta, drop-off at your hotel
Times shift a little with the tide and the sea. [Heure de retour : 14:30 ou 15:30 ? À CONFIRMER]

[H2] Included / Not included
Included: hotel pickup and drop-off · Thai buffet lunch, water and fruit ·
mask, snorkel and life jacket · guide [langue, À CONFIRMER] · insurance [type, À CONFIRMER]
Not included: national park fee (cash) · [boissons, pourboires, À CONFIRMER]

[H2] Before you book
Pickup: hotels on [plages couvertes, À CONFIRMER]. [Supplément éventuel, À CONFIRMER]
Bring: swimwear, towel, sunscreen, cash for the park fee. [Liste à valider]
Children: welcome. Life jackets in children's sizes [À CONFIRMER]. Tell us their ages.
The Emerald Cave: a swim through a dark passage, with a guide. [Longueur, lampe, possible fermeture par houle, À CONFIRMER]
Health: [grossesse, problèmes de dos ou de cœur, non-nageurs, À CONFIRMER]
Weather and cancellation: if the boat can't go, we offer another date or a refund
(booking terms, art. 7). If you cancel: [délai et conditions, À CONFIRMER]
Payment: [cash au comptoir, sur place, virement, acompte ? À CONFIRMER]
Group size: [max par bateau join-in, À CONFIRMER]

[H2] Reviews   [avis Google réels, À FOURNIR]

[H2] Questions
Is the park fee included?
  No. 200 THB per adult and 100 THB per child, in cash, paid to the ranger on the island.
Can we have the boat to ourselves?
  Yes. A private longtail costs 5,900 THB for 1–2 people, with your own captain
  and the islands in the order you choose.
Can small children come?
  Yes. Under 4 travel free on the longtail, and ages 4–11 pay the child rate.
  Tell us their ages when you write.
What if the sea is rough?
  The captain decides on the day. If the trip can't run, we move you to another date
  or refund you. [À CONFIRMER]

[H2] Who runs this trip
Booked through our desk at 292 Moo 2, Sala Dan, open [horaires, À CONFIRMER].
Operated by [nom du partenaire bateau, À CONFIRMER].

[Related] Koh Rok & Koh Haa · Koh Phi Phi · Koh Talabeng & Koh Bubu
[Sticky mobile] From 1,000 THB · Check availability
```

### 7.3 Page trajet taxi : Krabi Airport → Koh Lanta
*(Le choix de marque est à trancher avec l'agent stratégie : ici, le service est vendu sous Secret Travel & Tour et assuré par VIP Taxi Lanta.)*
```
<title> Krabi Airport to Koh Lanta Private Transfer | Secret Travel & Tour
<meta>  Private car or minivan from Krabi Airport (KBV) to your hotel on Koh Lanta, about 2–3 hours. Your group only, pay the driver in cash. Price on WhatsApp.

[Breadcrumb] Home › Transfers › Krabi Airport to Koh Lanta

[H1] Krabi Airport to Koh Lanta
[Lead] A private car or minivan from arrivals at Krabi Airport to your hotel door on Koh Lanta.
       Just your group, and you pay the driver in cash when you arrive.

[Key facts]
About 2–3 hours · Your group only · Cash to the driver, no prepayment · Both directions
[Price] From [prix voiture / minivan, À CONFIRMER] THB per vehicle
[Btn] Check availability   [Link] Ask on WhatsApp

[H2] How it works
1. Send your flight number, landing time, hotel and the number of people and bags.
2. We reply on WhatsApp with the price and confirm your driver.
3. Your driver meets you at [point de rencontre exact, pancarte au nom ? À CONFIRMER].

[H2] Vehicles
Car: up to [N] people and [N] bags [À CONFIRMER]
Minivan: up to [N] people and [N] bags [À CONFIRMER]
Child seats and baby seats on request, confirmed in writing.

[H2] Good to know
Flight delayed? Tell us on WhatsApp. The driver tracks [ou non, À CONFIRMER] your
flight and waits [durée, À CONFIRMER].
The road to Koh Lanta includes [ferry / pont, frais inclus ? À CONFIRMER].
Leaving Koh Lanta? Use the same form with your hotel as pickup and Krabi Airport
as destination. We suggest leaving [X] hours before your flight [À CONFIRMER].
Cancellation: [conditions, À CONFIRMER]

[H2] Questions
Where do I meet the driver?
  [À CONFIRMER]. We send the exact meeting point and the driver's name on WhatsApp the day before.
How do I pay?
  In cash to the driver at the end of the trip. Nothing to pay in advance.
Is it shared with other passengers?
  No. The car or minivan is for your group only.

[H2] Your drivers
Run by Mr. Brown (VIP Taxi Lanta), based on Koh Lanta. [Photo et quelques mots, À FOURNIR]

[Related] Phuket Airport to Koh Lanta · Koh Lanta to Ao Nang · Koh Lanta to Krabi Town
```

---

## 8. Questions au client

**Identité et confiance**
1. Avez-vous une licence TAT (Department of Tourism) ? Quel numéro, et au nom de quelle société ?
2. Avez-vous une fiche Google de Secret Travel & Tour avec des avis ? Quelle note, combien d'avis ? Pouvons-nous citer quelques avis (prénom, date) ?
3. Date de création de la société, et années d'expérience de l'équipe (pour ne rien affirmer de faux).
4. Prénoms et photos de l'équipe du comptoir et de Mr. Brown, photos du comptoir et de la devanture.
5. Horaires d'ouverture du bureau, délai de réponse habituel sur WhatsApp, langues parlées.
6. Faut-il un e-mail public ou un second numéro ?
7. Quels sont les partenaires (bateaux, centre de plongée et agence de certification SSI ou PADI, nom du sanctuaire d'éléphants, école de cuisine, piste de kart, loueur) ? Peut-on les nommer ?
8. Quelle assurance couvre « Guide and insurance » ?

**Marque**
9. VIP Taxi Lanta reste-t-elle une marque visible, ou devient-elle « nos chauffeurs » sous Secret Travel & Tour ? Quelle place donner à Zwald Travel Planner ?
10. Transferts partagés : les proposez-vous vraiment (l'accueil dit oui, /taxi/ dit non) ?

**Réservation et paiement**
11. Comment payent les clients pour les excursions : cash au comptoir, au guide, virement, acompte, carte ?
12. Conditions d'annulation par produit (délai, pourcentage), et ce qui se passe en cas de mauvaise mer.
13. Zones de prise en charge couvertes, et y a-t-il un supplément pour certaines plages (sud de l'île, Old Town) ?
14. Âges enfants : peut-on aligner une règle unique ? Sinon, confirmer la tranche exacte de chaque produit.

**Produits**
15. 4 Islands : heure de retour réelle (14:30 ou 15:30–16:00) ? Ponton du speedboat ? Gratuité des moins de 4 ans aussi en speedboat ? Taille maximale du groupe en join-in ? Langue du guide ? Nom du parc ?
16. Koh Rok et Phi Phi : prix des speedboats privés ?
17. Koh Talabeng & Koh Bubu : est-ce le même produit que la sortie kayak à 1 000 THB ? Prix ?
18. Songthaew island tour : programme, durée, prix ?
19. Plongée : 2 ou 3 élèves par instructeur sur la journée découverte ? SSI confirmé ?
20. Éléphants : le programme C va-t-il sur le continent (Emerald Pool, hot spring) ? Durée de trajet ?
21. Go-kart : lieu, âge ou taille minimum, sens exact de « minimum of 2 programmes » ?
22. Location : permis exigé, caution, passeport, assurance, casque, livraison à l'hôtel, carburant, durée minimum ?
23. Speedboat : tarifs par trajet (ou au moins « à partir de »), bagages autorisés ?
24. Taxi : prix d'appel par trajet et par véhicule, capacité (personnes et bagages) de chaque véhicule, modèle, point de rencontre à l'aéroport, temps d'attente en cas de retard, ferry ou pont inclus, supplément de nuit, annulation.
25. Photos réelles de chaque excursion (la même photo de longtail sert aujourd'hui 3 fois, et la photo de la grotte d'Émeraude est floue).
