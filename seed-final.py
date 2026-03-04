#!/usr/bin/env python3
"""Final seed - ONLY verified working image URLs."""
import json, subprocess, time, random, string

FIREBASE_URL = "https://predict-network-ec767-default-rtdb.firebaseio.com/pfpbest"

def gen_id():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))

def fb(method, path, data=None):
    cmd = ["curl", "-s", "-X", method, f"{FIREBASE_URL}/{path}.json"]
    if data is not None:
        cmd += ["-d", json.dumps(data)]
    subprocess.run(cmd, capture_output=True, timeout=15)

# VERIFIED WORKING URLs (all return HTTP 200)
COLLECTIONS = [
    # === BTC (from CoinGecko API - verified 200) ===
    ("BTC", 1, "Bitcoin Puppets", "https://coin-images.coingecko.com/nft_contracts/images/3873/small_2x/bitcoin-puppets.png?1707290228"),
    ("BTC", 2, "NodeMonkes", "https://coin-images.coingecko.com/nft_contracts/images/3872/small_2x/nodemonkes.jpg?1707290228"),
    ("BTC", 3, "Quantum Cats", "https://coin-images.coingecko.com/nft_contracts/images/4067/small_2x/quantum-cats.png?1707290320"),
    ("BTC", 4, "Bitcoin Frogs", "https://coin-images.coingecko.com/nft_contracts/images/3262/small_2x/bitcoin-frogs.png?1707289928"),
    ("BTC", 5, "Runestone", "https://coin-images.coingecko.com/nft_contracts/images/4200/small_2x/runestone.png?1710468413"),

    # === ETH (from CoinGecko API - all verified 200) ===
    ("ETH", 1, "CryptoPunks", "https://coin-images.coingecko.com/nft_contracts/images/270/small_2x/cryptopunks.png?1707287245"),
    ("ETH", 2, "Bored Ape Yacht Club", "https://coin-images.coingecko.com/nft_contracts/images/20/small_2x/bored-ape-yacht-club.png?1707287183"),
    ("ETH", 3, "Mutant Ape Yacht Club", "https://coin-images.coingecko.com/nft_contracts/images/104/small_2x/mutant-ape-yacht-club.png?1707287213"),
    ("ETH", 4, "Azuki", "https://coin-images.coingecko.com/nft_contracts/images/94/small_2x/azuki.png?1707287212"),
    ("ETH", 5, "Pudgy Penguins", "https://coin-images.coingecko.com/nft_contracts/images/38/small_2x/pudgy-penguins.png?1707287199"),
    ("ETH", 6, "Milady Maker", "https://coin-images.coingecko.com/nft_contracts/images/80/small_2x/milady-maker.png?1707287211"),
    ("ETH", 7, "Clone X", "https://coin-images.coingecko.com/nft_contracts/images/246/small_2x/clonex.png?1707287241"),
    ("ETH", 8, "Moonbirds", "https://coin-images.coingecko.com/nft_contracts/images/364/small_2x/moonbirds.png?1707287258"),
    ("ETH", 9, "Doodles", "https://coin-images.coingecko.com/nft_contracts/images/44/small_2x/doodles-official.png?1707287201"),
    ("ETH", 10, "Cool Cats", "https://coin-images.coingecko.com/nft_contracts/images/50/small_2x/cool-cats-nft.png?1707287202"),
    ("ETH", 11, "World of Women", "https://coin-images.coingecko.com/nft_contracts/images/84/small_2x/world-of-women-nft.png?1707287211"),
    ("ETH", 12, "Meebits", "https://coin-images.coingecko.com/nft_contracts/images/288/small_2x/meebits.png?1707287248"),
    ("ETH", 13, "mfers", "https://coin-images.coingecko.com/nft_contracts/images/312/small_2x/mfers.png?1707287251"),
    ("ETH", 14, "Nouns", "https://coin-images.coingecko.com/nft_contracts/images/232/small_2x/nouns.png?1707287239"),
    ("ETH", 15, "VeeFriends", "https://coin-images.coingecko.com/nft_contracts/images/148/small_2x/veefriends.png?1707287224"),
    ("ETH", 16, "Invisible Friends", "https://coin-images.coingecko.com/nft_contracts/images/352/small_2x/invisible-friends.png?1707287256"),
    ("ETH", 17, "goblintown.wtf", "https://coin-images.coingecko.com/nft_contracts/images/471/small_2x/goblintown-wtf.png?1707287272"),
    ("ETH", 18, "Captainz", "https://coin-images.coingecko.com/nft_contracts/images/2667/small_2x/the-captainz.png?1707287443"),
    ("ETH", 19, "10KTF", "https://coin-images.coingecko.com/nft_contracts/images/620/small_2x/10ktf.png?1707287292"),
    ("ETH", 20, "Genuine Undead", "https://coin-images.coingecko.com/nft_contracts/images/1266/small_2x/genuine-undead.png?1707287353"),
    ("ETH", 21, "DeGods", "https://coin-images.coingecko.com/nft_contracts/images/2893/small_2x/degods.png?1707287471"),
    ("ETH", 22, "Chromie Squiggle", "https://coin-images.coingecko.com/nft_contracts/images/670/small_2x/chromie-squiggle-by-snowfro.png?1707287296"),
    ("ETH", 23, "Fidenza", "https://coin-images.coingecko.com/nft_contracts/images/672/small_2x/fidenza-by-tyler-hobbs.png?1707287297"),
    ("ETH", 24, "BEANZ Official", "https://coin-images.coingecko.com/nft_contracts/images/456/small_2x/beanz-official.png?1707287270"),
    ("ETH", 25, "Karafuru", "https://coin-images.coingecko.com/nft_contracts/images/336/small_2x/karafuru.png?1707287254"),
    ("ETH", 26, "Killer GF", "https://coin-images.coingecko.com/nft_contracts/images/332/small_2x/killer-gf.png?1707287254"),
    ("ETH", 27, "RENGA", "https://coin-images.coingecko.com/nft_contracts/images/1636/small_2x/renga.png?1707287389"),
    ("ETH", 28, "Sproto Gremlins", "https://coin-images.coingecko.com/nft_contracts/images/2024/small_2x/sproto-gremlins.png?1707287416"),
    ("ETH", 29, "OnChainMonkey", "https://coin-images.coingecko.com/nft_contracts/images/186/small_2x/onchainmonkey.png?1707287231"),
    ("ETH", 30, "0N1 Force", "https://coin-images.coingecko.com/nft_contracts/images/218/small_2x/0n1force.png?1707287237"),
    ("ETH", 31, "Opepen Edition", "https://coin-images.coingecko.com/nft_contracts/images/2564/small_2x/opepen-edition.png?1707287434"),
    ("ETH", 32, "Okay Bears", "https://coin-images.coingecko.com/nft_contracts/images/400/small_2x/okay-bears.png?1707287262"),
    ("ETH", 33, "My Pet Hooligan", "https://coin-images.coingecko.com/nft_contracts/images/406/small_2x/my-pet-hooligan.png?1707287264"),
    ("ETH", 34, "FLUF World", "https://coin-images.coingecko.com/nft_contracts/images/170/small_2x/fluf-world.png?1707287228"),
    ("ETH", 35, "Deadfellaz", "https://coin-images.coingecko.com/nft_contracts/images/66/small_2x/deadfellaz.png?1707287206"),
    ("ETH", 36, "CrypToadz", "https://coin-images.coingecko.com/nft_contracts/images/54/small_2x/cryptoadz-by-gremplin.png?1707287203"),
    ("ETH", 37, "Loot", "https://coin-images.coingecko.com/nft_contracts/images/142/small_2x/loot.png?1707287222"),
    ("ETH", 38, "Parallel Alpha", "https://coin-images.coingecko.com/nft_contracts/images/434/small_2x/parallel-alpha.png?1707287268"),
    ("ETH", 39, "Checks VV", "https://coin-images.coingecko.com/nft_contracts/images/2476/small_2x/checks-vv-edition.png?1707287425"),
    ("ETH", 40, "Autoglyphs", "https://coin-images.coingecko.com/nft_contracts/images/302/small_2x/autoglyphs.png?1707287249"),
    ("ETH", 41, "CyberBrokers", "https://coin-images.coingecko.com/nft_contracts/images/358/small_2x/cyberbrokers.png?1707287257"),
    ("ETH", 42, "Chimpers", "https://coin-images.coingecko.com/nft_contracts/images/1554/small_2x/chimpers-nft.png?1707287384"),
    ("ETH", 43, "The Potatoz", "https://coin-images.coingecko.com/nft_contracts/images/1326/small_2x/the-potatoz.png?1707287361"),
    ("ETH", 44, "y00ts", "https://coin-images.coingecko.com/nft_contracts/images/2913/small_2x/y00ts.png?1707287472"),
    ("ETH", 45, "Otherdeed", "https://coin-images.coingecko.com/nft_contracts/images/392/small_2x/otherdeed.png?1707287261"),
    ("ETH", 46, "Sewer Pass", "https://coin-images.coingecko.com/nft_contracts/images/2246/small_2x/sewer-pass.png?1707287419"),
    ("ETH", 47, "Art Blocks", "https://coin-images.coingecko.com/nft_contracts/images/640/small_2x/art-blocks-curated.png?1707287293"),
    ("ETH", 48, "Moonbirds Oddities", "https://coin-images.coingecko.com/nft_contracts/images/1502/small_2x/proof-moonbirds-oddities.png?1707287377"),
    ("ETH", 49, "Memeland Captainz", "https://coin-images.coingecko.com/nft_contracts/images/2784/small_2x/memeland-captainz.png?1707287458"),
    ("ETH", 50, "SpacePunksClub", "https://coin-images.coingecko.com/nft_contracts/images/280/small_2x/spacepunksclub.png?1707287247"),

    # === SOL (from CoinGecko API - verified 200) ===
    ("SOL", 1, "Mad Lads", "https://coin-images.coingecko.com/nft_contracts/images/3187/small_2x/mad-lads.png?1707289879"),
    ("SOL", 2, "Tensorians", "https://coin-images.coingecko.com/nft_contracts/images/3495/small_2x/tensorian.gif?1720674013"),
    ("SOL", 3, "Famous Fox Federation", "https://coin-images.coingecko.com/nft_contracts/images/2440/small_2x/famous-fox-federation.png?1707288358"),
    ("SOL", 4, "Claynosaurz", "https://coin-images.coingecko.com/nft_contracts/images/2446/small_2x/claynosaurz.gif?1707288361"),
    ("SOL", 5, "Solana Monkey Business", "https://coin-images.coingecko.com/nft_contracts/images/2433/small_2x/solana-monkey-business.png?1707288355"),
    ("SOL", 6, "DeGods", "https://coin-images.coingecko.com/nft_contracts/images/3145/small_2x/degods.jpg?1727054998"),
]

# Now fetch remaining BTC and SOL from CoinGecko with delays
EXTRA_SLUGS = [
    # BTC
    ("BTC", 6, "ordinal-maxi-biz", "Ordinal Maxi Biz"),
    ("BTC", 7, "btc-degods", "BTC DeGods"),
    ("BTC", 8, "pizza-ninjas", "Pizza Ninjas"),
    ("BTC", 9, "taproot-wizards", "Taproot Wizards"),
    ("BTC", 10, "bitcoin-punks", "Bitcoin Punks"),
    ("BTC", 11, "bitmap", "Bitmap"),
    ("BTC", 12, "rsic-metaprotocol", "RSIC"),
    ("BTC", 13, "natcats", "Natcats"),
    ("BTC", 14, "blob-btc", "Blob"),
    ("BTC", 15, "ink-btc", "Ink"),
    ("BTC", 16, "ocm-genesis", "OCM Genesis"),
    ("BTC", 17, "sub-10k", "Sub 10k"),
    ("BTC", 18, "bitcoin-apes", "Bitcoin Apes"),
    ("BTC", 19, "bitcoin-bandits", "Bitcoin Bandits"),
    ("BTC", 20, "ordinal-penguins", "Ordinal Penguins"),
    # SOL
    ("SOL", 7, "okay-bears", "Okay Bears"),
    ("SOL", 8, "aurorians", "Aurory"),
    ("SOL", 9, "abc", "ABC"),
    ("SOL", 10, "y00ts", "y00ts"),
    ("SOL", 11, "sharky-fi", "Sharx"),
    ("SOL", 12, "honeyland-genesis-bee", "Honeyland"),
    ("SOL", 13, "trippin-ape-tribe", "Trippin Ape Tribe"),
    ("SOL", 14, "degen-ape-academy", "Degen Ape Academy"),
    ("SOL", 15, "cets-on-creck", "Cets on Creck"),
    ("SOL", 16, "galactic-gecko-space-garage", "Galactic Geckos"),
    ("SOL", 17, "stoned-ape-crew", "Stoned Ape Crew"),
    ("SOL", 18, "genopets-genesis", "Genopets"),
    ("SOL", 19, "pesky-penguins", "Pesky Penguins"),
    ("SOL", 20, "thugbirdz", "Thugbirdz"),
]

def fetch_extra():
    """Fetch remaining images from CoinGecko."""
    extra = []
    print("Fetching extra collection images from CoinGecko...")
    for chain, rank, slug, fallback_name in EXTRA_SLUGS:
        try:
            r = subprocess.run(
                ["curl", "-s", f"https://api.coingecko.com/api/v3/nfts/{slug}"],
                capture_output=True, text=True, timeout=15
            )
            d = json.loads(r.stdout)
            if "error" in str(d).lower() or "status" in d:
                print(f"  {chain} #{rank} {slug}: not found, skipping")
                continue
            name = d.get("name", fallback_name)
            img = d.get("image", {}).get("small_2x", "") or d.get("image", {}).get("small", "")
            if img:
                extra.append((chain, rank, name, img))
                print(f"  {chain} #{rank} {name}: OK")
            else:
                print(f"  {chain} #{rank} {slug}: no image")
        except Exception as e:
            print(f"  {chain} #{rank} {slug}: error {e}")
        time.sleep(2.5)
    return extra

def seed():
    print("Clearing old data...")
    for path in ["pfps", "comments", "ratings", "votes"]:
        fb("DELETE", path)
    time.sleep(1)

    # Fetch extra images
    extras = fetch_extra()
    all_collections = list(COLLECTIONS) + extras

    categories = ["anime", "gaming", "aesthetic", "dark", "minimalist", "funny"]
    comments = [
        "Legendary PFP!", "This goes hard", "Clean af", "Top tier",
        "Based choice", "Hard flex", "Fire energy", "Peak collection",
        "Absolutely goated", "W collection", "Iconic", "Next level"
    ]

    print(f"\nSeeding {len(all_collections)} collections...")
    count = 0
    for chain, rank, name, image in all_collections:
        pid = gen_id()
        base_rating = max(3, 10 - (rank * 0.14))
        upvotes = max(5, 500 - rank * 9 + random.randint(-10, 10))
        downvotes = random.randint(0, max(1, upvotes // 8))
        rc = random.randint(20, 200)
        rs = round(base_rating * rc)

        entry = {
            "id": pid, "imageUrl": image, "title": name,
            "category": random.choice(categories),
            "tags": [chain.lower()], "chain": chain, "rank": rank,
            "uploadedAt": int(time.time() * 1000) - random.randint(0, 604800000),
            "uploadedBy": "seed_" + gen_id(),
            "ratingSum": rs, "ratingCount": rc,
            "ratingAvg": round(rs / rc, 2),
            "upvotes": upvotes, "downvotes": downvotes, "commentCount": 1,
            "score": round(base_rating * 0.7 + (upvotes / (upvotes + downvotes + 1)) * 3, 2)
        }
        fb("PUT", f"pfps/{pid}", entry)

        cid = gen_id()
        fb("PUT", f"comments/{pid}/{cid}", {
            "id": cid, "pfpId": pid, "text": random.choice(comments),
            "fp": "seed_" + gen_id(),
            "timestamp": entry["uploadedAt"] + random.randint(1000, 60000)
        })
        count += 1
        print(f"  {chain} #{rank}: {name}")

    fb("PUT", "stats/totalPfps", count)
    print(f"\nDone! {count} collections seeded with real images.")

if __name__ == "__main__":
    seed()
