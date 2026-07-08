# Base Mini Auction

**Field report:** this repo documents a deployed Base dApp used for mini auctions. The observed user path is short: arrive, connect wallet, listing or bidding on a small lot, inspect the auction card.

## Evidence collected

| Field | Value |
| --- | --- |
| Base Developer Dashboard | Registered |
| Build ID / Base App ID | `6a03fbb1acef3c7a49b15eb2` |
| Builder Wallet | `0x7AB85206CaeeDaB082692Fc98e22aa8FB59a1117` |
| Builder Code | `bc_8fpb1rkw` |
| Live Demo | https://base-mini-auction.vercel.app |
| GitHub Repository | https://github.com/outmoded0018/base-mini-auction-base-dapp |
| Network | Base |
| Deployment | Vercel |

## Notes from the field

The app avoids account-email identity assumptions. Public project identity is established by matching the Base App ID, builder wallet, Builder Code, Vercel deployment, and repository.

## Equipment

React app router, wallet hooks, Base network config, Vercel deployment

## Local reproduction

```bash
npm install
npm run dev
```

## Red lines

Do not commit `.env`, private keys, seed phrases, RPC keys, GitHub tokens, or Vercel tokens. Use `.env.example` only for placeholders.

License: MIT
