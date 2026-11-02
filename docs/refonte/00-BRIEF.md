# Refonte de secrettravelandtour.com — brief maître

Ce document est la référence. Les trois audits détaillés (01-design, 02-SEO, 03-contenu) donnent les preuves et le détail ; en cas de conflit, **ce brief l'emporte**, puis les réponses du client dans `04-questions-client.md`.

---

## 1. Objectif

Reconstruire entièrement secrettravelandtour.com pour qu'il ait l'air d'avoir été conçu par une petite agence de design sérieuse pour une vraie agence locale de Sala Dan : **aucun signe de génération par IA**, ni dans le design, ni dans les textes, ni dans les images. Le site doit convertir des touristes sur mobile en demandes WhatsApp exploitables sans aller-retour, et gagner en visibilité locale.

### Critères de réussite (vérifiables)
- Un menu présent sur toutes les pages ; chaque produit atteignable en 2 touchers depuis n'importe quelle page.
- Chaque page produit a son propre formulaire (feuille en bas d'écran sur mobile) : **plus jamais de renvoi vers l'accueil**.
- Le message WhatsApp généré contient produit + option + date absolue + passagers avec âges + lieu de prise en charge + prénom + URL de la page. L'agence peut chiffrer sans poser de question.
- De Google à l'envoi WhatsApp : 4 touchers + 2 saisies maximum sur une page produit.
- Mobile 390 px, slow 4G : LCP < 2,5 s, CLS < 0,05, poids initial < 500 Ko sur toutes les pages.
- Contraste AA partout (y compris focus et bordures de champs ≥ 3:1), cibles tactiles ≥ 44 px, navigable au clavier.
- 0 occurrence des éléments de la liste « interdits » (§7) dans le build.
- Toutes les anciennes URL répondent par une 301 directe vers une page en 200.
- 0 texte de remplissage ou fait inventé en production (§9).

---

## 2. Faits connus (ne rien inventer d'autre)

- **Secret Travel & Tour**, agence de voyage locale, 292, Moo 2, Sala Dan, Koh Lanta Yai, Krabi 81150. Google Maps : https://maps.google.com/?cid=9417984697980129551
- WhatsApp unique : **+66 95 868 38 46**. Pas de paiement en ligne.
- Exploitée par **Zwald Travel Planner Co., Ltd** (sœur de Zwald Travel Planner, travel planner francophone, zwaldtravelplanner.com).
- **VIP Taxi Lanta** (« by Mr. Brown ») : transferts privés voiture et minivan, aujourd'hui sur /taxi/ du même domaine, avec sa propre fiche Google et un site WordPress (viptaxilanta.wordpress.com).
- Produits, prix, horaires, inclusions : ceux du site actuel (voir le HTML existant). Plusieurs sont contradictoires : voir 03-audit-contenu §1 et §3, et ne trancher qu'avec les réponses du client.

---

## 3. Décisions

| Sujet | Décision par défaut | À confirmer par le client |
|---|---|---|
| **VIP Taxi Lanta** | **Fusion sous Secret Travel & Tour** : les transferts deviennent une rubrique `/transfers/` du même design. VIP Taxi Lanta est cité comme « nos chauffeurs, l'équipe de Mr. Brown » et dans le schéma via `brand`. Plus de second logo ni de seconde palette sur le domaine. | Oui (question 1). Si le client garde une marque séparée, ne pas toucher /taxi/ dans ce chantier et le traiter plus tard comme un site distinct. |
| Trajets hors Koh Lanta (7 pages : Phuket↔Khao Lak, Krabi↔Khao Sok, etc.) | Regroupés sur une page `/transfers/southern-thailand/` | Oui |
| Langue | Phase 1 : **anglais britannique** uniquement. Prévoir l'i18n dans la structure (dossiers, données, hreflang prêt) pour une phase 2 FR puis DE sous `/fr/` et `/de/`. | — |
| Stack | **Site statique généré à partir de données** (un fichier de données par produit/trajet → title, meta, H1, OG, schéma, prix, formulaire). Choisir le générateur le plus simple compatible avec le dépôt actuel (Eleventy ou Astro conseillés), sortie HTML statique, déploiement Netlify inchangé. JS vanilla minimal, aucun framework client lourd. | — |
| Réservation | WhatsApp uniquement (formulaire → aperçu → wa.me). Bouton principal « Check availability », jamais « Book now » (rien n'est réservé tant que l'agence n'a pas confirmé). | — |
| Zwald Travel Planner | Mention discrète en pied de page (« operated by ») et un lien dans À propos. Plus de bandeau promotionnel au milieu des pages. | — |

---

## 4. Architecture et URL

Garder les slugs `/tours/*` existants (ils ont un historique) ; créer les pages parentes manquantes.

```
/                                  Accueil
/tours/                            Hub (nouveau) : sections « Boat trips » puis « Island activities »
/tours/{4-islands, koh-rok-koh-haa, koh-phi-phi, koh-talabeng-koh-bubu, mangroves, fishing-trip,
        scuba-diving, atv, kayak, elephant-sanctuary, cooking-class, batik, go-kart}/
/tours/island-tour/                Tour de l'île en songthaew (nouveau, seulement si le client fournit programme + prix)
/transfers/                        Hub transferts : privé (voiture/minivan), speedboat & ferry
/transfers/{10 trajets Koh Lanta}/ Une page par trajet, enrichie (voir §6.4)
/transfers/southern-thailand/      Les 7 trajets hors Koh Lanta regroupés
/transfers/speedboat-ferry/        Horaires et billets speedboat/ferry (ex-/tours/speedboat/)
/rental/                           Location voiture/scooter (ex-/tours/rental/)
/about/                            Le bureau de Sala Dan, l'équipe, les partenaires, la société
/contact/                          Carte, accès depuis Saladan Pier, horaires, WhatsApp
/faq/                              FAQ générale (paiement, annulation, prise en charge, enfants)
/guide/                            Phase 2 (contenus : 4 Islands ou Koh Rok ?, frais de parc, saison, comment venir)
/legal/  /privacy/  /terms/        Conservés, refaits dans le nouveau design
```

**Menu** (header collant, compact) : Boat trips · Activities · Transfers · Rental · About · [bouton WhatsApp]. Sur mobile : menu plein écran + bouton WhatsApp toujours visible.

**Redirections** : reprendre le fichier `_redirects` de 02-audit-seo §2 (règles spécifiques avant la règle générique, `/index.html` → `/`, aucune chaîne). Tester chaque ancienne URL du sitemap actuel (liste dans le sitemap en production).

---

## 5. Direction artistique

Positionnement : **« le comptoir du quai de Sala Dan »**. Une agence locale précise et chaleureuse. Le design met en scène les faits (horaires, prix, inclusions) comme un tableau des départs ou un billet de ferry : chiffres alignés, tableaux nets, grandes photos réelles. Pas d'affiche de vacances.

- **Palette** (contrastes vérifiés) : encre `#14282A` · mer d'Andaman `#0D5C63` (marque, liens) · mer profonde `#0A3F44` (fonds sombres) · sable `#F5F0E6` (fond) · blanc `#FFFFFF` (cartes, champs) · texte secondaire `#56625F` · bordure champ `#6F7B78` · rouge bouée `#B83A16` (CTA principal, texte blanc) · soleil `#F0B429` (badges sur fond sombre uniquement) · lagon `#BFE6DF` (aplats). Focus : 3 px `#0D5C63` + décalage blanc 2 px.
- **Typographies** (auto-hébergées, woff2, 2 familles max) : **Archivo** variable pour les titres (largeur 85–90, graisse 600–700, chiffres tabulaires pour prix et horaires) ; **Atkinson Hyperlegible Next** pour le texte. Repli Noto Sans Thai pour les noms en thaï. Interdits : Inter, Poppins, Montserrat, DM Sans, Space Grotesk, Fraunces, Playfair, toute police script.
- **Grille** : mobile 4 colonnes, marges 20 px ; desktop 12 colonnes, 1 200 px max ; espacements base 8 (8/16/24/40/64/96) ; texte ≤ 68 caractères par ligne.
- **Logo** : refaire un logotype typographique sobre + un pictogramme simple, en SVG. Proposer 2 pistes au client avant de l'appliquer (l'emblème actuel est peut-être imprimé sur l'enseigne : question 2).
- **Photos** : droites, sans cadre, sans inclinaison, sans filtre, saturation d'origine, une photo jamais réutilisée pour un autre produit.

Détail des composants : 01-audit-design §5.

---

## 6. Gabarits (4, pas un seul)

### 6.1 Carte produit
Photo 4:3, titre, une ligne de promesse, ligne de faits (« Full day · Longtail or speedboat · Hotel pickup »), prix « from 1,000 THB per adult » en évidence (chiffres tabulaires). Toute la carte est cliquable, **aucun second bouton**. Sur mobile : grille, pas de carrousel horizontal.

### 6.2 Page excursion bateau / activité (ordre)
1. Fil d'Ariane, H1, accroche (≤ 25 mots), **bandeau de faits clés** (prix d'appel, durée, horaire de prise en charge, type de bateau, join-in/privé, saison).
2. Galerie balayable avec compteur (vraies photos uniquement).
3. **Options et prix** : chaque ligne est sélectionnable et ouvre le formulaire avec l'option préremplie ; âges exacts sur chaque ligne ; frais non inclus juste sous le prix.
4. Déroulé de la journée (une version par option si elles diffèrent).
5. Inclus / Non inclus.
6. **Before you book** : zones de prise en charge, que prendre, enfants, santé, météo et annulation, paiement.
7. Avis réels (seulement si fournis).
8. FAQ propre à la page (4–6 questions réelles).
9. Qui organise (le comptoir, le partenaire si le client accepte de le nommer).
10. 3 produits liés + un lien vers les transferts pertinents.
11. Barre collante mobile 64 px : « From X THB » + « Check availability ».

Activités et location ont leurs propres variantes (pas de « How the day goes » pour un go-kart ou une location).

### 6.3 Location
Tableau des véhicules et prix par jour, conditions (permis, caution, passeport, casque, livraison) quand le client les fournit, formulaire avec date de début et de fin.

### 6.4 Page trajet
Prix « from » par véhicule · durée et distance · ferry inclus ou non · point de rencontre (avec photo) · capacité personnes/bagages par véhicule · attente en cas de retard · sièges enfant · 3 FAQ propres au trajet · les deux sens sur la même page · 3 excursions suggérées. **Aucun bloc de texte commun recopié** d'une page trajet à l'autre au-delà de la structure : l'objectif est < 30 % de similarité entre deux pages trajet.

---

## 7. Interdits (signes « fait par IA »)

À supprimer et à ne jamais réintroduire :
- Coups de pinceau derrière les titres, photos façon polaroïd inclinées, légendes manuscrites, post-it, ornements « KOH LANTA —— », flèches → décoratives partout, faux gras `text-stroke`.
- Double CTA « Book now / Learn more » sur les cartes, lien « Learn more ».
- Un seul gabarit pour tous les produits, titres H2 en CAPITALES dans le HTML.
- Blocs génériques « Why choose us », « How it works 1-2-3 » sans faits, triades de promesses.
- Avis, notes ou chiffres inventés ; `AggregateRating` auto-déclaré.
- Images : scans de brochures, photos de banque, images générées ou non prises dans la région (liste dans 01-audit-design §4). Si aucune vraie photo n'existe pour un produit, utiliser **moins d'images** plutôt qu'une mauvaise image.
- Mots et tournures bannis : liste complète dans 03-audit-contenu §6.6 (discover, explore, unforgettable, paradise, crystal-clear, hassle-free, « Ready to…? », « Nobody… », « Questions we get about this trip », « in Koh Lanta »…).

Ajouter un script de vérification au build qui échoue s'il trouve un de ces mots ou une classe/asset interdit dans `dist/`.

---

## 8. Textes

- Anglais britannique, voix « le comptoir de Sala Dan sur WhatsApp » : « we » pour l'agence, « you » pour le client, concret, court, contractions autorisées, pas de point d'exclamation.
- Règles complètes (style, longueurs, micro-textes, toponymes de référence) : 03-audit-contenu §6. Les réécritures d'exemple (§7) servent de modèle de ton, pas de texte final.
- **Réécrire tous les textes** du site selon ces règles, à partir des faits du site actuel et des réponses du client. Corriger les contradictions relevées (âges, horaires, partagé/privé, inclusions). Supprimer l'affirmation fausse sur les frais de parc.
- Faire relire les textes produits par un agent distinct, chargé uniquement de traquer les tics d'IA et les faits non sourcés.

---

## 9. Politique des faits manquants

Beaucoup d'informations manquent (licence TAT, avis, paiement, annulation, zones, prix des transferts…). Règle :
- Les données produit ont des champs optionnels. **Si un champ est vide, la section ou la ligne correspondante n'est pas affichée.** Jamais de texte inventé pour combler.
- Pendant le développement, les manques sont marqués `TODO(client): …` dans les fichiers de données, et listés automatiquement dans `docs/refonte/manques.md` (généré au build).
- Le build de production échoue si `TODO(client)` ou `[À CONFIRMER]` apparaît dans `dist/`.

---

## 10. Formulaire et WhatsApp

Spécification : 01-audit-design §5 (parcours) et 03-audit-contenu §4.4–4.5 (champs, modèle de message).
- Feuille en bas d'écran sur la page produit, préremplie avec produit + option.
- Champs : date (Today / Tomorrow / calendrier), adultes, enfants **avec l'âge de chacun**, hôtel ou adresse (obligatoire pour les excursions), prénom. Transferts : sens, numéro de vol ou heure du ferry, bagages, sièges enfant.
- Aperçu du message avant ouverture de WhatsApp. Message structuré, date absolue avec l'année, URL de la page, prix vu, sans « Hi…! ».
- Après ouverture : écran de confirmation avec délai de réponse (si fourni), « Copy message » et numéro en secours.
- Conserver ce qui marche dans le code actuel : brouillon gardé 7 jours, dates à l'heure de Bangkok, erreurs claires par champ.
- Événement d'analytics « whatsapp_click » par produit.

---

## 11. SEO technique

Appliquer intégralement la checklist de 02-audit-seo §6.4 et le JSON-LD de §6.3 (TravelAgency `@id` + WebSite global ; TouristTrip avec Offer complets ; Service pour transferts et location ; BreadcrumbList 3 niveaux ; FAQPage uniquement si propre à la page ; pas de TouristAttraction). Titles, metas et H1 de départ : §6.2 (prix à valider). Une image OG 1200×630 par page. Sitemap avec `lastmod` réel.

---

## 12. Images

- Garder provisoirement uniquement les images listées « Garder » dans 01-audit-design §4 (si les droits sont confirmés). Retirer toutes les autres listées « Remplacer ».
- Toutes les images passent par un pipeline : AVIF + WebP, `srcset` 400/800/1200/1600, `width`/`height` réels, hero en `fetchpriority="high"`, reste en lazy.
- Créer `docs/refonte/photos-a-fournir.md` : par page, les prises de vue manquantes (base : 01-audit-design §4, liste de prises de vue) et le format attendu.

---

## 13. Déroulé et points de validation

Travailler sur une branche `refonte`, avec deploy previews Netlify. **S'arrêter et attendre la validation du client** aux points marqués ✋.

1. Lecture du dépôt actuel et des 4 documents ; plan d'implémentation ; mise en place du générateur et du modèle de données (extraire tous les produits, prix, horaires du site actuel vers des fichiers de données). ✋ plan + modèle de données.
2. Système de design : tokens, typographies, composants (header, carte, bandeau de faits, bloc prix, feuille de réservation, footer), 2 pistes de logo. ✋ planche de composants desktop + mobile.
3. Gabarits et pages : accueil, une page bateau (4 Islands), une activité, une page trajet, location. ✋ ces 5 pages.
4. Déploiement à toutes les pages, textes réécrits, redirections, SEO, images.
5. Contrôle qualité par des agents qui n'ont pas construit le site : audit visuel desktop/mobile, chasse aux signes d'IA, Lighthouse/LCP mesurés, accessibilité, test du formulaire sur chaque produit (message intercepté), test de chaque redirection, validation JSON-LD. ✋ rapport final avec tableau des critères de §1.
