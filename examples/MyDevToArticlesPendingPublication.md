---
operationName: MyDevToArticlesPendingPublication
services:
  - service: DEV_TO
    slug: dev-to
    friendlyServiceName: Dev.to
    typePrefix: DevTo
doc: >
  Finds all articles I've written on DEV.to (sorted by recency) that haven't
  been published yet.

---

```graphql
query MyDevToArticlesPendingPublication($apiKey: String!) {
  me(auths: { devToAuth: { apiKey: $apiKey } }) {
    devTo {
      articles(publishStatus: UNPUBLISHED) {
        nodes {
          id
          title
          bodyMarkdown
        }
      }
    }
  }
}
```

