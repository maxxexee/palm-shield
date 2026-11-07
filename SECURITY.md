# Security policy

## Supported versions

Only the devnet prototype on `main` is maintained. There is no mainnet deployment, and the code
is not audited. Do not use it with real funds.

## Reporting a vulnerability

Report privately through GitHub: open the repository Security tab, then **Report a
vulnerability**. Do not open a public issue while a vulnerability is unfixed, and do not test
against infrastructure you do not own.

Include:

- The file, function, or endpoint affected
- Steps to reproduce
- Impact, including what an attacker could gain
- A suggested fix if you have one

Best effort acknowledgement is within 5 working days, and a fix or a written explanation within
30 days. Credit is given in the advisory unless you ask otherwise.

## Scope

In scope: the payout function, the screening API, the row level security policies, the Anchor
vote program, and the dashboard wallet flow.

Out of scope: the devnet RPC, Supabase platform issues, and findings that only work because the
demo policies are permissive by design.

## Known issues

Read [Known gaps](README.md#known-gaps) before reporting. The unauthenticated payout function,
client side quorum, permissive policies, and undersized vote account are already documented
there, so reports should focus on impact or fixes rather than discovery.
