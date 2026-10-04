# Connector research: one batch

**कैसे इस्तेमाल करें (Hindi):** यह पूरी फ़ाइल और एक `batch-NNN.csv` अपने स्टाफ़ को दें, या ChatGPT / DeepSeek में (web browsing चालू करके) paste करें। जो जवाब मिले उसे `data-sourcing/batches/returns/batch-NNN.jsonl` में save करें, और लोगो `returns/logos/` में। AI टूल कभी-कभी नकली लिंक बना देते हैं। इसलिए हर लिंक बाद में अपने-आप खोलकर जाँचा जाता है, और जो लिंक नहीं खुलता वो हटा दिया जाता है (नीचे "After the batches")।

---

## Prompt (copy everything below this line, then attach or paste the batch CSV)

You are researching software connectors for a product catalogue. For each row of the CSV, find the facts listed in its `needs` column. Use **only the provider's own official pages**. You must open every page you cite, and every link must work.

`needs` values and what to find:

| need | Find |
|---|---|
| logo | The provider's logo: an SVG or a PNG of at least 64 px, from its own website or press/brand page. Give the image URL and the page it came from. |
| site | The official homepage |
| portal | The developer portal or docs home |
| api | The API reference page |
| authDocs | The page that explains authentication |
| auth | The auth method. Exactly one of: OAuth 2.0 · OAuth 2.0 + PKCE · OAuth 2.0 Client Credentials · API Key · API Key (multiple headers) · Bearer Token · HTTP Basic · App password session · Provider-signed JWT · None (public API) · Provider-specific |
| whDocs | The webhooks documentation page (only if the provider documents webhooks) |
| statusUrl | The official status page (often status.<domain>). Many providers have none; then put it in notFound. |
| caps | 5–25 main API operations: a name, read or write, and the method + path exactly as the docs show it |
| scopes | OAuth scopes or API-key permissions, copied exactly as documented, each with read/write/admin |
| reqs | Up to 8 short lines: the account, plan, key or OAuth app the docs say is needed |

**Rules:**
1. Use official sources only: the provider's own domain, or a docs or status host that the provider itself links to (GitHub, readme.io, gitbook.io, Postman, Stoplight, statuspage.io). Never use blogs, Wikipedia, G2, Zapier, RapidAPI, or your memory.
2. Never guess. If you can't find a fact, or aren't sure, leave it out and add its name to `notFound`.
3. Copy scope strings and endpoint paths exactly. Don't make up names or HTTP methods. Don't present labels from a settings screen as scopes.
4. Add one evidence URL (the page where you read it) for each of: auth, scopes, caps, reqs.
5. If a provider's name is ambiguous, or you can't confirm it is the right company, return only `{"id": "...", "notFound": ["*"], "notes": "identity unclear: ..."}`.

**Output:** one JSON object per line (JSONL), one line for every row of the CSV, and nothing else:

```json
{"id":"actionstep","checked":"2026-10-05","portal":"https://docs.actionstep.com/","api":"https://docs.actionstep.com/api/","authDocs":"https://docs.actionstep.com/authentication/","auth":"OAuth 2.0","scopeModel":"oauth_scopes","providerScopes":[{"scope":"actions","access":"read","purpose":"Read matters"}],"providerCaps":[{"name":"List actions","access":"read","endpoint":"GET /api/rest/actions"}],"reqs":["An Actionstep account","An API client registered with Actionstep"],"logo":{"file":"logos/actionstep.svg","source":"https://www.actionstep.com/"},"evidence":{"auth":"https://docs.actionstep.com/authentication/","scopes":"https://docs.actionstep.com/scopes/","caps":"https://docs.actionstep.com/api/","reqs":"https://docs.actionstep.com/authentication/"},"notFound":["statusUrl"],"notes":""}
```

(The values above only show the shape. Never copy them.)

`scopeModel` is one of `oauth_scopes`, `api_key_permissions`, `account_roles` or `none`. `access` is `read`, `write` or `admin` for scopes, and `read` or `write` for caps.

---

## After the batches (one person with internet runs this)

```bash
node scripts/collect-batches.mjs                           # opens EVERY link; drops any that does not answer 200
python3 scripts/ingest-sourced-data.py --dry-run           # official-domain + format checks
python3 scripts/ingest-sourced-data.py && npm run sync:catalogue
```

Send the results to Claude, or push them, and the facts appear on the site.

What the scripts guarantee:
- Existing facts are never overwritten.
- A broken or invented link never reaches the catalogue.
- Anything rejected is listed in `data-sourcing/INGEST_REPORT.md`, with the reason.
