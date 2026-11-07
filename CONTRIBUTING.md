# Contributing

PalmShield is a devnet prototype, and the README lists what is still broken. Pull requests that
close one of those gaps are the most useful thing you can send, ahead of new features.

## Ground rules

- Devnet only. Never point the dashboard, the payout function, or a test at a vault that holds
  real funds.
- Keep secrets out of git. The Supabase anon key is public by design and belongs in
  `palmshield/js/config.js`. The vault keypair belongs in the Supabase secret
  `VAULT_SECRET_KEY_B58`.
- Keep the dashboard dependency free. It is plain HTML, CSS, and ES2020 served over HTTP, with no
  bundler and no install step.
- One concern per pull request. Small diffs get reviewed.

## Local setup

```bash
git clone https://github.com/maxxexee/palm-shield.git
cd palm-shield/palmshield
python3 -m http.server 8080
```

Open http://localhost:8080 and connect a Phantom wallet set to devnet. Set `SUPABASE_ANON` in
`palmshield/js/config.js` first, or the dashboard will load but cannot read reports.

The edge functions run on Deno. With the Supabase CLI installed:

```bash
supabase functions serve psp-screen
```

## Before you open a pull request

```bash
node scripts/check-repo.mjs
```

CI runs the same script. It checks that every local asset referenced by the dashboard exists,
that the JavaScript parses, that README links and images resolve, and that no service key was
committed.

For dashboard changes, also load the page and test the flow you touched against devnet.

## Style

- Two space indentation in JavaScript, CSS, YAML, and JSON.
- Single quotes and semicolons in JavaScript, template literals for rendered markup.
- Rust follows `cargo fmt` and `cargo clippy` defaults once the program is buildable.
- UI copy is plain sentence case, with no decorative emoji and no em dashes.
- Use relative paths in docs so links work from a fork.

## Good first issues

These are the gaps already named in the README. Pick one and say so in the issue.

1. Move quorum evaluation and payout into a server function that reads the vote rows itself.
2. Require authentication on `supabase/functions/payout`.
3. Tighten the row level security policies in `db/schema.sql`.
4. Fix the vote account allocation in `programs/palmshield/src/vote.rs`.
5. Commit `Anchor.toml` and `Cargo.toml` so the program builds from source.
6. Add tests for the scoring function in `supabase/functions/psp-screen`.
