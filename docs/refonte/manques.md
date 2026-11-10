# Informations manquantes

Fichier généré par `scripts/manques.mjs` à chaque `npm run build`, à partir des `TODO(client)` de `src/_data/site.json` et `src/_data/products/`. Ne pas le modifier à la main : corriger la donnée source, puis relancer le build.

13 points sur 7 pages. Une information absente n'est pas affichée sur le site (00-BRIEF §9).

| Page | Points |
|---|---|
| Commun aux deux marques | 4 |
| 4 Islands (/tours/4-islands/) | 2 |
| Koh Rok & Koh Haa (/tours/koh-rok-koh-haa/) | 1 |
| Electric go-kart (/tours/go-kart/) | 2 |
| Minivan transfers, private or shared (/transfers/) | 2 |
| Speedboat and ferry (/tours/speedboat/) | 1 |
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

- tranche d'âge enfant du longtail : « Child, 4 to 11 » (prix du site) contre « 4 à 10 ans » (registre de faits, brochure du partenaire longtail).
- speedboat privé pour le 4 Islands (cité par le registre de faits, 9:00 à 16:00, absent du site) : à proposer, prix sur WhatsApp ?

### Koh Rok & Koh Haa (/tours/koh-rok-koh-haa/)

Source : `src/_data/products/tours/koh-rok-koh-haa.json`

- Koh Rok avec coucher de soleil : jours de départ, prix enfant et âges (l'affiche ne donne que 2 500 THB par personne), ponton.

### Electric go-kart (/tours/go-kart/)

Source : `src/_data/products/activities/go-kart.json`

- âge ou taille minimum pour conduire (et pour le siège passager des karts doubles).
- sens de « The price list is for a minimum of 2 programmes » (intro et priceNote) : deux sessions minimum, deux karts, deux personnes ?

### Minivan transfers, private or shared (/transfers/)

Source : `src/_data/products/secret-transfers/shared-minivan.json`

- transferts partagés : trajets desservis, jours et horaires de départ, point de prise en charge (aucun détail sur le site, seule réponse : « Oui on peut le faire »).
- qui assure le minivan partagé (VIP Taxi Lanta est présenté comme « private only, no sharing ») ?

### Speedboat and ferry (/tours/speedboat/)

Source : `src/_data/products/secret-transfers/speedboat-ferry.json`

- tarifs des billets par trajet, au moins « à partir de » (aucun tarif sur le site actuel ; en attendant : « Price on WhatsApp »).

## VIP Taxi Lanta

### Long-distance private transfers (/taxi/southern-thailand/)

Source : `src/_data/products/taxi/southern-thailand.json`

- durée du trajet Krabi Airport → Khao Lak (aucune source, durée non affichée sur la page actuelle).
