# Pending secondary-domain proofs

These connector → domain pairs were **rejected** in the PARTS 1–3 ingest. The facts may well be accurate, but this environment cannot reach the web, so ownership could not be proven here: three verification agents were refused by the network policy on every page.
Nothing was deleted. The returned facts stay in `data-sourcing/returns/` and will be accepted automatically once a proof is added.

## How to prove one (from a terminal with web access)

Add an entry under the connector id in `data-sourcing/domain-aliases.json`:

```json
"payfit": [{"domain": "payfit.io", "approved": true, "proof": "link", "evidence": "https://payfit.com/<page> links to https://developers.payfit.io/ as \"API documentation\""}]
```

Accepted proofs:
- **link:** a page on the provider's primary domain (or its parent company's) links to the domain as its docs / developer portal / status page.
- **redirect:** a URL on the primary domain redirects to it.

These do not count as proof:
- the alternate page carrying the brand name or logo
- the alternate page linking back to the primary site
- a search result

Then run `python3 scripts/ingest-sourced-data.py && npm run sync:catalogue`.

| Connector | Primary site | Domain needing proof | Example rejected URL |
|---|---|---|---|
| payfit | https://payfit.com/ | developers.payfit.io | https://developers.payfit.io/ |
| tidb-cloud | https://www.pingcap.com/ | status.tidbcloud.com | https://status.tidbcloud.com/ |
| toradex-torizon | https://www.toradex.com/ | status.torizon.io | https://status.torizon.io/ |
| cisco-umbrella | https://umbrella.cisco.com/ | status.umbrella.com | https://status.umbrella.com |
| directus | https://directus.com/ | status.directus.cloud | https://status.directus.cloud/ |
| fastmail | https://www.fastmail.com/ | fastmailstatus.com | https://fastmailstatus.com/ |
| harvest | https://www.getharvest.com/ | www.harveststatus.com | https://www.harveststatus.com/ |
| humaans | https://humaans.io/ | humaansstatus.io | https://humaansstatus.io/ |
| ionos-cloud | https://cloud.ionos.com/ | status.ionos.cloud | https://status.ionos.cloud/ |
| jfrog | https://jfrog.com/ | status.jfrog.io | https://status.jfrog.io/ |
| maplerad | https://maplerad.com/ | maplerad.dev | https://maplerad.dev/docs/intro |
| neo4j-aura | https://neo4j.com/ | status.neo4j.io | https://status.neo4j.io/ |
| neo4j-query | https://neo4j.com/ | status.neo4j.io | https://status.neo4j.io/ |
| nice-cxone | https://www.nice.com/ | developer.niceincontact.com | https://developer.niceincontact.com/ |
| nws-api | https://www.weather.gov/ | www.nco.ncep.noaa.gov | https://www.nco.ncep.noaa.gov/status/messages/ |
| squadcast | — | status.squadcast.com | https://status.squadcast.com/ |
| temporal-cloud | https://temporal.io/ | saas-api.tmprl.cloud | https://saas-api.tmprl.cloud/docs/httpapi.html |
| sendcloud | https://www.sendcloud.com/ | sendcloud.dev | https://sendcloud.dev/docs/getting-started |
| apaleo | https://apaleo.com/ | apaleo.dev | https://apaleo.dev/ |
| cornerstone-ondemand | https://www.cornerstoneondemand.com/ | csod.dev | https://csod.dev/ |
| cornerstone-ondemand | https://www.cornerstoneondemand.com/ | status.csod.com | https://status.csod.com/ |
| shoplazza | https://www.shoplazza.com/ | www.shoplazza.dev | https://www.shoplazza.dev/ |
| transloadit | https://transloadit.com/ | transloaditstatus.com | https://transloaditstatus.com/ |
| userpilot | https://userpilot.com/ | status.userpilot.io | https://status.userpilot.io/ |
