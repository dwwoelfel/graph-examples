---
operationName: FindMyDevToWebhooks
services:
  - service: DEV_TO
    slug: dev-to
    friendlyServiceName: Dev.to
    typePrefix: DevTo
doc: >
  Lists all of the webhooks you've created on DEV.to


  You can find or create your DEV.to API keys in [the settings menu on dev.to](https://dev.to/settings/account)

---

```graphql
query FindMyDevToWebhooks($apiKey: String!) {
  me(auths: { devToAuth: { apiKey: $apiKey } }) {
    devTo {
      webhooks {
        id
        source
        targetUrl
        events
        createdAt
      }
    }
  }
}
```

