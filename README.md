# target-profile-scripts

[![ci](https://github.com/forrestblade/target-profile-scripts/actions/workflows/ci.yml/badge.svg)](https://github.com/forrestblade/target-profile-scripts/actions/workflows/ci.yml)

Adobe Target profile scripts you can run and test on your machine. Target runs profile scripts server-side on every mbox call, so the only feedback loop is saving the script, hitting the site, and reading a response token. This repo gives you the same `page`, `landing`, `referrer`, `mbox`, `profile` and `user` objects locally, a linter for the limits that get scripts disabled, and a set of scripts that pass both.

## What's here

- `src/` the runtime. Builds the objects from Adobe's [profile script reference](https://experienceleague.adobe.com/en/docs/target/using/audiences/visitor-profiles/profile-parameters) and [variable glossary](https://experienceleague.adobe.com/en/docs/target/using/audiences/visitor-profiles/variables-profiles-parameters-methods), runs a script in an isolated `vm` context with nothing else in scope, and replays a visitor's requests so `user.setLocal` and `user.get` behave across visits.
- `src/lint.ts` static checks for Adobe's limits: ES5 only (Rhino), 1,300 characters, loops capped at 50, roughly 2,000 instructions with every call costing 100, no dot-star regexes, no browser or Node globals, no reading other scripts' values.
- `scripts/` reusable scripts. Each has a header saying what it returns and what the page has to send.

| Script | Returns |
|---|---|
| `visitCount` | sessions seen, counting this one |
| `purchaseCount` | distinct orders, de-duplicated on `orderId` |
| `daysSinceLastPurchase` | whole days since the last order, unset until the first |
| `lifetimeOrderValue` | sum of `orderTotal` across distinct orders |
| `firstTouchCampaign` | first `utm_campaign` ever, set once |
| `lastTouchCampaign` | most recent `utm_campaign` |
| `lastCategoryViewed` | latest category the page sent |
| `regionBucket` | US Census region from geolocation, `intl`, or `unknown` |
| `deviceClass` | `phone`, `tablet` or `desktop` |
| `engagementSegment` | `new`, `active`, `returning` or `reactivated`, judged per session |
| `qaFlag` | the `adobeQA` token for the session the tester arrived in |
| `loyaltyTier` | an allowlisted tier sent from signed-in pages, remembered elsewhere |

## Use

    npm install
    npx tps lint scripts/*.js
    npx tps run scripts/purchaseCount.js --requests requests.json

Where `requests.json` is an array of mbox calls:

```json
[
  { "mbox": { "name": "home" }, "page": "https://shop.example.com/?utm_campaign=spring" },
  { "mbox": { "name": "orderConfirmPage", "params": { "orderId": "A1", "orderTotal": "19.99" } } }
]
```

In a test:

```ts
import { Journey, loadScript } from "target-profile-scripts";

const purchaseCount = loadScript("scripts/purchaseCount.js");
const sim = new Journey()
  .hit("orderConfirmPage", { params: { orderId: "A1" } })
  .hit("orderConfirmPage", { params: { orderId: "A1" } })   // reload
  .days(10).session()
  .hit("orderConfirmPage", { params: { orderId: "A2" } })
  .run([purchaseCount]);

sim.state.attributes.purchaseCount; // 2
```

## What this is not

It is not Rhino. Scripts run on V8 with ES5 syntax enforced by the linter, so logic bugs show up here but engine quirks might not. Values are kept with the type the script returned; Target's storage may stringify them, so the shipped scripts `parseInt` and `parseFloat` anything they read back. Returning nothing leaves `user.<name>` untouched, which is how the documented examples behave.
