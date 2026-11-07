# PalmShield Protocol

On chain threat intelligence for Solana, funded by the people who produce it. A researcher
stakes PUSD to report a malicious wallet, a DAO panel votes on the evidence, and a confirmed
report pays the researcher from a shared vault and publishes the wallet to a screening API
any DEX can query.

Devnet prototype, built for a Superteam bounty on Palm USD, placed 2nd of 98. Not audited
and not safe to hold mainnet funds.

## How it works

The protocol runs a stake, verify, payout loop.

1. **Submit.** A hunter posts a flagged wallet with transaction evidence and an image, and
   stakes 100 PUSD. The stake is the honesty bond: a wrong call costs money.
2. **Vote.** A DAO member stakes 50 PUSD and casts a vote on chain. Each vote is its own
   program derived account, seeded by voter and submission id, so one wallet cannot vote
   twice on the same report.
3. **Settle.** Once confirmed votes pass quorum, the vault refunds the hunter stake, pays the
   bounty, refunds voter stakes, and the report is written to the logbook.

A confirmed report becomes queryable through the screening function, which scores a wallet
between 0 and 0.99 from confirmed report count, total flags, and threat type.

## What is enforced where

This table is the honest version of the architecture, so read it before the feature list.

| Rule | Enforced by | Notes |
| --- | --- | --- |
| One vote per wallet per submission | On chain | PDA seeded by voter and submission id |
| Stake before voting | Client | `palmshield/js/dao.js` transfers before writing the vote row |
| Quorum | Client | Counted in the browser, see Known gaps |
| Payout amounts | Edge function | Vault keypair from `VAULT_SECRET_KEY_B58` |
| Read access to reports | Database | Open |

## Repository layout

```
programs/palmshield/src/vote.rs    on chain vote program (Anchor)
supabase/functions/psp-screen/     wallet screening API, public and read only
supabase/functions/payout/         vault payouts and stake refunds
db/schema.sql                      tables, indexes and row level security policies
palmshield/                        dashboard, static HTML with no build step
  index.html
  css/styling.css
  js/                              config, state, wallet, hunter, dao, render
```

## Running the dashboard

There is no bundler and no dependency install. Serve the folder over HTTP, since the Solana
libraries come from a CDN:

```bash
cd palmshield
python3 -m http.server 8080
```

Open http://localhost:8080 and connect a Phantom wallet set to devnet.

Set `SUPABASE_ANON` in `palmshield/js/config.js` first, otherwise the dashboard loads but
cannot read or write reports.

## Configuration

| What | Where |
| --- | --- |
| Supabase URL and anon key, vault address, PUSD mint, program id, stake and quorum parameters | `palmshield/js/config.js` |
| Vault keypair for payouts | Supabase secret `VAULT_SECRET_KEY_B58` |
| Tables and policies | `db/schema.sql`, run once against a fresh Supabase project |

The anon key is public by design. Row level security is what protects the data, and it is
currently permissive on purpose for the demo. See Known gaps.

## Deployed addresses (devnet)

| Item | Address |
| --- | --- |
| Vote program | `AcksH6RgonJwV52Zd59GmxdXUJAMvdU1B3mq8BAEu3bm` |
| PUSD mint | `8jMZDTVvVFMGikt78Fpp9W9aTG4z9CP51VbCR85Xd3pQ` |
| Vault | `6bSGwGnYN18D2etp84YQcRy3F7UgNWyEJPeAdLgwz1rj` |

## Screening API

```bash
curl "https://iffyvycwlhgnsqotlckv.supabase.co/functions/v1/psp-screen?wallet=<pubkey>&format=json"
```

Response fields: `risk` (0 to 0.99), `riskLevel` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`),
`tags`, `totalFlags`, `confirmedFlags`. Without a `wallet` parameter the same function
returns the whole logbook, newest first, capped at 100 rows.

Scoring is transparent rather than clever. A confirmed report adds 0.55, two or more flags
add 0.2, three or more add 0.15, a drainer or rug pull adds 0.15, and a pending flag adds
0.05. The total is capped at 0.99.

## Known gaps

Listed because a security repo that hides its own weak points is worth less than one that
names them.

1. **The payout function is unauthenticated.** `supabase/functions/payout/index.ts` accepts a
   POST with a hunter wallet, voter wallets and a bounty, then signs transfers from the vault
   keypair. There is no auth check, and the caller is the browser, so a shared secret in the
   client would not help. The correct fix is to move quorum evaluation and payout into a
   server function that reads the vote rows itself and verifies them.
2. **Quorum is client side.** `palmshield/js/dao.js` counts votes and decides when to pay, so the payout
   trigger is a suggestion rather than an enforcement.
3. **Votes and payouts accept writes from any anon client.** The policies in `db/schema.sql`
   are `true` for select and insert by design for the demo. That is fine on devnet with play
   money and wrong the moment a vault holds anything real.
4. **The program cannot be built from this repo.** No `Anchor.toml` and no `Cargo.toml` are
   committed. `programs/palmshield/src/vote.rs` is the source of what is deployed, kept here
   for reading.
5. **Vote account space is under allocated.** `space = 8 + 32 + 64 + 8 + 8` gives 120 bytes,
   but two Strings of up to 64 bytes need 4 bytes of length prefix each, so the account needs
   about 184. Initialisation will fail for long submission ids.
6. **No tests, no CI.** Everything above was found by reading the code, which is exactly the
   work a test suite should be doing.
7. **The live URL is the landing page, not the dashboard.** The dashboard is the
   `palmshield/` folder in this repo.

## License

MIT
