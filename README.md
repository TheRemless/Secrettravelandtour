# Secrettravelandtour

Site de **Secret Travel & Tour** (excursions, transferts, activités) et de **VIP Taxi Lanta** (minivans et taxis), Koh Lanta.
Domaine : https://secrettravelandtour.com. Généré avec Eleventy 3, hébergé sur Netlify.

| Page | Adresse |
|---|---|
| Accueil Secret Travel & Tour, formulaire WhatsApp | `/` |
| Une page par excursion ou activité | `/tours/<id>/` |
| VIP Taxi Lanta, formulaire WhatsApp | `/taxi/` |
| Une page par trajet | `/taxi/<trajet>/` |

Les contenus vivent dans `src/_data` : `secret.json`, `secretPagesContent.json`, `taxi.json`, `taxiRoutes.json`.
Les formulaires rédigent un message WhatsApp, rien n'est envoyé à un serveur.

```bash
npm ci
npm run build   # génère _site/
npm test        # lancer le build avant : un test lit _site/
npm run serve
```

Netlify : commande `npm run build`, dossier publié `_site`.
