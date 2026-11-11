# target-profile-scripts

[![ci](https://github.com/forrestblade/target-profile-scripts/actions/workflows/ci.yml/badge.svg)](https://github.com/forrestblade/target-profile-scripts/actions/workflows/ci.yml)

A local test harness and 12 reusable Adobe Target profile scripts. Run scripts against sample requests, replay visitor sessions, and lint before adding them to Target.

## What's here

- `src/` models `page`, `landing`, `referrer`, `mbox`, `profile` and `user` from Adobe's [profile script reference](https://experienceleague.adobe.com/en/docs/target/using/audiences/visitor-profiles/profile-parameters) and [variable glossary](https://experienceleague.adobe.com/en/docs/target/using/audiences/visitor-profiles/variables-profiles-parameters-methods). Visitor attributes, profile parameters and per-script locals persist across requests.
- `src/lint.ts` checks ES5 syntax, script length, loop counts, regexes, unsupported globals and cross-script dependencies. Instruction counts are estimates; length and loop warnings follow Adobe's recommendations.
- `scripts/` reusable scripts. Each has a header saying what it returns and what the page has to send.

| Script | Returns |
|---|---|
| `visitCount` | sessions seen, counting this one |
| `purchaseCount` | orders, ignoring consecutive repeats of the same `orderId` |
| `daysSinceLastPurchase` | whole days since the last order, unset until the first |
| `lifetimeOrderValue` | total order value, ignoring consecutive repeats of the same order |
| `firstTouchCampaign` | first `utm_campaign` ever, set once |
| `lastTouchCampaign` | most recent `utm_campaign` |
| `lastCategoryViewed` | latest category the page sent |
| `regionBucket` | US Census region from geolocation, `intl`, or `unknown` |
| `deviceClass` | `phone`, `tablet` or `desktop` |
| `engagementSegment` | `new`, `active`, `returning` or `reactivated`, judged per session |
| `qaFlag` | the `adobeQA` token for the session the tester arrived in |
| `loyaltyTier` | an allowlisted tier sent from signed-in pages, remembered elsewhere |

## Use

Node 22.12+, 24 or 26. From the cloned repository:

    npm ci
    npm run build
    npm test
    node dist/cli.js lint scripts/*.js
    node dist/cli.js run scripts/purchaseCount.js --requests requests.json

Where `requests.json` is an array of mbox calls:

```json
[
  { "mbox": { "name": "home" }, "page": "https://shop.example.com/?utm_campaign=spring" },
  { "mbox": { "name": "orderConfirmPage", "params": { "orderId": "A1", "orderTotal": "19.99" } } }
]
```

In a test:

```js
import { Journey, loadScript } from "./dist/index.js";

const purchaseCount = loadScript("scripts/purchaseCount.js");
const sim = new Journey()
  .hit("orderConfirmPage", { params: { orderId: "A1" } })
  .hit("orderConfirmPage", { params: { orderId: "A1" } })   // reload
  .days(10).session()
  .hit("orderConfirmPage", { params: { orderId: "A2" } })
  .run([purchaseCount]);

sim.state.attributes.purchaseCount; // 2
```

Local execution uses V8 with a wall-clock timeout, not Rhino's instruction counter. Run trusted scripts only; Node's `vm` is not a security sandbox.
