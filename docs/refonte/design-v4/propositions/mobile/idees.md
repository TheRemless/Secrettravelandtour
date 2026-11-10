# Proposition « mobile » : idées

Pensée à 390 px pour un visiteur déjà sur l'île, téléphone dans une main, puis adaptée au bureau (1024 px et plus : navigation en haut, colonne de réservation collante, filtres en rail). Toutes les valeurs sont lues dans `src/_data` par `build-data.mjs`, qui écrit `data.js` (relancer `node docs/refonte/design-v4/propositions/mobile/build-data.mjs` après un changement de données). Polices : Young Serif (titres) et Onest (texte). Palette v3 conservée (vert profond, mer, brume claire), pas de crème.

| Section | Idée | Ce que ça change pour le visiteur | Coût Eleventy | Données à fournir par le client | Risque |
|---|---|---|---|---|---|
| Toutes pages, navigation | Barre d'onglets basse : Explore, Trips, My week (compteur), WhatsApp | Tout est sous le pouce, WhatsApp toujours à un geste | faible | aucune | prend 64 px d'écran ; masquée sur la fiche produit au profit de la barre de réservation |
| Toutes pages, navigation (B) | Bouton unique au pouce qui ouvre quatre grandes cases | Écran plus libre, cibles très grandes | faible | aucune | un geste de plus pour atteindre WhatsApp |
| Toutes pages | « My week » : panier de sorties sur plusieurs jours, un seul message WhatsApp classé par jour, avec hôtel et nom gardés | Le voyageur prépare sa semaine en une fois, l'agence reçoit une demande propre | moyen (JS local, localStorage) | aucune | le message peut contenir des prix « à confirmer » pour les options sans tarif |
| Toutes pages | Avertissements de disponibilité tirés des faits : saison Koh Rok (October to April), jours des cours de cuisine | Le visiteur ne demande pas un cours un dimanche | faible | jours et mois exacts pour les autres sorties (fermeture du parc du 4 Islands) | lecture de texte libre (« Monday, Wednesday… ») : un fait reformulé casse la règle |
| Accueil, hero | Photo puis panneau qui la chevauche, ruban de dates (Today, Tomorrow, 12 jours, Other date), puces de filtre avec compteurs | Le premier geste est « quel jour », pas « lire » | faible | aucune | aucun |
| Accueil, hero (B) | Lanceur au pouce : quatre cases (bateau, activités, transferts, location) dans la moitié basse | Accès direct à la bonne famille | faible | photo de location (aucune dans photos-v3) | moins d'émotion que la liste |
| Accueil, hero (C) | « Tomorrow on Koh Lanta » : cartes au doigt de ce qui tourne demain, bouton « Add to tomorrow » | Décision en deux gestes pour quelqu'un déjà sur place | faible | aucune | carrousel mobile (proscrit en v3, à trancher) |
| Accueil, sorties en bateau | Liste à vignette carrée, promesse, durée, heure de prise en charge, prix d'appel ; tap = aperçu en feuille | Comparaison à l'œil sans changer de page | faible | aucune | aucun |
| Accueil, sorties en bateau (B) | Rail de cartes qui laisse voir la suivante | Plus visuel | faible | aucune | carrousel |
| Accueil, activités | Grille de tuiles 2 colonnes (4 au bureau), aperçu en feuille | Les 7 activités tiennent sur un écran et demi | faible | aucune | aucun |
| Accueil, activités (B) | Liste façon carte de restaurant, prix en face du nom | Lecture du prix immédiate | faible | aucune | sans photo |
| Accueil, ma semaine | Bande des 7 prochains jours avec points par sortie ajoutée, liste du jour touché, lien « See what runs that day » | Rend visible l'idée « plusieurs jours, un message » | moyen | aucune | aucun |
| Accueil, ma semaine (B) | Le message WhatsApp se construit sous les yeux quand on touche des sorties | Montre exactement ce qui sera envoyé | faible | aucune | exemple figé de 4 sorties |
| Accueil, transferts | Lignes texte (minivan, speedboat, VIP Taxi Lanta, location) avec la photo du minivan | Les transferts restent des liens, pas une deuxième vitrine | faible | aucune | aucun |
| Accueil, transferts (B) | Contrôle segmenté, un bloc à la fois | Page plus courte | faible | aucune | contenu caché derrière un tap |
| Accueil, questions | Accordéon des 4 questions de home.json | Classique et rapide | faible | aucune | aucun |
| Accueil, questions (B) | Questions en bulles, la réponse s'affiche comme dans WhatsApp | Prépare au canal de réservation | faible | aucune | peut paraître gadget |
| Hub, filtres | Recherche plein texte, ruban de dates, puces (type, durée, tarif enfant, option privée, prix affiché), tri en feuille, vue liste ou photos | Trouver en 3 taps ; les sorties indisponibles ce jour passent dans « Not on … » | moyen | aucune | aucun |
| Hub, retour | L'état vit dans l'URL (?f=&d=&s=&v=&q=&c=) ; la fiche « Trips » revient à la même URL et la même position de défilement | Retour en arrière sans perdre filtres ni place | faible | aucune | aucun |
| Hub, filtres (B) | Trois questions, une par écran, avec le nombre de sorties à chaque réponse | Pour l'indécis | faible | aucune | plus lent pour qui sait ce qu'il veut |
| Hub, comparateur | Bouton « Compare » sur chaque ligne, bandeau bas, feuille de comparaison de deux sorties, interrupteur « Show only the differences » | Choisir entre Koh Rok et 4 Islands sans aller-retour | moyen | durées et prise en charge des activités (souvent absentes) | lignes « Not given » quand la donnée manque |
| Hub, comparateur (B) | Deux menus déroulants, comparaison en ligne sur la page | Pas de feuille | faible | idem | aucun |
| Hub et accueil | Aperçu rapide en feuille pour chaque sortie : photo, faits, option, date, personnes, total, « Add to my week » | Réserver sans quitter la liste | moyen | aucune | duplique une partie de la fiche |
| 4 Islands, galerie | Galerie au doigt plein écran avec compteur et points, visionneuse plein écran (clavier, flèches) ; mosaïque au bureau | Photos vues comme dans une app | faible | les photos réelles (placeholders aujourd'hui) | aucun |
| 4 Islands, galerie (B) | Mosaïque une grande et deux petites, « +3 », feuille avec toutes les photos | Moins de hauteur | faible | idem | aucun |
| 4 Islands, options | Contrôle segmenté des trois options, qui met à jour prix, îles, déroulé et comparatif | Une option = toute la page suit | moyen | aucune | aucun |
| 4 Islands, options (B) | Cartes radio empilées avec prix d'appel par option | Le prix de chaque option visible avant de choisir | faible | aucune | aucun |
| 4 Islands, calculateur | Adultes, enfants avec l'âge de chacun, supplément « Add Koh Kradan », groupe privé avec personne en plus, frais de parc en espèces calculés à part | Le total juste avant WhatsApp | moyen | tarif moins de 4 ans en speedboat ; tranche d'âge enfant (4 à 11 contre 4 à 10) | un âge sans tarif affiche [DONNÉE À FOURNIR] au lieu d'un total |
| 4 Islands, date (B) | Calendrier du mois | Pour réserver loin | faible | mois de fermeture du parc | aucun |
| 4 Islands, personnes (B) | Réglages rapides (Two of us, Family, Four friends, Just me) | Un tap au lieu de quatre | faible | aucune | âges d'exemple à corriger ensuite |
| 4 Islands, trajet et déroulé | Bande des îles de l'option choisie, déroulé vertical (heures fixes en gras, ≈ pour les autres) | Savoir où et quand | faible | horaires du speedboat étape par étape | aucun |
| 4 Islands, déroulé (B) | Règle horaire horizontale, on touche un point pour voir l'étape | Vue d'ensemble de la journée | faible | idem | points serrés le matin à 390 px |
| 4 Islands, longtail ou speedboat | Tableau à deux colonnes tiré des faits et des options, colonne de l'option choisie surlignée, photo du longtail | Répond à la première question des clients | faible | aucune | aucun |
| 4 Islands, réservation | Barre basse : total en direct, « Tomorrow, 2 adults. Change », « Book on WhatsApp » qui ouvre une feuille de relecture (hôtel, nom, message) ; au bureau, carte collante à droite | Le visiteur relit avant d'envoyer | moyen | aucune | aucun |
| 4 Islands, réservation (B) | Tiroir à tirer qui montre le détail du prix | Détail sans quitter la photo | faible | aucune | geste moins découvrable |
| 4 Islands, partage | Lien qui garde l'option, la date et les personnes (?o=&d=&a=&k=), « Send to a friend on WhatsApp », partage natif ou copie | Un ami rouvre exactement le même choix | faible | aucune | aucun |
| 4 Islands, partage (B) | Feuille de partage avec aperçu du message que l'ami reçoit | Pas de surprise sur ce qui part | faible | aucune | aucun |
| 4 Islands, autres sorties | Rail de trois sorties liées (aperçu en feuille) et lien texte vers le transfert Krabi Airport de VIP Taxi Lanta | Rebond sans quitter la page | faible | aucune | aucun |

## Mes 5 meilleures idées

1. **My week** : plusieurs sorties sur plusieurs jours, un seul message WhatsApp classé par jour. C'est l'usage réel d'un voyageur sur l'île et ça donne à l'agence une demande complète.
2. **Calculateur honnête** : prix calculé depuis les JSON, âge de chaque enfant, groupe privé, frais de parc en espèces à part, et [DONNÉE À FOURNIR] visible au lieu d'un chiffre deviné.
3. **Ruban de dates qui filtre** sur l'accueil et le hub, avec les sorties indisponibles ce jour mises à part et la raison (saison, jour de cours).
4. **Comparateur de deux sorties** avec « Show only the differences ».
5. **Retour et partage qui gardent l'état** : filtres et position du hub dans l'URL, choix de la fiche dans un lien à envoyer à un ami.

## Données manquantes repérées

- Horaires du speedboat 4 Islands étape par étape (marqué dans le déroulé).
- Tarif moins de 4 ans en speedboat 4 Islands (le calculateur affiche [DONNÉE À FOURNIR] pour un enfant de 0 à 3 ans).
- Tranche d'âge enfant du longtail : 4 à 11 (site) contre 4 à 10 (registre).
- Mois de fermeture du parc national (pour griser les dates du 4 Islands).
- Jours de fonctionnement des autres sorties si certaines ne tournent pas tous les jours.
- Âge des frais de parc « enfant » (le calcul compte tous les enfants).
- Photo pour la location (aucune dans photos-v3.json) ; photos réelles du 4 Islands (5 placeholders).
- Durée et prise en charge des activités, pour remplir le comparateur.
