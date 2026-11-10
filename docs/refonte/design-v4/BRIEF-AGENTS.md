# Design v4 de secrettravelandtour.com : brief commun aux agents

## Le client et le site

Secret Travel & Tour vend des sorties en bateau et des activités sur Koh Lanta (Thaïlande) à des voyageurs anglophones déjà sur l'île ou qui préparent leur séjour. Tout se réserve à distance : le visiteur choisit une sortie, une option, une date et un nombre de personnes, et la page rédige un message WhatsApp structuré. Pas de paiement en ligne. Les transferts privés sont vendus par un partenaire, VIP Taxi Lanta, sur les pages /taxi/ qui ont leur propre direction artistique : le site STT y renvoie par des liens, il ne les redessine pas.

Le site tourne sur Eleventy 3 (`/Users/admin/Desktop/Secrettravelandtour`, branche `refonte`). La v3 en ligne sur https://deploy-preview-8--steady-capybara-eb28c9.netlify.app (pages `/`, `/tours/4-islands/`, `/tours/`, `/_components/`) a été jugée « pas mal mais pas assez vivante ». Les captures de la v3 sont dans `docs/refonte/design-v3/livraison/img/`, la spec v3 dans `docs/refonte/design-v3/PROMPT-DESIGN-V3.md`, les captures du site frère ZTP (zwaldtravelplanner.com, que le client aime) dans `docs/refonte/design-v3/context/`.

## La demande du client (05.11.2026)

Carte blanche. On peut ajouter, supprimer ou modifier chaque section. Le client veut un niveau UX, UI, fonctionnalités et fluidité « comme une grande entreprise de développement ». Il veut plusieurs versions par section, même des visions complètement différentes : chaque idée sera évaluée à part, donc une idée forte isolée a de la valeur même si le reste de ta proposition n'est pas retenu.

Décision : **plus aucune mention de l'adresse ni du comptoir de Sala Dan** (les clients ne viennent jamais sur place). Pas de bande « Our desk », pas de section bureau, pas d'adresse dans le pied de page.

## Règles qui ne bougent pas

1. **Aucun fait inventé.** Tout prix, durée, horaire, lieu, inclus, âge, saison, nom vient des fichiers de données : `src/_data/products/tours/*.json`, `src/_data/products/activities/*.json`, `src/_data/products/rental.json`, `src/_data/site.json`, `src/_data/products/common.json` s'il existe. Une info absente n'apparaît pas (pas de « 4.9 ★ », pas d'avis, pas de « 2,000 happy guests », pas de délai de réponse, pas d'horaires d'ouverture, pas de nom de guide). Si une idée a besoin d'une donnée qui manque, construis-la quand même avec la donnée marquée visiblement `[DONNÉE À FOURNIR : …]` et liste-la dans tes notes.
2. Logo d'origine (`src/images/secret/emblem.webp`) jamais modifié.
3. Textes du site en anglais. Pas de « Learn more », « Book now / Learn more » en double, « unlock », « seamless », « hidden gem », « paradise », « unforgettable ». Pas de point d'exclamation. Un bouton dit l'action réelle.
4. Photos : uniquement celles déclarées dans `src/_data/photos-v3.json` (fichiers sous `src/images/`). Les placeholders sont acceptés. Une photo ne sert qu'une fois par page. Rien d'écrit par-dessus une photo sauf si c'est le cœur de ton idée et que le contraste tient (WCAG AA).
5. Accessibilité et perf : contraste AA, cibles ≥ 44 px, focus visible, `prefers-reduced-motion` respecté, rien qui casse à 390 px de large, pas de scroll horizontal de page.
6. Lis `/Users/admin/.claude/projects/-Users-admin-Desktop-Claude-Plugins/memory/design-eviter-look-ia.md` : le client repère tout de suite un site « fait par IA ». Évite chaque marqueur de cette liste.

## Ce que tu livres

Dans ton dossier `docs/refonte/design-v4/propositions/<ton-nom>/` :

- `home.html`, `4-islands.html`, `tours.html` : prototypes HTML autonomes (CSS et JS dans le fichier ou à côté), qui marchent en `file://`. Images par chemin relatif vers `../../../../../src/images/...`. Polices : n'importe quelle police Google Fonts par lien CDN pour l'exploration, sauf Inter, Roboto, Open Sans, Poppins, Montserrat, DM Sans, Space Grotesk.
- Pour chaque section que tu proposes, **au moins deux versions** quand tu en as : la version retenue dans la page, et les autres dans `variantes.html` (chaque variante titrée « Accueil, hero, version B : … » dans une barre de prototype hors design).
- Les fonctionnalités doivent **marcher** dans le prototype (filtres, calculateur, sélecteur de date, feuille de réservation, galerie, comparateur, etc.), pas être dessinées.
- `shots/` : captures pleine page à 1440 (DPR 1) et 390 (DPR 2) de chaque page et de `variantes.html`. Playwright est disponible : `import { chromium } from "/private/tmp/claude-501/-Users-admin-Desktop-Claude-Plugins/a8d30a56-2298-4850-b625-2f29b817350c/scratchpad/shots/node_modules/playwright-core/index.mjs"`, exécutable Chromium `/Users/admin/Library/Caches/ms-playwright/chromium-1234/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`. Au-delà de 8 000 px de haut à DPR 2, capture par tranches (`clip`) et recolle avec sharp (`/Users/admin/Desktop/Secrettravelandtour/node_modules/sharp`).
- `idees.md` : une ligne par idée, en français. Colonnes : section, idée, ce que ça change pour le visiteur, coût de mise en œuvre dans Eleventy (faible, moyen, fort), données qu'il faudrait au client, risque. Puis ton classement de tes 5 meilleures idées.

Regarde tes propres captures avant de rendre et corrige ce qui ne va pas. Ne touche à aucun autre fichier du dépôt, ne commite rien, ne change pas de branche.
