---
operationName: DestroyDevToWebhook
services:
  - service: DEV_TO
    slug: dev-to
    friendlyServiceName: Dev.to
    typePrefix: DevTo
doc: >
  Destroys a webhook on DEV.to by its `id`.


  See the counter example on [Creating a Webhook on DEV.to](CreateDevToWebhook).


  You can find or create your DEV.to API keys in [the settings menu on dev.to](https://dev.to/settings/account)

---

```graphql
mutation DestroyDevToWebhook($apiKey: String!, $id: Int!) {
  devTo(auths: { devToAuth: { apiKey: $apiKey } }) {
    destroyWebhook(input: { id: $id }) {
      webhook {
        id
        source
        targetUrl
        events
        createdAt
        user {
          name
          username
          twitterUsername
          githubUsername
          websiteUrl
          profileImage
          profileImage90
        }
      }
    }
  }
}
```

