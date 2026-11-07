/**
 * PalmShield configuration.
 * Everything the dashboard needs to reach Supabase and the deployed program.
 * The anon key is public by design: row level security guards the tables.
 */

const SUPABASE_URL  = 'https://iffyvycwlhgnsqotlckv.supabase.co';
const SUPABASE_ANON = 'PASTE_YOUR_SUPABASE_ANON_KEY';

// vault wallet that holds PUSD for stakes and bounty payouts
const VAULT_ADDRESS = '6bSGwGnYN18D2etp84YQcRy3F7UgNWyEJPeAdLgwz1rj';

// PUSD mint address
const PUSD_MINT     = '8jMZDTVvVFMGikt78Fpp9W9aTG4z9CP51VbCR85Xd3pQ';

// Anchor program deployed on devnet
const PALMSHIELD_PROGRAM_ID = 'AcksH6RgonJwV52Zd59GmxdXUJAMvdU1B3mq8BAEu3bm';

// DAO parameters, lowered for the demo: a real quorum needs 5 or more votes,typically a qourum system needs at least 5 votes
const STAKE_SUBMIT = 100;  // PUSD required to submit a hunt
const STAKE_VOTE   = 50;   // PUSD required to cast a DAO vote
const QUORUM_VOTES = 1;    // minimum total votes before quorum can trigger
const QUORUM_PCT   = 1.0;  // fraction of confirm votes needed (1.0 = 100% during dev)
