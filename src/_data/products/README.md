# Données produit (refonte)

Un fichier JSON par page produit. Eleventy les expose en données globales : `products.tours["4-islands"]`, `products.activities.kayak`, `products.rental`, `products["secret-transfers"]["speedboat-ferry"]`, `products.taxi["krabi-airport-koh-lanta"]`. Les infos communes aux marques sont dans `src/_data/site.json`.

Les anciens fichiers (`secret.json`, `secretPagesContent.json`, `taxi.json`, `taxiRoutes.json`) restent en place tant que les anciennes pages existent. Ces fichiers-ci sont la source des nouveaux gabarits.

## Dossiers

| Dossier | Gabarit (`template`) | Marque (`brand`) | URL |
|---|---|---|---|
| `tours/` | `boat` | `secret` | `/tours/<slug>/` |
| `activities/` | `activity` | `secret` | `/tours/<slug>/` |
| `rental.json` | `rental` | `secret` | `/tours/rental/` |
| `secret-transfers/` | `transfer` | `secret` | `/transfers/`, `/tours/speedboat/` |
| `taxi/` | `route` | `vip` | `/taxi/<slug>/`, `/taxi/southern-thailand/` |

## Champs

Obligatoires : `slug` (= nom du fichier), `url`, `brand`, `template`, `name`, `seo.title`, `seo.metaDescription`, `h1`, `lead`, `facts`, `sources`, et soit `price`, soit `priceOnRequest: true`.

| Champ | Contenu |
|---|---|
| `seo` | `title`, `metaDescription`, `ogImage` (absent tant qu'il n'y a pas d'image dédiée), `draft` (points de départ de 02-audit-seo §6.2) |
| `facts[]` | `{label, value}` : bandeau de faits clés |
| `price` | `{from, currency: "THB", unit}` : prix d'appel, présent dans une ligne d'option |
| `priceOnRequest` | `true` : afficher « Price on WhatsApp », jamais un chiffre inventé |
| `options[]` | `{id, label, kind, boat, ages, note, prices[], priceOnRequest, notIncludedFees[]}` |
| `options[].prices[]` | `{label, amount}` ou `{label, text}`, plus `unit`, `ages {min, max}`, `group {min, max}`, `supplement` |
| `day[]` | `{options?, title, steps[{time?, label?, text}]}` : un bloc par option quand le déroulé diffère ; sans `options`, le bloc vaut pour toutes |
| `included[]`, `notIncluded[]` | listes de chaînes |
| `beforeYouBook` | `pickup`, `bring`, `children`, `health`, `weather`, `payment`, `cancellation` ; absent = valeur commune de `site.json` (`booking`) |
| `faq[]` | `{q, a}` propres à la page |
| `photos[]` | `{slot, status: keep\|replace\|missing, file?, alt?, legacyAlt?, shot?}` ; `file` relatif à `src/images/` |
| `related[]` | URL de pages produit ou de pages prévues |
| `schema` | `{type, …}` : type Schema.org cible, `legacyType`, lieux |
| `route` | trajets : `{from, to, code?, bothDirections, drive?, points[], region}` |
| `routes[]` | `southern-thailand.json` : les 7 trajets regroupés, chacun avec ses faits et `legacyUrl` |
| `timetable` | speedboat : départs, retours, saisons, enregistrement |
| `legacyText` | ancien texte du site, à réécrire par l'agent de rédaction |
| `sources[]` | `{field, from}` : d'où vient chaque fait |
| `todo[]` | `"TODO(client): …"` : information manquante ou contradictoire, les deux valeurs citées |
| `notes[]` | remarques éditoriales (pas une question au client) |

## Règles

- Un champ inconnu est absent, jamais `null` ni vide (seul `site.json` garde `licence: null`, `geo: null`).
- Jamais de nom de prestataire ni de tarif interne (net, commission) : `tests/products-schema.test.js` le vérifie.
- Une contradiction ne se tranche pas ici : les deux valeurs vont dans un `TODO(client)`.
- `npm run build` régénère `docs/refonte/manques.md` et `docs/refonte/photos-a-fournir.md`.

## Ajouter une galerie à une fiche

1. Convertir chaque photo dans `src/images/secret/v3/` (JPEG, 2000 px au plus, sans métadonnées, nom sans prestataire).
2. Déclarer chaque photo dans `src/_data/photos-v3.json` : un `id` (préfixe `gal-`), `file`, `alt` en anglais, `position` (cadrage de la vignette), `source`. Un fichier ne sert qu'une fois.
3. Ajouter la liste des `id` à `GALLERY` dans `src/_data/v4data.js`, sous le slug de la fiche ; la première photo est la grande vignette. Cinq photos remplissent la grille ; une à quatre ont leur variante, au-delà de cinq les suivantes ne s'ouvrent que dans la visionneuse.
4. Passer les emplacements `gallery` de `photos[]` de la fiche en `keep` avec leur `file`.

Une fiche absente de `GALLERY` n'a pas de galerie et reste telle quelle.
