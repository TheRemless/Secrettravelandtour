# Proposition « rupture » : la carte marine

Le site entier est une carte de la mer autour de Koh Lanta. On touche un lieu (une île, un ponton, l'île elle-même) et on voit les sorties qui y vont, leurs heures et leur prix. Chaque trajet est un cap tracé en magenta, la couleur des routes sur les vraies cartes marines.

Fichiers : `home.html`, `4-islands.html`, `tours.html`, `variantes.html`, `app.css`, `app.js`, `data.js` (généré), `build-data.mjs` (lit `src/_data`, vérifie que chaque lien lieu-sortie et chaque horaire cite un texte qui existe dans le JSON du produit, sinon il s'arrête). Captures dans `shots/`, dont la feuille de réservation et la liste ouvertes.

Direction : Bricolage Grotesque (titres serrés, texte), Literata italique seulement pour les noms de mer sur la carte (convention des cartes marines). Encre `#0F2E3D`, eau `#E6F1F3`, terre `#E9DFB8`, route `#A3166A`. Pas de crème, pas de cartes à ombre, pas de petites capitales.

## Idées

| Section | Idée | Ce que ça change pour le visiteur | Coût Eleventy | Données à demander au client | Risque |
|---|---|---|---|---|---|
| Accueil, hero | Carte marine interactive : chaque lieu est un bouton, les trajets des sorties sont tracés, le panneau liste ce qui y va avec photo, heure, prix | Il choisit par l'endroit, comme sur place (« on va à Koh Mook ? »), sans connaître le nom des tours | Moyen (SVG généré au build depuis `layer`, JS léger pour le choix) | Coordonnées validées des îles et pontons, idéalement fond OpenStreetMap | Positions approximatives : il faut un vrai fond de carte avant la mise en ligne |
| Accueil, hero | Filtre par durée sur la carte (une heure, demi-journée, journée, lever ou coucher du soleil) qui éteint les lieux sans sortie de cette durée | Il voit d'un coup où il peut aller avec le temps qu'il a | Faible | Aucune | Faible |
| Accueil, hero | Encadré « Staying on Koh Ngai? » : quand on touche une île desservie, les horaires du speedboat de Sala Dan pier apparaissent | Le même lieu sert pour une excursion et pour un transfert | Faible (timetable déjà dans `speedboat-ferry.json`) | Aucune | Faible |
| Accueil, hero | Calque « Speedboat transfers » activable sur la carte | Montre le réseau de transferts sans page en plus | Faible | Aucune | Faible |
| Accueil, journée | Ligne du temps de la journée choisie : chaque sortie de la prise en charge au retour, jours et saisons appliqués (cours de cuisine selon le jour, Koh Rok hors saison grisé), trait « Now on Koh Lanta » à l'heure de Bangkok et sorties déjà parties grisées | Il répond à « qu'est-ce qu'on peut encore faire aujourd'hui ? » ou « demain matin ? » | Moyen | Heures de Koh Talabeng, ATV, go-kart, plongée, mangrove en longtail | Une heure fausse dans un JSON se voit tout de suite |
| Accueil, liste | « My list » : on ajoute plusieurs sorties de n'importe quelle page, chacune avec sa date, et on envoie un seul message WhatsApp structuré | Une famille qui planifie trois sorties envoie une seule demande, l'agence chiffre tout d'un coup | Moyen (localStorage, aucun serveur) | Aucune | Faible ; message plus long à lire pour l'agence |
| Accueil, transferts | Horaires du speedboat en tableau lisible + liste des trajets VIP Taxi Lanta qui renvoient vers /taxi/ | Les transferts sont visibles sans redessiner les pages du partenaire | Faible | Aucune | Faible |
| Accueil, location | Choix du modèle, date de départ, nombre de jours, total et message WhatsApp prérempli | Il sait combien coûte son scooter pour cinq jours avant d'écrire | Faible | Disponibilité, caution, permis, assurance | Le total peut laisser croire à une réservation ferme |
| Accueil, bande finale | Aperçu en direct du message de la liste | On comprend ce qui sera envoyé avant d'ouvrir WhatsApp | Faible | Aucune | Faible |
| 4 Islands, hero | Carte zoomée du trajet avec étapes numérotées ; le choix du bateau redessine le trajet (Koh Ma ou Koh Kradan), la pause déjeuner et les faits | La différence longtail / speedboat se voit au lieu de se lire | Moyen | Ponton et horaires du speedboat | Faible |
| 4 Islands, hero | Longtail privé : on change l'ordre des îles (boutons haut/bas) et on ajoute Koh Kradan (+500 THB par bateau), l'ordre part dans le message | Le seul avantage du privé (« you choose the order ») devient concret | Faible | Confirmer que tous les ordres sont possibles | L'ordre choisi peut être refusé par la mer ou le capitaine |
| 4 Islands, journée | La journée déroulée : un curseur (clavier compris) fait avancer le bateau, chaque étape montre son heure (≈ si elle bouge), son texte et sa photo | Il se projette dans la journée heure par heure | Moyen | Photos manquantes : buffet sur la plage, speedboat au ponton, snorkelling à Koh Chueak | Placeholders tant que les vraies photos manquent |
| 4 Islands, prix | Calculateur du groupe : adultes, enfants avec âge, tarif thaï, total à payer et à part l'argent liquide du parc national | Plus de calcul de tête, plus de surprise au ranger | Faible | Prix des moins de 4 ans en speedboat, tranche d'âge enfant (4-11 ou 4-10) | Faible ; affiche « [DONNÉE À FOURNIR] » quand l'âge n'a pas de prix |
| 4 Islands, inclus | Inclus, non inclus avec les montants, à prévoir, avant de réserver (prise en charge, météo, paiement) | Tout ce qui fait poser des questions sur WhatsApp est déjà écrit | Faible | Langue du guide, nombre max en join-in | Faible |
| 4 Islands, autres sorties | Les autres sorties en bateau montrées sur une petite carte, le survol d'une ligne éclaire son trajet | La relation entre les sorties est géographique, pas une grille de cartes | Faible | Aucune | Faible |
| 4 Islands, réservation | Feuille de demande : option, date (Today, Tomorrow, calendrier qui grise les jours passés et hors saison), groupe avec âges, hôtel, prénom, aperçu du message, erreurs par champ, écran « WhatsApp should open now » avec copie du message | Respecte le parcours 4 touchers + 2 saisies | Moyen | Délai de réponse (pour l'écran final) | Faible |
| Sorties, recherche | La phrase à trous : « We are 2 adults and 1 child aged 7. We have a full day, we'd like islands and snorkelling, on Friday. » | Trois réponses suffisent, sans panneau de filtres | Faible | Aucune | Le libellé des envies doit être relu par le client |
| Sorties, liste | Chaque ligne dit pourquoi elle colle (citation de la fiche), pourquoi elle ne colle pas (« No children under 4 », « Runs October to April », « No class listed on Sundays »), sa plage horaire en mini barre et le prix total pour le groupe avec le détail | Le prix réel de son groupe, pas un « from » | Moyen | Aucune | Le total est indicatif, le message le dit |
| Sorties, liste | Comparer jusqu'à trois sorties côte à côte | Décider entre Phi Phi et Koh Rok sans ouvrir deux onglets | Faible | Aucune | Faible |
| Sorties, carte | Bouton « Show on the chart » : la même carte, filtrée par les réponses, et un lieu touché filtre la liste | Les deux façons de chercher se rejoignent | Faible | Aucune | Faible |
| Variante : en-tête | Barre d'onglets en bas sur mobile (Chart, All trips, My list, WhatsApp) | Tout est sous le pouce | Faible | Aucune | Quatrième barre fixe avec la barre de réservation : à arbitrer |
| Variante : accueil hero B | La journée de demain en ouverture du site | L'accueil devient un programme | Faible | Heures manquantes | Page qui vieillit mal si les horaires changent sans mise à jour du JSON |
| Variante : accueil hero C | Assistant en trois questions, une par écran, avec retour et « skip » | Pour celui qui ne sait pas quoi choisir | Faible | Aucune | Doublon avec la phrase de la page Sorties |
| Variante : journée B | Matin, après-midi, soir en trois listes | Plus simple que la ligne du temps | Faible | Aucune | Faible |
| Variante : transferts B | « Getting to Koh Lanta » : on choisit d'où on vient, on voit le minivan privé et le speedboat avec ses heures | Une question, la bonne réponse | Faible | Aucune | Faible |
| Variante : location B | Tableau des fourchettes par type | Lecture d'un coup d'œil | Faible | Aucune | Faible |
| Variante : liste B | La semaine : une sortie par jour sur sept jours, le message suit les jours | Pour les séjours d'une semaine | Moyen | Aucune | Faible |
| Variante : pied de page B | Une seule ligne sur fond blanc | Moins de répétition avec le menu | Faible | Aucune | Moins de liens internes pour le SEO |
| Variante : 4 Islands hero B | Photo pleine largeur puis titre, faits et prix sur la ligne du bouton | Plus proche de la v3, pour comparer | Faible | Vraie photo de la grotte d'Émeraude | Faible |
| Variante : 4 Islands journée B | Liste verticale, heures fixes en gras, ≈ pour les autres | Sans interaction | Faible | Aucune | Faible |
| Variante : 4 Islands prix B | Tableau des trois bateaux côte à côte, chaque colonne a son bouton | Comparaison directe | Faible | Ponton du speedboat | Faible |
| Variante : 4 Islands photos B | Bande défilante et visionneuse (clavier, compteur) | Galerie classique | Faible | Vraies photos | Faible |
| Variante : 4 Islands questions B | Recherche dans les réponses de toutes les fiches, mots trouvés surlignés | « children » trouve les réponses de toutes les sorties | Faible | Aucune | Faible |
| Variante : 4 Islands réservation B | Formulaire en trois étapes dans la page | Pas de feuille par-dessus | Faible | Aucune | Plus long sur mobile |
| Variante : Sorties recherche B | Pastilles et tri (prix, heure de départ, nom) | Familier | Faible | Aucune | Faible |
| Variante : Sorties liste B | Sorties rangées par zone de la carte (côte est, mer de Trang, Koh Rok et Koh Haa, Phi Phi, l'île) | La géographie reste le fil même sans carte | Faible | Aucune | Faible |

## Mes 5 meilleures idées

1. **La carte marine comme accueil** : aucun site d'excursions de Koh Lanta ne s'organise par lieu. C'est l'idée qui rend le site impossible à confondre.
2. **Une liste, un message** : plusieurs sorties avec leurs dates envoyées en une seule demande WhatsApp. Gain direct pour l'agence et pour les familles.
3. **Le prix pour mon groupe** (calculateur 4 Islands et lignes de la page Sorties) : total avec les âges, argent liquide du parc à part, détail du calcul.
4. **La ligne du temps de la journée** : ce qui part demain, ce qui est déjà parti aujourd'hui, avec jours de cours et saisons appliqués.
5. **La phrase à trous** de la page Sorties, qui dit pour chaque sortie pourquoi elle colle ou non, citations de la fiche à l'appui.

## Données manquantes (marquées « [DONNÉE À FOURNIR] » dans le prototype)

- Coordonnées des îles, des pontons et de Thung Yee Peng (la carte est schématique).
- 4 Islands en speedboat : ponton de départ et horaires.
- 4 Islands en speedboat : prix des moins de 4 ans.
- Ponton de départ de Koh Rok et de Koh Phi Phi (les trajets partent de « Koh Lanta » sans nom).
- Heures de Koh Talabeng & Koh Bubu, ATV, go-kart, plongée, mangrove en longtail ou kayak.
- Vraies photos : grotte d'Émeraude, buffet sur la plage, speedboat au ponton, snorkelling à Koh Chueak (les placeholders de `photos-v3.json` sont utilisés).
- Délai de réponse sur WhatsApp (écran de confirmation).
- Location : caution, permis, assurance, conditions de disponibilité.
