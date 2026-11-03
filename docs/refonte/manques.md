# Informations manquantes

Fichier généré par `scripts/manques.mjs` à chaque `npm run build`, à partir des `TODO(client)` de `src/_data/site.json` et `src/_data/products/`. Ne pas le modifier à la main : corriger la donnée source, puis relancer le build.

51 points sur 17 pages. Une information absente n'est pas affichée sur le site (00-BRIEF §9).

| Page | Points |
|---|---|
| Commun aux deux marques | 7 |
| 4 Islands (/tours/4-islands/) | 10 |
| Fishing trip (/tours/fishing-trip/) | 2 |
| Koh Phi Phi (/tours/koh-phi-phi/) | 1 |
| Koh Rok & Koh Haa (/tours/koh-rok-koh-haa/) | 3 |
| Koh Talabeng & Koh Bubu (/tours/koh-talabeng-koh-bubu/) | 3 |
| Mangroves (/tours/mangroves/) | 3 |
| ATV (quad bike) (/tours/atv/) | 1 |
| Thai cooking class (/tours/cooking-class/) | 1 |
| Elephant sanctuary (/tours/elephant-sanctuary/) | 2 |
| Electric go-kart (/tours/go-kart/) | 4 |
| Kayaking (/tours/kayak/) | 2 |
| Scuba diving (/tours/scuba-diving/) | 2 |
| Car and scooter rental (/tours/rental/) | 2 |
| Minivan transfers, private or shared (/transfers/) | 2 |
| Speedboat and ferry (/tours/speedboat/) | 5 |
| Long-distance private transfers (/taxi/southern-thailand/) | 1 |

## Commun

### Commun aux deux marques

Source : `src/_data/site.json`

- délai de réponse sur WhatsApp et langues parlées : retirés du site le 03.11.2026 à la demande de Jérémy, en attente des vraies informations. Rien ne s'affiche tant que replyTime et languages sont null.
- numéro de licence TAT et société titulaire (annoncé « dans les prochains jours »).
- avis Google de Secret Travel & Tour : aucun pour l'instant, à reprendre (note, nombre, date de lecture) dès qu'ils arrivent.
- « Guide and insurance » / « Insurance » dans les inclusions (4 Islands, Koh Rok, Phi Phi, kayak, éléphants) : le client répond que chaque prestataire a ses propres conditions d'assurance. Garder le mot « insurance » ou le retirer ?
- paiement des transferts VIP : le site taxi dit « Cash to the driver on the day. No prepayment. » ; réponse générale du client (Q13) : cash ou virement. Le virement vaut-il aussi pour VIP Taxi Lanta ?
- adresse et coordonnées de la fiche Google de VIP Taxi Lanta (aujourd'hui seulement « Koh Lanta, Krabi, Thailand ») : à afficher ou à masquer ?
- durées de trajet VIP relevées sur des guides de transport (12go, goasia, geckoroutes, amazinglanta) le 30.10.2026 : à remplacer par les chiffres de Mr. Brown.

## Secret Travel & Tour

### 4 Islands (/tours/4-islands/)

Source : `src/_data/products/tours/4-islands.json`

- heure de retour du longtail, trois valeurs : « Back on Koh Lanta between 15:30 and 16:00 » (secretPagesContent day[6]), « The return is usually between 14:30 and 16:00 » (goodToKnow[2]), « retour entre 14h30 et 15h30 » (registre de faits, brochure du partenaire).
- nom ou emplacement du ponton du speedboat (le site dit seulement « a separate pier for the speedboat »).
- horaires du speedboat : le déroulé publié est celui du longtail, le registre de faits donne 08:00 à 16:00 pour le speedboat sans étapes horaires.
- nombre maximum de personnes par bateau en join-in.
- langue du guide.
- nom du parc national (jamais nommé sur la page ; la fiche Koh Rok dit « Mu Ko Lanta National Park »).
- moins de 4 ans gratuits aussi en speedboat ? Le site ne le dit que pour le longtail.
- tranche d'âge enfant du longtail : « Child, 4 to 11 » (prix du site) contre « 4 à 10 ans » (registre de faits, brochure du partenaire longtail).
- îles au programme : l'accueil dit « Koh Ma, Koh Mook and Koh Chueak, plus Koh Kradan or Koh Ngai: your choice » (secret.json tours[0].description), la page dit Koh Ngai toujours, puis Koh Ma (longtail) ou Koh Kradan (speedboat), sans choix du client.
- speedboat privé pour le 4 Islands (cité par le registre de faits, 9:00 à 16:00, absent du site) : à proposer, prix sur WhatsApp ?

### Fishing trip (/tours/fishing-trip/)

Source : `src/_data/products/tours/fishing-trip.json`

- bateau de la pêche : l'accueil dit « A fishing trip on a longtail off the coast » (secret.json description) mais affiche « Raft from 3,900 THB » (secret.json info) ; la page vend le radeau et donne le longtail sans prix. Prix et horaires du longtail ?
- sur le longtail, mange-t-on sa pêche ? (FAQ actuelle : « On the longtail, ask us. »)

### Koh Phi Phi (/tours/koh-phi-phi/)

Source : `src/_data/products/tours/koh-phi-phi.json`

- moins de 4 ans : gratuit ? (aucun tarif publié pour les moins de 4 ans).

### Koh Rok & Koh Haa (/tours/koh-rok-koh-haa/)

Source : `src/_data/products/tours/koh-rok-koh-haa.json`

- Koh Rok en longtail privé, tranches « 7 to 8 people » (8 400 THB) et « 9 to 10 people » (9 400 THB) : déduites de la brochure selon le registre de faits, à confirmer.
- version avec arrêt coucher de soleil : le site dit « exists on some days. Ask us », le registre de faits dit 10:00 à 19:00. Jours, programme et prix ?
- moins de 4 ans en speedboat : gratuit ? (aucun tarif publié).

### Koh Talabeng & Koh Bubu (/tours/koh-talabeng-koh-bubu/)

Source : `src/_data/products/tours/koh-talabeng-koh-bubu.json`

- prix de Koh Talabeng & Koh Bubu : la page dit « Ask us for a price » ; la page kayak vend Koh Talabeng à 1 000 THB adulte / 700 enfant (« Sea cave kayaking and mangrove, half day », avec Koh Ung) et à 1 300 / 900 avec le déjeuner sur Koh Bubu (« Sea cave kayaking and island hopping, 1 day »). Même produit que l'une de ces sorties ?
- tranches d'âge enfant (aucune sur la page).
- horaires de la demi-journée (aucun sur la page).

### Mangroves (/tours/mangroves/)

Source : `src/_data/products/tours/mangroves.json`

- âges enfant sur la même page : « Child 3 to 9 » (radeaux privés) et « Child, 4 to 11 » (longtail et kayak). Les deux tranches sont-elles justes, chacune pour sa formule ?
- l'accueil dit « Through the mangroves by longtail, gondola or kayak » (secret.json activities mangroves.description) ; la page parle d'un radeau en bois (« wooden raft »), jamais de gondole. Quel mot ?
- horaires des demi-journées en longtail et en kayak (la page ne donne que ceux des radeaux).

### ATV (quad bike) (/tours/atv/)

Source : `src/_data/products/activities/atv.json`

- annulation du quad (« Cancel at least 24 hours ahead. Later than that, half the ride is charged. ») : toujours valable ? Réponse générale du client : pas de conditions d'annulation fixes.

### Thai cooking class (/tours/cooking-class/)

Source : `src/_data/products/activities/cooking-class.json`

- cours du soir (mardi, jeudi, vendredi, 16:00–21:00) : même contenu que le matin, marché compris ? La FAQ dit le marché seulement « in the morning class ».

### Elephant sanctuary (/tours/elephant-sanctuary/)

Source : `src/_data/products/activities/elephant-sanctuary.json`

- programme C : la page dit « The sanctuary is on Koh Lanta » mais le C inclut l'Emerald Pool et la hot spring waterfall, situées à Khlong Thom sur le continent selon l'audit [à vérifier]. Lieu et temps de trajet du C ?
- programme C « Two people per session at most » : maximum de deux personnes par session, ou par réservation ?

### Electric go-kart (/tours/go-kart/)

Source : `src/_data/products/activities/go-kart.json`

- lieu de la piste de kart.
- âge ou taille minimum pour conduire (et pour le siège passager des karts doubles).
- sens de « The price list is for a minimum of 2 programmes » (intro et priceNote) : deux sessions minimum, deux karts, deux personnes ?
- l'unité du prix est-elle bien par kart (et non par personne) pour les karts doubles ?

### Kayaking (/tours/kayak/)

Source : `src/_data/products/activities/kayak.json`

- orthographe de l'île : « Koh Aung » (sortie à la journée) et « Koh Ung » (demi-journée) dans la même liste. Même île ?
- horaires de chaque sortie (la page donne des créneaux généraux, et deux horaires seulement pour les journées).

### Scuba diving (/tours/scuba-diving/)

Source : `src/_data/products/activities/scuba-diving.json`

- élèves par moniteur sur la journée découverte : « never more than two students per instructor » (intro) contre « two or three students at most on the one-day dives » (included) ; le registre de faits dit 2.
- agence de certification SSI (citée seulement dans l'ancienne meta description) : à confirmer avant de l'afficher.

### Car and scooter rental (/tours/rental/)

Source : `src/_data/products/rental.json`

- conditions de location : permis exigé, caution, passeport, assurance, casque, livraison à l'hôtel, carburant, durée minimum (réponse : « ça se discute sur WhatsApp, en général la même chose partout »).
- les tarifs sont-ils bien par jour ? (« per day » déduit selon le registre de faits, à confirmer).

### Minivan transfers, private or shared (/transfers/)

Source : `src/_data/products/secret-transfers/shared-minivan.json`

- transferts partagés : trajets desservis, jours et horaires de départ, point de prise en charge (aucun détail sur le site, seule réponse : « Oui on peut le faire »).
- qui assure le minivan partagé (VIP Taxi Lanta est présenté comme « private only, no sharing ») ?

### Speedboat and ferry (/tours/speedboat/)

Source : `src/_data/products/secret-transfers/speedboat-ferry.json`

- tarifs des billets par trajet, au moins « à partir de » (aucun tarif sur le site actuel ; en attendant : « Price on WhatsApp »).
- quels départs circulent toute l'année et lesquels du 15 octobre au 30 avril ? (le site dit seulement « Some departures run all year, others from 15 October to 30 April »).
- ferry : la page s'appelle « Speedboat and ferry » mais ne cite aucun ferry. Trajets et horaires des ferries vendus ?
- bagages autorisés sur le speedboat.
- âges enfant et tarif enfant sur les billets.

## VIP Taxi Lanta

### Long-distance private transfers (/taxi/southern-thailand/)

Source : `src/_data/products/taxi/southern-thailand.json`

- durée du trajet Krabi Airport → Khao Lak (aucune source, durée non affichée sur la page actuelle).
