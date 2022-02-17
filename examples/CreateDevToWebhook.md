---
operationName: CreateDevToWebhook
services:
  - service: DEV_TO
    slug: dev-to
    friendlyServiceName: Dev.to
    typePrefix: DevTo
doc: >
  Creates a webhook that will be notified whenever an article is created or
  published on DEV.to


  See the counter example on [Destroying a Webhook on DEV.to](DestroyDevToWebhook).


  You can find or create your DEV.to API keys in [the settings menu on dev.to](https://dev.to/settings/account)

---

```graphql
mutation CreateDevToWebhook($apiKey: String!) {
  devTo(auths: { devToAuth: { apiKey: $apiKey } }) {
    createWebhook(
      input: {
        webhookEndpoint: {
          source: "OneGraph"
          targetUrl: "https://websmee.com/hook/dev-to-example?_websmee_inspect"
          events: ["article_created", "article_updated"]
        }
      }
    ) {
      webhook {
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

