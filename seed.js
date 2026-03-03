// Seed script — run this once in the browser console at pfp.best
// Seeds top ordinals collections as PFP entries

const collections = [
  { name: "Bitcoin Puppets", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/bitcoin_puppets_pfp_1708977569498.gif", cat: "aesthetic" },
  { name: "NodeMonkes", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/nodemonkes_pfp_1707364437498.png", cat: "aesthetic" },
  { name: "Quantum Cats", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/quantum_cats_pfp_1707440044791.png", cat: "aesthetic" },
  { name: "OMB", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/ordinal_maxi_biz_pfp_1681932593498.png", cat: "dark" },
  { name: "Bitcoin Frogs", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/bitcoin_frogs_pfp_1693053697498.gif", cat: "funny" },
  { name: "Bitmap", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/bitmap_pfp_1693831261498.png", cat: "minimalist" },
  { name: "RSIC", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/rsic_pfp_1705356162498.png", cat: "dark" },
  { name: "Runestone", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/runestone_pfp_1710801428498.png", cat: "aesthetic" },
  { name: "BTC DeGods", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/degods_pfp_1700000000000.png", cat: "dark" },
  { name: "Ordinal Penguins", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/ordinal_penguins_pfp_1683756789498.png", cat: "funny" },
  { name: "Taproot Wizards", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/taproot_wizards_pfp_1678900000000.png", cat: "aesthetic" },
  { name: "Bitcoin Apes", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/bitcoin_apes_pfp_1680000000000.png", cat: "gaming" },
  { name: "Ordinal Punks", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/ordinal_punks_pfp_1676000000000.png", cat: "minimalist" },
  { name: "BTC Machines", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/btcmachines_pfp_1700000000000.png", cat: "gaming" },
  { name: "Pizza Ninjas", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/pizza_ninjas_pfp_1710000000000.png", cat: "anime" },
  { name: "ORDI BRC-20", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/ordi_pfp_1690000000000.png", cat: "minimalist" },
  { name: "Blob", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/blob_pfp_1708000000000.png", cat: "funny" },
  { name: "OnChain Monkey BTC", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/ocm_btc_pfp_1700000000000.png", cat: "aesthetic" },
  { name: "Natcats", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/natcats_pfp_1710000000000.png", cat: "funny" },
  { name: "Sub10k", img: "https://img-cdn.magiceden.dev/rs:fill:400:400:0:0/plain/https://creator-hub-prod.s3.us-east-2.amazonaws.com/sub10k_pfp_1678000000000.png", cat: "minimalist" }
];

// This will be written directly to Firebase via REST API
const seedData = collections.map((c, i) => {
  const id = 'seed' + String(i+1).padStart(3, '0');
  const baseRating = 6 + Math.random() * 3.5; // 6.0 - 9.5
  const ratingCount = Math.floor(50 + Math.random() * 500);
  const upvotes = Math.floor(20 + Math.random() * 300);
  const downvotes = Math.floor(Math.random() * upvotes * 0.3);
  return {
    id,
    imageUrl: c.img,
    title: c.name,
    category: c.cat,
    tags: [c.cat, 'ordinals', 'btc'],
    uploadedAt: Date.now() - Math.floor(Math.random() * 86400000 * 7),
    uploadedBy: 'seed_admin',
    ratingSum: Math.round(baseRating * ratingCount),
    ratingCount,
    ratingAvg: Math.round(baseRating * 10) / 10,
    upvotes,
    downvotes,
    commentCount: Math.floor(Math.random() * 50),
    score: Math.round(baseRating * 10) / 10
  };
});

console.log(JSON.stringify(seedData, null, 2));
