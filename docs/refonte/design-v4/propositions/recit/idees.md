# Proposition « récit » : idées

Angle : la page raconte la journée en mer. Photo franche (aucun voile, aucun texte posé dessus), compositions qui changent d'une section à l'autre, une carte schématique des îles tracée depuis les contours OpenStreetMap, une couleur assumée : bleu d'Andaman `#0F2A3D`, eau peu profonde `#CDEBE4`, calcaire `#F3F5F2`, et le rose des rubans de longtail `#C8255F` réservé au trajet, à l'état choisi et aux repères. Polices : Gloock (titres, noms de lieux) et Schibsted Grotesk (texte).

Toutes les données viennent de `src/_data` par `tools/build-data.mjs` (relancer après chaque changement de données). Seules les étiquettes de durée du filtre (`short`, `half`, `full`) sont déduites des faits, avec le fait cité dans `lengthFrom`. Les contours des îles viennent d'OpenStreetMap (ODbL, mention sous chaque carte) et sont dans `tools/osm-islands.json`.

| Section | Idée | Ce que ça change pour le visiteur | Coût Eleventy | Données à fournir par le client | Risque |
|---|---|---|---|---|---|
| 4 Islands, trajet | Carte schématique collante et étapes qui défilent : le tracé rose avance, le bateau se pose sur l'île de l'étape lue, la photo de l'arrêt est sous son nom (`4-islands.html`) | Il voit où il va et dans quel ordre, avant de lire les prix | moyen (une partielle SVG, 80 lignes de JS) | Photo de Koh Ma, du speedboat ; horaires du speedboat | Carte prise pour une carte marine : la mention « Sketch map, not for navigation » doit rester |
| 4 Islands, trajet | Bascule Longtail / Speedboat qui redessine la route (Koh Ma ou Koh Kradan, déjeuner à Koh Ngai ou Koh Kradan) | La différence entre les deux bateaux se voit sur la carte | faible une fois la carte faite | Horaires et ponton du speedboat (les données se contredisent : « a separate pier » contre « Lanta Old Town pier ») | Afficher le speedboat sans horaires tant qu'ils manquent |
| 4 Islands, prix | Demande en une page : option, 14 prochains jours (heure de Bangkok), adultes, âge de chaque enfant, hôtel, prénom ; total calculé depuis les lignes de prix, liquide du parc à part, supplément Koh Kradan sur le privé ; message WhatsApp relu dans une feuille | Il connaît le total avant d'écrire, le comptoir reçoit une demande complète avec une référence | moyen (reprend `booking.js`, ajoute le total) | Les enfants comptent-ils dans le groupe du longtail privé ? Moins de 4 ans en speedboat ? | Un total affiché engage : écrire « Total on the website » et garder le prix publié comme référence |
| 4 Islands, comparatif | Longtail ou speedboat en colonnes, avec la mini-carte de chaque route et les cases manquantes signalées | Un choix en dix secondes | faible | Photo du speedboat, speedboat privé (prix ?) | Aucun |
| 4 Islands, hero | Faits en 4 cases à filet épais (durée, prise en charge, départ, retour ≈) et photo de la grotte qui sort à droite jusqu'au bord | Les quatre horaires utiles sont lus avant le défilement | faible | Vraie photo de la grotte d'Émeraude | Le placeholder actuel est une photo Wikimedia |
| Accueil, hero | Photo pleine largeur sans rien dessus, légende factuelle (« Koh Ngai. The 4 Islands longtail stops here for a Thai buffet lunch on the beach ») | La photo est montrée telle quelle, la légende dit ce qu'on voit | faible | Photo réelle de Koh Ngai | Légende à tenir vraie si la photo change |
| Accueil, la journée | Règle horaire 07:45 → 16:00 du 4 Islands : route en noir, mer en rose, arrêts placés au prorata de l'heure ; liste verticale sur mobile | La journée tient en une ligne, l'envie vient du concret | faible | Rien | Aucun |
| Accueil, sorties en bateau | Double page : 4 Islands en grand, Koh Rok et Phi Phi décalés, les trois demi-journées en lignes | Hiérarchie claire au lieu de trois cartes identiques | faible | Rien | Ordre éditorial à valider |
| Accueil, activités | Planche contact : chaque photo garde un format proche de l'original (portrait, carré, paysage) | La grille respire, aucune photo n'est mal recadrée | faible | Photos HD de l'éléphant, de l'ATV, du batik (800 px aujourd'hui) | Rangées irrégulières à surveiller quand les photos changeront |
| Accueil, réservation | Le message WhatsApp lui-même, construit en direct par la même fonction que la page produit | Il voit ce qu'il va envoyer avant de cliquer | faible | Rien | Aucun |
| Accueil, trouver sa sortie | Deux questions (temps, eau ou terre) qui filtrent les 13 sorties | Réponse immédiate pour qui hésite | faible | Rien | Classement « eau » déduit (bateaux, kayak, plongée) |
| Hub | Trois vues sur les mêmes filtres : Collection (rythme grande, paire, trio), Carte (lieux de chaque sortie, clic sur un point ou une ligne), Liste (tableau triable par prix, `aria-sort`) | Chacun choisit sa façon de comparer ; la carte répond à « c'est où ? » | moyen | Rien | La carte ne place que les lieux écrits dans les données (rien pour éléphants, cuisine, ATV, go-kart) |
| Hub | Filtres Type et Temps, tri par prix, compteur vivant, `#boat` et `#activity` préfiltrent depuis le menu | Moins de défilement | faible | Rien | Aucun |
| Variantes, accueil hero B | Mosaïque de trois formats, le titre dans le blanc | Variante plus « magazine » | faible | Rien | Trois photos dès le haut, plus lourd |
| Variantes, accueil hero C | Index des lieux en grande typo, chaque nom ouvre la photo, la sortie et le prix | Entrée par le lieu, pas par le produit | faible | Rien | Moins lisible pour qui ne connaît aucun nom |
| Variantes, journée B | Bande de photos dont la largeur est le temps passé à chaque arrêt | Le rythme de la journée se voit sans lire | faible | Photo de Koh Ma | Un arrêt sans photo casse la bande |
| Variantes, sorties B | Carte des sorties d'abord, liste à côté | Pour un public qui pense en lieux | moyen | Rien | Doublon avec la vue Carte du hub |
| Variantes, activités B | Index en lignes sans photo | Comparaison rapide des prix | faible | Rien | Moins d'envie |
| Variantes, réservation B | Trois phrases en ligne | Version courte | faible | Rien | Aucun |
| Variantes, trouver B | Une seule question, trois grands boutons | Plus rapide sur mobile | faible | Rien | Aucun |
| Variantes, transferts B | Quatre colonnes de texte | Sans photo de minivan | faible | Rien | Aucun |
| Variantes, 4 Islands hero B | La carte du trajet en hero | Le récit commence tout de suite | faible | Rien | Pas de photo au premier écran |
| Variantes, 4 Islands hero C | Le titre est la liste des îles avec l'heure | Typographie expressive, données pures | faible | Rien | Moins de photo |
| Variantes, trajet B | Curseur horaire : on glisse de 07:45 à 16:00, le bateau avance, la page dit « After Koh Mook, before Koh Ngai at ≈ 12:00 » | Jeu simple et vrai, interpolé entre les heures publiées | moyen | Rien | Position entre deux arrêts approximative (dit à l'écran) |
| Variantes, trajet C | Frise défilante, une carte par arrêt, boutons précédent et suivant | Plus compacte que le défilement long | faible | Rien | Défilement horizontal interne (limité au bloc) |
| Variantes, comparatif B | Seulement ce qui change, en grand | Le choix en trois lignes | faible | Rien | Aucun |
| Variantes, prix B | Tableau complet des prix et devis rapide | Pour qui veut juste le tableau | faible | Rien | Aucun |
| Variantes, inclus B | Calculateur du liquide pour le parc (tarif Thaïlandais compris) | Il sait combien prendre en espèces | faible | Rien | Aucun |
| Variantes, questions B | Questions et réponses ouvertes sur deux colonnes | Tout se lit sans clic | faible | Rien | Page plus longue |
| Variantes, autres sorties B | En lignes avec le prix | Plus sobre | faible | Rien | Aucun |
| Variantes, hub en-tête B | Phrase-filtre « Show me the boat trips that take a full day » | Filtre lisible comme une phrase | faible | Rien | Moins découvrable que des puces |
| Variantes, hub collection B | Rangée par durée (quelques heures, demi-journée, journée) | Choix par le temps disponible | faible | Rien | Une sortie peut apparaître deux fois (deux durées) |
| Variantes, hub fin B | Le message « Not sure which one? » se compose dans la page (dates, qui vient, hôtel) | Une demande ouverte mais exploitable | faible | Rien | Aucun |

## Ce qui manque (affiché `[DONNÉE À FOURNIR]` ou `[PHOTO À FOURNIR]` dans les pages)

- Horaires du speedboat 4 Islands et nom de son ponton (déroulé : « a separate pier », option : « Lanta Old Town pier »).
- Moins de 4 ans en speedboat : gratuit aussi ?
- Speedboat privé pour le 4 Islands : proposé, à quel prix ?
- Longtail privé : les enfants comptent-ils dans le groupe (1 à 2, 3 à 4, personne en plus) ?
- Photos : Koh Ma, le speedboat du 4 Islands, la location (aucune photo déclarée dans `photos-v3.json`). Les photos de l'accueil (hero, transferts, bande finale), du hub et de la galerie 4 Islands sont encore des placeholders Wikimedia.
- Prix du Koh Talabeng & Koh Bubu (affiché « Price on WhatsApp »).

## Mes 5 meilleures idées

1. La carte collante du 4 Islands qui suit la lecture, avec la bascule Longtail / Speedboat qui redessine la route.
2. La demande en une page avec le total calculé depuis les données, le liquide du parc à part et le message relu avant envoi.
3. La règle horaire de la journée sur l'accueil (et sa variante en bande de photos au prorata du temps).
4. Le hub à trois vues (Collection, Carte, Liste triable) sur les mêmes filtres.
5. Le curseur horaire qui déplace le bateau (variante trajet B).
