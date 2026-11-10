# Proposition « reservation » : idées

Angle : faire passer le visiteur de « je regarde » à « j'ai envoyé ma demande » sans friction. Palette et polices de la v3 gardées (sable, vert profond, Cormorant Garamond et Manrope) pour que l'évaluation porte sur le parcours. Tous les prix, âges, horaires et frais sont lus dans `data.js`, généré par `build-data.mjs` à partir de `src/_data/products/**/*.json`, `site.json` et `photos-v3.json` (relancer `node build-data.mjs` après une modification des données).

Fichiers : `home.html`, `4-islands.html`, `tours.html`, `variantes.html`, moteur commun `app.js` et `app.css`, captures dans `shots/`. La barre noire en haut de chaque page est hors design : elle affiche les événements mesurés et remet le prototype à zéro.

## Idées

| Section | Idée | Ce que ça change pour le visiteur | Coût Eleventy | Données à fournir par le client | Risque |
|---|---|---|---|---|---|
| Global | Moteur de prix pour un groupe, lu dans les données : prix par personne, prix au bateau avec personne en plus, supplément Koh Kradan, tranches d'âge enfant, gratuité des moins de 4 ans, âge hors tranche signalé | Il voit son total exact (« 2 adultes, enfants de 7 et 2 ans : 2,700 THB ») au lieu de faire le calcul à partir de « from 1,000 THB » | moyen (un module JS partagé, données déjà là) | âge à partir duquel le tarif adulte s'applique (le moteur compte un enfant au-dessus de la tranche au tarif adulte et l'écrit) | un prix faux si un fichier produit est mal saisi : le test de schéma existant doit couvrir `prices[]` |
| Global | Groupe et dates mémorisés d'une page à l'autre (accueil, hub, page produit, liste) | Il dit une seule fois qui vient et quand ; chaque prix du site devient son total | faible | aucune | aucun |
| Global | Liste de sorties : plusieurs sorties, une date et une option par sortie, un seul message WhatsApp avec total, références et pages | Il prépare son séjour en une fois ; l'agence reçoit une demande groupée triable | moyen | aucune | messages longs : adresse wa.me de 1 890 caractères pour 4 sorties avec enfants, à tester sur iPhone au-delà de 6 sorties |
| Global | Alerte de conflit dans la liste : deux sorties « Full day » le même jour | Évite une demande impossible et un aller-retour sur WhatsApp | faible | aucune | ne couvre que les durées publiées « Full day » |
| Global | Annuler une suppression dans la liste (toast « Undo ») | Pas de perte par erreur de doigt | faible | aucune | aucun |
| Global | Événements mesurés à chaque étape (barre du prototype) | Rien côté visiteur ; l'équipe voit où les gens s'arrêtent | faible (GA4 ou Plausible) | choix de l'outil de mesure | consentement cookies selon l'outil |
| Global | Référence dans chaque message (« 4I-0811-2A1C », reprise de la v3) utilisée pour mesurer les demandes réellement envoyées | L'agence retrouve la demande ; on compare les références reçues aux clics « Open WhatsApp » | faible | que l'équipe note les références reçues | comptage manuel au début |
| Global | Catalogue des textes d'erreur et d'état (variantes, section 12) | Chaque erreur dit quoi faire, au bon endroit | faible | aucune | aucun |
| Accueil, hero | Version A : le hero contient le formulaire « Who is coming, and when » qui ouvre le hub avec les totals du groupe | Le premier geste de la page est déjà un pas vers la réservation | faible | aucune | moins de place pour la promesse que dans un hero photo |
| Accueil, hero | Version B : trouveur en trois questions (groupe, durée, bateau ou île) avec résultats et totals | Pour celui qui ne sait pas quoi choisir | faible | validation du classement des durées (`build-data.mjs`) | le classement de durée est une lecture des faits, à valider |
| Accueil, réservation | Version A : démonstration en direct du message réel (choisir une sortie, voir le message) | Il voit exactement ce qu'il enverra : la peur du « je m'engage à quoi ? » tombe | faible | aucune | aucun |
| Accueil, réservation | Version B : trois étapes réelles (choisir, envoyer, payer sur place) | Version courte et classique | faible | aucune | proche d'un gabarit |
| Accueil, objections | Version A : « Before you book » en grille à filets, contenu calculé : sorties avec transfert hôtel (12 sur 13), frais de parc par sortie, tranches d'âge enfant par sortie | Réponses chiffrées au lieu de promesses générales | faible | délai de réponse, conditions d'annulation | aucun |
| Accueil, objections | Version B : onglets clavier (Paying, Weather, Pickup, Park fees, Children) | Plus compact sur mobile | faible | idem | contenu caché derrière un clic |
| Accueil, activités | Activités en lignes (vignette, promesse, prix, total du groupe, ajout à la liste) au lieu d'une 2e grille de cartes | Lecture plus rapide, rythme différent des bateaux | faible | aucune | aucun |
| Accueil, liste | Bande « Several days on Koh Lanta? » qui montre la liste en cours ou un état vide utile | Fait découvrir la liste | faible | aucune | aucun |
| 4 Islands, réservation | Carte de réservation collante sur ordinateur, dans le flux sur mobile, en deux étapes (bateau, date, groupe puis hôtel, prénom, message) avec barre de progression | Le prix et le bouton restent sous les yeux pendant la lecture ; deux étapes courtes au lieu d'un long formulaire | moyen | aucune | sur un écran de 900 px de haut, la carte dépasse quand le panneau des âges est ouvert : elle défile alors dans sa colonne |
| 4 Islands, réservation | Date et groupe en lignes repliables (« Date : Sunday 8 November », « Who is coming : 2 adults, 1 child ») qui s'ouvrent sur la bande de jours ou les compteurs, et se referment après le choix | La carte reste courte et lisible d'un coup d'œil ; une erreur rouvre la bonne ligne | faible | aucune | un clic de plus pour changer le groupe |
| 4 Islands, réservation | Bande de 14 jours à l'heure de Bangkok + autre date ; jours hors saison désactivés quand la saison est publiée | Choix de date en un geste, sans calendrier qui s'ouvre | faible | saisons manquantes | aucune disponibilité réelle : le site ne dit jamais « complet » |
| 4 Islands, réservation | Détail du total ligne par ligne, puis les frais de parc en espèces calculés à part (« 2 × 200 + 1 × 100 = 500 THB ») | Aucune surprise le jour même | faible | frais de parc des moins de 4 ans | aucun |
| 4 Islands, réservation | Supplément « Add Koh Kradan » coché sur le bateau privé, reporté dans le total et le message | Option vendue au bon moment | faible | aucune | aucun |
| 4 Islands, réservation | Aperçu du message en direct, écran après ouverture : rappel « appuyez sur envoyer », copie du message, numéro de secours, nouvelle date | Moins de demandes perdues entre le clic et l'envoi | faible | délai de réponse | aucun |
| 4 Islands, réservation | Brouillon gardé 7 jours sur le téléphone avec « Start again » | Il retrouve ses choix s'il revient le soir | faible | aucune | aucun |
| 4 Islands, réservation | Version B : assistant en feuille, une question par écran, retour possible | Mobile très guidé ; chaque étape mesurable | moyen | aucune | une étape de plus = un abandon possible de plus |
| 4 Islands, réservation | Version C : phrase à compléter (« I would like the join-in longtail on … for 2 adults ») | Original, très lisible pour une seule sortie | faible | aucune | moins adapté aux enfants nombreux |
| 4 Islands, hero | Version A : titre, faits, galerie ; le prix vit dans la carte collante. Version B : total du groupe et bouton dans le hero | B rassure plus tôt sur mobile | faible | aucune | doublon avec la barre mobile en B |
| 4 Islands, comparateur | Version A : tableau des trois bateaux (à bord, îles, déjeuner, ordre, prix, moins de 4 ans) avec une ligne « pour votre groupe » et « Choose this boat » qui met la carte à jour ; cartes empilées sur mobile | La question n° 1 (longtail ou speedboat ?) est tranchée chiffres en main | faible | moins de 4 ans en speedboat, ponton du speedboat | aucun |
| 4 Islands, comparateur | Version B : trois cartes, la moins chère pour le groupe marquée | Plus visuel | faible | idem | « lowest » peut pousser vers le join-in alors que le privé est plus rentable |
| 4 Islands, déroulé | Le déroulé suit le bateau choisi : longtail, privé (horaires souples) ou speedboat (horaires manquants signalés) | Il ne lit pas un horaire qui ne le concerne pas | faible | déroulé horaire du speedboat | aucun |
| 4 Islands, objections | Réponses au bon endroit : météo sous la date, paiement sous le bouton, prise en charge sous le champ hôtel, enfants calculés âge par âge pour chaque bateau | L'objection tombe là où elle naît | faible | conditions d'annulation | aucun |
| 4 Islands, barre mobile | Version A : total du groupe et un bouton, cachée quand la carte est visible. Version B : « Ask a question » et « Book a date » | A garde une seule action ; B capte les hésitants | faible | aucune | B dilue l'action principale |
| 4 Islands, galerie | Galerie avec visionneuse plein écran, flèches clavier, compteur | Voir avant de payer | faible | vraies photos (placeholders aujourd'hui) | aucun |
| 4 Islands, autres jours | Fin de page « Plan the other days » avec totals et ajout à la liste | Vente additionnelle sans quitter la page | faible | aucune | aucun |
| Hub, groupe | Bloc « Your group and your dates » : toutes les cartes affichent le total du groupe, tri par total | Comparer des sorties sur ce qu'il paiera vraiment | faible | aucune | aucun |
| Hub, filtres | Type, durée, sur l'eau (longtail, speedboat, radeau, kayak), prix par adulte, enfants ; compteur par valeur, valeurs à zéro désactivées, pastilles retirables | Il ne tombe jamais sur une combinaison vide sans le savoir | moyen | aucune | classement des durées à valider |
| Hub, filtres | Filtre « un prix pour chaque âge du groupe » | Une famille ne voit que ce qu'elle peut réserver telle quelle | faible | aucune | aucun |
| Hub, saison | Mois ou jour choisi : Koh Rok masqué hors saison avec une phrase, et la part des saisons inconnues affichée | Pas de demande pour une sortie fermée | faible | saison ou fermeture du parc pour 9 sorties | une saison inconnue n'est jamais présentée comme « toute l'année » |
| Hub, saison | Version C : calendrier mois par mois des 13 sorties (« Runs », « Closed », « ? ») | Planifier un séjour sur plusieurs semaines | faible | idem | beaucoup de « ? » tant que les données manquent |
| Hub, état vide | L'état vide propose le filtre à retirer avec le nombre de sorties retrouvées, puis WhatsApp | Jamais d'impasse | faible | aucune | aucun |
| Hub, adresse | Filtres, groupe et dates dans l'adresse (`#a=2&c=7.2&m=6`) | Lien partageable, retour arrière fiable, l'accueil envoie directement une recherche | faible | aucune | aucun |
| Hub, comparateur | Cocher jusqu'à 3 sorties, tableau (durée, prise en charge, bateau, saison, enfants, inclus, prix, total du groupe) | Choisir entre Koh Rok et Phi Phi sans ouvrir deux onglets | faible | saisons manquantes | aucun |
| Hub, mobile | Feuille de filtres avec bouton « Show 7 trips » qui annonce le résultat avant de fermer | Pas d'aller-retour à l'aveugle | faible | aucune | aucun |
| Hub, résultats | Version B : colonne de filtres et liste en lignes | Plus dense, plus « catalogue » | faible | aucune | moins de photo |
| Hub, liste | Version B : plateau en bas d'écran au lieu du tiroir | La liste reste visible pendant la navigation | moyen | aucune | prend de la hauteur sur mobile |

## Ce qu'une grande plateforme mesurerait

Entonnoir, un événement par étape (noms utilisés dans le prototype) :

1. `page_view` (produit, hub, accueil)
2. `hub_group`, `filter`, `hub_empty` : quelles combinaisons mènent à zéro résultat
3. `option_select` (source : carte ou comparateur), `date_select` (bande ou calendrier), `guests_change`
4. `step_complete` étape 1, `step_error` avec le champ (date ou âge)
5. `step_error` étape 2 (hôtel, prénom)
6. `whatsapp_open` (source : produit, liste, assistant, phrase) puis `message_copy`
7. Liste : `triplist_add`, `triplist_open`, `triplist_error`, `whatsapp_open` avec le nombre de sorties

Indicateurs à suivre chaque semaine :

- vue produit vers étape 1 terminée, étape 1 vers WhatsApp ouvert : l'écart dit si le formulaire freine ;
- abandon par champ : si « âge de l'enfant » ressort, le libellé est à revoir ;
- WhatsApp ouvert vers message reçu : c'est le vrai taux de conversion, mesurable grâce à la référence en tête de message (références reçues ÷ `whatsapp_open`) ;
- part des demandes à plusieurs sorties et total moyen affiché ;
- mois choisis dans le hub : montre quand les visiteurs viennent, et quelles saisons publier en premier ;
- options choisies depuis le comparateur contre depuis la carte : dit si le comparateur sert.

Test A/B prioritaire : carte en deux étapes (A) contre assistant une question par écran (variante B), mesuré sur « WhatsApp ouvert ÷ vues produit » sur mobile.

## Données manquantes (marquées `[DONNÉE À FOURNIR : …]` dans les prototypes)

- Délai de réponse sur WhatsApp (`site.json` replyTime null).
- Conditions d'annulation (`site.json` cancellationPolicy « none »).
- Saison ou fermeture du parc pour 9 sorties sur 13 (seules Koh Rok, ATV, Batik et Kayaking ont un fait « Season »).
- 4 Islands : moins de 4 ans en speedboat, frais de parc des moins de 4 ans, déroulé horaire du speedboat, ponton du speedboat (les données disent « Lanta Old Town pier » mais le déroulé parle d'un ponton séparé).
- Âge à partir duquel un enfant paie le tarif adulte (hypothèse affichée par le moteur : au-dessus de la tranche enfant de l'option).
- Prix publiés pour Koh Talabeng & Koh Bubu, speedboats privés, radeau au lever du soleil en longtail, cours de batik privé.
- Disponibilité réelle (places restantes) : volontairement absente, aucun « plus que 2 places ».
- Pages produit des 12 autres sorties : les cartes renvoient au hub dans le prototype.

## Mes 5 meilleures idées

1. **Le total du groupe partout** : moteur de prix lu dans les données + groupe mémorisé d'une page à l'autre. Chaque carte, le comparateur, la barre mobile et le message affichent ce que le groupe paiera, enfants compris, avec les frais de parc à part.
2. **La liste de sorties envoyée en un seul message**, avec une date par sortie, le total, l'alerte de conflit et l'annulation de suppression.
3. **La carte de réservation collante en deux étapes**, avec l'aperçu du message en direct et l'écran après ouverture (appuyer sur envoyer, copier, numéro de secours).
4. **Le comparateur des trois bateaux avec la ligne « pour votre groupe »** et « Choose this boat » relié à la carte, plus le déroulé qui suit le bateau choisi.
5. **Le hub qui ne mène jamais à une impasse** : compteurs par filtre, saison par mois honnête sur ce qu'on ne sait pas, état vide qui dit quel filtre retirer, recherche dans l'adresse.
