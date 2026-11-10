// Données calculées pour la page /taxi/ à partir de taxi.json : données structurées pour
// Google, liste des infos encore à confirmer par VIP Taxi Lanta et affichage du bandeau
// d'aperçu (jamais en production).
const taxi = require("./taxi.json");
const site = require("./site.json");
const { vipPlace } = require("../_includes/components/schema.js");

function toConfirm() {
  const items = [];
  const groups = [[taxi.hero], [taxi.tours], taxi.services, taxi.why, taxi.steps, taxi.faq, [taxi.rating], [taxi.payment]];
  for (const group of groups) {
    for (const item of group) {
      if (!item.confirmed) items.push(`${item.title || item.q || item.text}: text to confirm`);
    }
  }
  if (!taxi.hero.photo) items.push(`${taxi.hero.title}: vehicle photo`);
  return items;
}

// Uniquement des faits repris du site et de la fiche Google de VIP Taxi Lanta : pas de note ni d'avis (aucun chiffre
// vérifié), pas de téléphone ni d'e-mail (le formulaire est le canal unique), pas de prix.
function jsonLd() {
  const b = taxi.business;
  const VIP = "https://secrettravelandtour.com/taxi/#vip";
  return {
    "@context": "https://schema.org",
    "@graph": [
      // L'entreprise : même @id que le fournisseur des pages trajet (components/schema.js, ids(site).vip).
      // Adresse et coordonnées : JSON-LD seulement (fiche Google, 10.11.2026), jamais sur la page.
      {
        "@type": "LocalBusiness",
        "@id": VIP,
        name: b.name,
        alternateName: `${b.name} by ${b.owner}`,
        url: "https://secrettravelandtour.com/taxi/",
        image: "https://secrettravelandtour.com/images/taxi/og-taxi.jpg",
        logo: "https://secrettravelandtour.com/images/taxi/logo.webp",
        ...vipPlace(site),
        sameAs: b.sameAs
      },
      // Le service : son propre @id, rattaché à l'entreprise.
      {
        "@type": "TaxiService",
        "@id": "https://secrettravelandtour.com/taxi/#service",
        name: b.name,
        description: taxi.hero.lead,
        serviceType: "Private minivan transfers across Southern Thailand, taxi rides on Koh Lanta",
        areaServed: b.areaServed.map((name) => ({ "@type": "Place", name })),
        provider: { "@id": VIP },
        // Catalogue des services, sans prix : les prix d'appel sont sur les pages trajet.
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Private minivan transfers across Southern Thailand, taxi rides on Koh Lanta",
          itemListElement: taxi.services.map((s) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name: s.title, description: s.text }
          }))
        }
      }
    ]
  };
}

module.exports = function () {
  const pending = toConfirm();
  if (pending.length) {
    console.log(`[taxi] ${pending.length} infos à confirmer sur /taxi/ :\n  - ${pending.join("\n  - ")}`);
  }

  return {
    jsonLd: jsonLd(),
    toConfirm: pending,
    // Netlify fournit CONTEXT=production uniquement pour le site en ligne.
    showDraftBanner: process.env.CONTEXT !== "production" && pending.length > 0
  };
};
