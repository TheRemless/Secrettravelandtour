# Informations manquantes

Fichier généré par `scripts/manques.mjs` à chaque `npm run build`, à partir des `TODO(client)` de `src/_data/site.json` et `src/_data/products/`. Ne pas le modifier à la main : corriger la donnée source, puis relancer le build.

28 points sur 11 pages. Une information absente n'est pas affichée sur le site (00-BRIEF §9).

| Page | Points |
|---|---|
| Commun aux deux marques | 4 |
| 4 Islands (/tours/4-islands/) | 7 |
| Fishing trip (/tours/fishing-trip/) | 2 |
| Koh Rok & Koh Haa (/tours/koh-rok-koh-haa/) | 3 |
| Mangroves (/tours/mangroves/) | 1 |
| Electric go-kart (/tours/go-kart/) | 4 |
| Kayaking (/tours/kayak/) | 1 |
| Car and scooter rental (/tours/rental/) | 1 |
| Minivan transfers, private or shared (/transfers/) | 2 |
| Speedboat and ferry (/tours/speedboat/) | 2 |
| Long-distance private transfers (/taxi/southern-thailand/) | 1 |

## Commun

### Commun aux deux marques

Source : `src/_data/site.json`

- langues parlées : retirées du site le 03.11.2026 à la demande de Jérémy, en attente des vraies informations. Rien ne s'affiche tant que languages est null. Le délai de réponse est rempli depuis le 08.11.2026 (réponse du client : le plus vite possible, en général moins de 6 heures, heure de Thaïlande).
- avis Google de Secret Travel & Tour : aucun pour l'instant, à reprendre (note, nombre, date de lecture) dès qu'ils arrivent.
- adresse et coordonnées de la fiche Google de VIP Taxi Lanta (aujourd'hui seulement « Koh Lanta, Krabi, Thailand ») : à afficher ou à masquer ?
- durées de trajet VIP relevées sur des guides de transport (12go, goasia, geckoroutes, amazinglanta) le 30.10.2026 : à remplacer par les chiffres de Mr. Brown.

## Secret Travel & Tour

### 4 Islands (/tours/4-islands/)

Source : `src/_data/products/tours/4-islands.json`

- nombre maximum de personnes par bateau en join-in.
- langue du guide du longtail (le speedboat join-in a un guide anglophone, brochure des sorties en speedboat).
- nom du parc national (jamais nommé sur la page ; la fiche Koh Rok dit « Mu Ko Lanta National Park »).
- tranche d'âge enfant du longtail : « Child, 4 to 11 » (prix du site) contre « 4 à 10 ans » (registre de faits, brochure du partenaire longtail).
- îles au programme : l'accueil dit « Koh Ma, Koh Mook and Koh Chueak, plus Koh Kradan or Koh Ngai: your choice » (secret.json tours[0].description), la page dit Koh Ngai toujours, puis Koh Ma (longtail) ou Koh Kradan (speedboat), sans choix du client.
- speedboat privé pour le 4 Islands (cité par le registre de faits, 9:00 à 16:00, absent du site) : à proposer, prix sur WhatsApp ?
- catamaran au départ d'Ao Nang : frais de parc national inclus ou non (la brochure n'en dit rien), nom du ponton d'Ao Nang.

### Fishing trip (/tours/fishing-trip/)

Source : `src/_data/products/tours/fishing-trip.json`

- bateau de la pêche : l'accueil dit « A fishing trip on a longtail off the coast » (secret.json description) mais affiche « Raft from 3,900 THB » (secret.json info) ; la page vend le radeau et donne le longtail sans prix. Prix et horaires du longtail ?
- sur le longtail, mange-t-on sa pêche ? (FAQ actuelle : « On the longtail, ask us. »)

### Koh Rok & Koh Haa (/tours/koh-rok-koh-haa/)

Source : `src/_data/products/tours/koh-rok-koh-haa.json`

- Koh Rok en longtail privé, tranches « 7 to 8 people » (8 400 THB) et « 9 to 10 people » (9 400 THB) : déduites de la brochure selon le registre de faits, à confirmer.
- version avec arrêt coucher de soleil : le site dit « exists on some days. Ask us », le registre de faits dit 10:00 à 19:00. Jours, programme et prix ?
- catamaran au départ d'Ao Nang : frais de parc national inclus ou non (la brochure n'en dit rien), nom du ponton d'Ao Nang.

### Mangroves (/tours/mangroves/)

Source : `src/_data/products/tours/mangroves.json`

- l'accueil dit « Through the mangroves by longtail, gondola or kayak » (secret.json activities mangroves.description) ; la page parle d'un radeau en bois (« wooden raft »), jamais de gondole. Quel mot ?

### Electric go-kart (/tours/go-kart/)

Source : `src/_data/products/activities/go-kart.json`

- lieu de la piste de kart.
- âge ou taille minimum pour conduire (et pour le siège passager des karts doubles).
- sens de « The price list is for a minimum of 2 programmes » (intro et priceNote) : deux sessions minimum, deux karts, deux personnes ?
- l'unité du prix est-elle bien par kart (et non par personne) pour les karts doubles ?

### Kayaking (/tours/kayak/)

Source : `src/_data/products/activities/kayak.json`

- orthographe de l'île : « Koh Aung » (sortie à la journée) et « Koh Ung » (demi-journée) dans la même liste. Même île ?

### Car and scooter rental (/tours/rental/)

Source : `src/_data/products/rental.json`

- Honda ADV 350, Honda Forza 350 et Yamaha X-MAX 300 : la fiche du loueur porte « 300 cc MT », « 350 cc MT » et « 300 cc MT » (boîte manuelle sur des scooters automatiques, 300 cc pour l'ADV 350). Cylindrée et boîte non affichées tant que le loueur ne confirme pas.

### Minivan transfers, private or shared (/transfers/)

Source : `src/_data/products/secret-transfers/shared-minivan.json`

- transferts partagés : trajets desservis, jours et horaires de départ, point de prise en charge (aucun détail sur le site, seule réponse : « Oui on peut le faire »).
- qui assure le minivan partagé (VIP Taxi Lanta est présenté comme « private only, no sharing ») ?

### Speedboat and ferry (/tours/speedboat/)

Source : `src/_data/products/secret-transfers/speedboat-ferry.json`

- tarifs des billets par trajet, au moins « à partir de » (aucun tarif sur le site actuel ; en attendant : « Price on WhatsApp »).
- bagages autorisés sur le speedboat.

## VIP Taxi Lanta

### Long-distance private transfers (/taxi/southern-thailand/)

Source : `src/_data/products/taxi/southern-thailand.json`

- durée du trajet Krabi Airport → Khao Lak (aucune source, durée non affichée sur la page actuelle).
