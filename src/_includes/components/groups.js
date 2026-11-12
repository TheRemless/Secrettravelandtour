// Groupes des vignettes (filtres du hub, bandes de l'accueil, menu, pied de page, fils d'Ariane visible et JSON-LD),
// dans l'ordre d'affichage. Décision de Jérémy du 11.11.2026 : plus de vignettes, moins d'options par fiche.
const GROUPS = [
  { id: "islands", title: "Island trips", nav: "Islands", hash: "islands", slugs: ["4-islands", "koh-rok-koh-haa", "koh-phi-phi", "scuba-diving"] },
  { id: "mangrove", title: "Mangrove trips", nav: "Mangroves", hash: "mangroves", slugs: ["sunset-dinner-raft", "sunrise-raft", "fishing-trip", "mangroves", "kayak", "mangrove-kayaking"] },
  { id: "land", title: "On land", nav: "On land", hash: "on-land", slugs: ["elephant-sanctuary", "atv", "cooking-class", "batik", "go-kart"] }
];
const groupOf = (slug) => GROUPS.find((g) => g.slugs.includes(slug)) || null;

module.exports = { GROUPS, groupOf };
