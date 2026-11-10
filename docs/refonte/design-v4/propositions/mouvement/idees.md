# Proposition « mouvement »

Angle : la sensation. Chaque mouvement a une cause (un clic, un geste, le défilement) et montre ce qui a changé. Aucune animation d'apparition au chargement ni sur les blocs. Palette et polices de la v3 gardées (famille ZTP que le client aime), le travail porte sur le comportement.

Fichiers : `home.html`, `4-islands.html`, `tours.html`, `variantes.html` (15 variantes, toutes fonctionnelles), `mouvement.css`, `mouvement.js`, `reserve.js`, `data.js`. `data.js` est généré par `_build/data.mjs` depuis `src/_data` (produits, photos-v3, site, home, taxi, rental). Aucun prix, horaire ni lieu tapé à la main.

Vérifications faites (scripts dans `_build/`) : captures 1440 et 390 dans `shots/`, captures d'états interactifs `shots/etat-*.png`, gestes testés (`gestures.mjs` : glisser, double-clic zoom, tirer pour fermer, lancer la feuille), transition entre pages vérifiée (`vt.mjs`), mouvement réduit (`reduce.mjs`), décalages et longues images au défilement (`cls.mjs` : CLS 0,0000 et aucune image de plus de 50 ms sur les trois pages, bureau et mobile).

## Idées

Poids = gzip ajouté. CPU = coût au moment où l'effet tourne, mesuré ou estimé sur un téléphone moyen.

| Section | Idée | Ce que ça change pour le visiteur | Coût Eleventy | Données à fournir | Risque, poids et CPU |
|---|---|---|---|---|---|
| Toutes | Transition entre pages : la photo de la carte cliquée grandit jusqu'au hero du produit (View Transitions entre documents, `pageswap` pose le nom sur la carte cliquée) | Il voit où il va, la page produit « sort » de la carte au lieu de clignoter | Faible (CSS `@view-transition` + 30 lignes JS, `<link rel="expect" blocking="render">`) | Aucune | 0,6 Ko. CPU nul hors transition, 460 ms sur le compositeur. Chrome, Edge, Safari 18.2+ ; Firefox navigue normalement. Le `blocking="render"` doit viser un élément proche du hero sinon il retarde le LCP |
| Toutes | Préchargement à l'intention : survol de 80 ms ou premier contact du doigt ajoute `rel=prefetch`, plus Speculation Rules `moderate` | Pages produit quasi instantanées au clic | Faible | Aucune | 0,4 Ko. Coût réseau : une page HTML par survol réel (pas les images). Rien sur données mobiles si on ajoute `navigator.connection.saveData` |
| Toutes | En-tête qui se compacte au scroll (CSS `animation-timeline: scroll()`, logo à 86 %, filet qui apparaît) et se cache en descendant, revient au moindre retour vers le haut | Plus d'écran pour lire, la navigation revient dès qu'on la cherche | Faible | Aucune | 0,5 Ko. CSS sur le compositeur ; le masquage est un écouteur passif avec rAF, seuils 24 px et 8 px contre le clignotement |
| Toutes | Recherche instantanée ⌘K, « / » ou loupe : cherche dans les noms, les faits et les options (« Maya » trouve Koh Phi Phi, « Krabi Airport » le transfert) | Le voyageur qui connaît un lieu trouve la sortie et son prix sans connaître nos noms de produits | Moyen (index JSON généré au build) | Aucune | 2,5 Ko + index (environ 6 Ko gzip si on ne garde que noms, faits et options). Filtre < 1 ms sur 25 entrées |
| Toutes | Photos : vignette floue de 24 px (LQIP) et couleur dominante tout de suite, vraie photo en fondu de 320 ms quand elle est décodée ; jamais sur la photo du hero | Plus de cases vides pendant le chargement sur la 4G de l'île | Faible (sharp au build, déjà dans le dépôt) | Aucune | 400 octets par photo dans le HTML. Le hero n'a pas de fondu pour ne pas retarder le LCP |
| Toutes | Retour au toucher : `scale(.97)` en 60 ms sur boutons et cartes, `touch-action: manipulation` | Le doigt sent que le tap est pris, sans délai de 300 ms | Faible | Aucune | Négligeable |
| Accueil, hero | Trois sorties au choix (4 Islands, Koh Rok, Phi Phi) : la photo, la légende et le bouton suivent le choix, la pastille de sélection glisse avec un ressort | Le hero montre ce qu'on vend et son prix dès la première seconde, et répond au doigt | Faible | Aucune | Trois photos dans le hero (la 1re en priorité, les deux autres en différé) : prévoir des tailles 800 et 1600 px. Fondu d'opacité seulement |
| Accueil, hero, B | Bande des six sorties à faire glisser, la carte centrale nette, les voisines reculent (`view(inline)`) | Feuilleter comme sur une app | Faible | Aucune | CSS seul. Six photos au-dessus de la ligne de flottaison sur bureau |
| Accueil, hero, C | La recherche en vedette avec suggestions (Emerald Cave, Maya Bay…) | Point d'entrée par le lieu plutôt que par le produit | Moyen | Aucune | Même moteur que ⌘K |
| Accueil, sorties en bateau, B | Liste dont la photo suit la souris avec un ressort ; vignettes fixes au doigt | Lecture rapide des noms et prix, image à la demande | Faible | Aucune | rAF actif seulement pendant le mouvement, arrêté à l'arrêt |
| Accueil, activités | Rail horizontal avec barre de progression pilotée par le scroll, flèches, glisser-lancer à la souris | Sept activités sans allonger la page | Faible | Aucune | CSS `scroll-timeline` pour la barre, JS seulement pour la souris |
| Accueil, activités, B | Filtre « On the water / On land » avec réagencement animé | On voit quelles cartes restent | Faible | Valider le classement eau ou terre (kayak et plongée sur l'eau, le reste à terre, déduit du type) | View Transitions même document, 420 ms |
| Accueil, transferts | Chercheur de trajet De / Vers, bouton d'inversion qui fait se croiser les deux champs, résultat avec durée et lien vers la page /taxi/ | Le voyageur tape son aéroport et a la durée et la bonne page en un geste | Faible | Durées de Mr. Brown (TODO déjà ouvert) | 1 Ko. Animations WAAPI de 360 ms |
| Accueil, transferts, B | Durées de route côte à côte en barres (pleine jusqu'à la durée basse, pointillés jusqu'à la haute) | Comparer d'un coup d'œil Krabi et Phuket | Faible | Idem | Aucun JS d'animation |
| Accueil, location | Scooters / Big bikes / Cars : la fourchette de prix roule jusqu'aux nouveaux chiffres, le bouton WhatsApp change d'objet | La réponse au clic est visible et lisible | Faible | Aucune | Compteur à rouleaux 1 Ko, transform seulement |
| Accueil, comment on réserve | Le message WhatsApp s'écrit ligne à ligne au rythme du défilement (CSS `view()` + `clip-path`) | Il comprend ce qu'il va envoyer avant d'avoir choisi | Faible | Aucune | `clip-path` se repeint (pas composité) : 9 lignes, coût faible. Coupé en mouvement réduit |
| Accueil, comment on réserve, B | Essayer en direct : chaque champ changé surligne la ligne du message modifiée | Apprendre en faisant | Faible | Aucune | Négligeable |
| 4 Islands, galerie | Visionneuse : la vignette grandit en plein écran, glisser pour changer avec élasticité aux bords, pincer ou double-toucher pour zoomer au point touché, tirer vers le bas pour fermer (le fond s'éclaircit avec le doigt), flèches et Échap | Les gestes d'une app photo, sans bibliothèque | Moyen | Vraies photos 4 Islands (déjà listées dans photos-v3) | 3,5 Ko. Tout en transform. Les photos pleine taille ne se chargent qu'à l'ouverture si on passe en `srcset` |
| 4 Islands, galerie, B | Bande défilante, la photo glisse dans son cadre (parallaxe interne au scroll horizontal) | Plus vivant qu'une grille, sans geste à apprendre | Faible | Aucune | CSS seul, image 20 % plus large que le cadre |
| 4 Islands, longtail ou speedboat | Le parcours se réorganise quand on change de bateau : Koh Ma sort, Koh Kradan entre, l'étiquette Lunch glisse de Koh Ngai à Koh Kradan ; « Add Koh Kradan » sur le privé insère l'île | La différence entre les options se voit au lieu de se lire | Faible | Photo du speedboat join-in, horaires du speedboat | Noms de transition posés seulement pendant le changement (sinon ils s'animeraient à l'arrivée sur la page). 420 ms |
| 4 Islands, longtail ou speedboat, B | Tableau à colonnes : la colonne choisie s'éclaire, l'autre s'estompe | Comparaison classique, lisible | Faible | Aucune | Négligeable |
| 4 Islands, prix | Calculateur collant à côté du parcours : adultes, enfants avec âge, total qui roule, lignes du calcul, frais de parc en espèces ; même état que la feuille de réservation et la bande du bas | Le prix réel avant d'écrire, et il ne ressaisit rien | Moyen | Les enfants comptent-ils dans la taille du groupe du bateau privé ? Prix d'un enfant de moins de 4 ans en speedboat | 2 Ko. Recalcul instantané |
| 4 Islands, journée | Ligne qui se remplit au défilement, chaque étape s'allume quand elle passe au milieu de l'écran, le bateau reste au centre (`position: sticky`, zéro JS) | On suit la journée en la lisant, heures fixes en gras, ≈ pour les autres | Faible | Horaires du speedboat | CSS seul, `scaleY` composité |
| 4 Islands, journée, B | Curseur de 07:45 à 16:00 qui affiche l'étape de l'heure choisie | Répondre à « où serons-nous à midi ? » | Faible | Idem | Négligeable |
| 4 Islands, réservation | Feuille du bas qui suit le doigt : lancer vers le bas pour fermer (vitesse > 0,55 px/ms ou 32 % de la hauteur), élasticité vers le haut, ressort interruptible ; panneau latéral sur bureau. Bande de jours (Today, Tomorrow…) à l'heure de Bangkok, calendrier dépliable dont le mois glisse dans le sens de la flèche, âge de chaque enfant, message relu, brouillon gardé 7 jours, bouton qui « secoue non » et montre le champ manquant | Réserver d'une main sur la plage | Moyen (reprend la logique de `src/js/booking.js`) | Aucune | 5 Ko. Ressort en rAF seulement pendant le geste |
| 4 Islands, réservation, B | Une question par écran, glissement latéral et barre de progression | Plus guidé pour les moins à l'aise | Moyen | Aucune | Négligeable |
| 4 Islands, bande du bas | Apparaît quand le bouton du hero sort de l'écran, disparaît devant le calculateur et le pied de page, affiche le total choisi | Le bouton de réservation est toujours à portée de pouce, sans doublon | Faible | Aucune | IntersectionObserver, aucun écouteur de scroll |
| 4 Islands, inclus | « The boat and the captain for your group only » s'allume quand on choisit le privé | Le contenu suit le choix | Faible | Aucune | Transition de fond |
| 4 Islands, questions | Réponses qui s'ouvrent en douceur (`interpolate-size` et `::details-content`, CSS seul) ; flèche en ressort | Plus de saut sec | Faible | Aucune | CSS seul ; ailleurs que Chrome l'ouverture est simplement instantanée |
| 4 Islands, questions, B | Filtre avec surlignage, la seule réponse trouvée s'ouvre | Trouver « fee » ou « children » d'un mot | Faible | Aucune | Négligeable |
| Hub, filtres | Type, recherche et tri : les cartes qui restent glissent à leur place, les autres s'effacent, le compteur roule ; l'état est dans l'URL (`?type=boat&sort=asc`) | On voit l'effet du filtre, on partage ou revient au même état | Faible | Aucune | View Transitions même document, noms posés le temps du réagencement |
| Hub, filtres, B | Budget maximum au curseur : les sorties trop chères s'estompent sans bouger | Explorer par prix sans perdre ses repères | Faible | Aucune | Aucun décalage de mise en page |
| Hub, aperçu | Aperçu : la photo de la carte grandit jusqu'à la fiche (faits, options et prix, WhatsApp prérempli), fermeture qui la ramène à sa carte ; pour 4 Islands « Open the 4 Islands page » enchaîne sur la transition entre pages | Comparer les options sans quitter la liste | Moyen | Aucune | 2 Ko. Le contenu vient des données déjà dans la page |
| Hub, aperçu, B | Panneau latéral (bureau) ou feuille à geste (mobile), la liste reste visible | Variante plus sobre | Faible | Aucune | Réutilise la feuille |
| Hub, comparateur | Case « Compare » sur chaque carte : la vignette s'envole jusqu'au tiroir du bas (ressort), jusqu'à trois sorties, tableau prix, durée, prise en charge, bateau, saison, frais de parc, options, inclus | Le choix entre Koh Rok et Phi Phi se fait sur une seule vue | Moyen | Aucune | 2,5 Ko. Vol en WAAPI 520 ms, une seule couche |
| Hub, cartes, B | Liste dense dépliable (13 lignes sur un écran) | Pour ceux qui savent déjà ce qu'ils cherchent | Faible | Aucune | CSS seul |
| Accueil, en-tête, B | Barre d'onglets en bas sur mobile (Boat trips, Activities, Search, WhatsApp) qui descend en lecture et remonte au moindre retour | Tout est sous le pouce | Moyen (change la navigation de tout le site) | Aucune | Négligeable |

## Mes 5 meilleures idées

1. **Transition carte vers page produit avec préchargement à l'intention.** C'est ce qui fait « grande entreprise » : la page arrive sans blanc et la photo fait le lien. Faible coût, aucun poids d'image en plus, se dégrade proprement.
2. **Le parcours longtail ou speedboat qui se réorganise, relié au calculateur.** Le mouvement explique la seule vraie différence du produit (Koh Ma ou Koh Kradan, où l'on déjeune) et le prix roule à côté.
3. **La feuille de réservation au doigt** : lancer pour fermer, bande de jours à l'heure de Bangkok, âges des enfants, message relu, même état partagé avec la page.
4. **La recherche ⌘K dans les faits** : les voyageurs cherchent « Maya Bay » ou « Emerald Cave », pas nos noms de produits.
5. **Le comparateur du hub avec vignette qui s'envole**, plus l'aperçu qui grandit depuis la carte : décider sans ouvrir six onglets.

## Données marquées `[DONNÉE À FOURNIR]` dans les prototypes

- Photo du speedboat join-in à son ponton (4 Islands).
- Horaires du speedboat : la journée affichée est celle du longtail (TODO client déjà ouvert).
- Les enfants comptent-ils dans la taille du groupe du bateau privé (5 900 THB pour 1 à 2 personnes, 6 400 THB pour 3 à 4) ? Le calculateur les compte et l'affiche.
- Prix d'un enfant de moins de 4 ans en speedboat (le site ne le dit que pour le longtail) : le calculateur le signale si on choisit cet âge.
- Classement « sur l'eau / à terre » des activités (variante seulement).

## Ce que j'ai écrit et qui n'est pas dans les données

Textes d'interface seulement, à valider : le lead de l'accueil (sans le comptoir), « Pick the two ends of your trip », les trois étapes de « How booking works » (tirées de `site.json` booking : WhatsApp, cash ou virement, rien en ligne), « Adults 12 and over » (déduit du plus grand âge enfant des grilles 4 Islands), les invites de recherche. L'adresse et le comptoir de Sala Dan ont disparu de partout ; Sala Dan n'apparaît que comme ponton de départ du speedboat, tel que dans `home.json`.

## Risques perf et limites

- **Le prototype rend ses sections en JS depuis `data.js`** (80 Ko, 19 Ko gzip) : son CLS au chargement n'a pas de sens. Dans Eleventy tout est rendu au build ; les effets eux-mêmes n'ajoutent aucun décalage (mesuré : CLS 0 au défilement complet, aucune image de plus de 50 ms).
- **Poids total des effets** : `mouvement.js` 12,7 Ko gzip, `reserve.js` 5,1 Ko, `mouvement.css` 7 Ko, plus 2 à 4 Ko par page. En production on chargerait la visionneuse, la feuille et le comparateur en différé, au premier geste.
- **Photos** : les placeholders font jusqu'à 2,2 Mo (2400 px). Rien ne tient sans `srcset` 400 / 800 / 1600 en AVIF ou WebP. Le hero de l'accueil charge trois photos.
- **`blocking="render"`** sur un élément en fin de page retarde la première peinture jusqu'au rendu complet : acceptable pour un prototype rendu en JS, à placer juste après le hero en production.
- **Navigateurs** : View Transitions entre pages, `animation-timeline`, `interpolate-size` sont Chrome et Edge d'abord (Safari en partie). Sans eux tout marche, sans mouvement.
- **Mouvement réduit** : transitions entre pages coupées, ressorts instantanés, message et timeline affichés en entier, aucune animation au scroll.
