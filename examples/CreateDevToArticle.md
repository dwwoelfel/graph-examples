---
operationName: CreateDevToArticle
services:
  - service: DEV_TO
    slug: dev-to
    friendlyServiceName: Dev.to
    typePrefix: DevTo
doc: >
  Creates an (unpublished) article on DEV.to


  See the [Publishing and Unpublishing](SetDevToArticlePublished) example for how to publish the article after creating it.

---

```graphql
mutation CreateDevToArticle($apiKey: String!) {
  devTo(auths: { devToAuth: { apiKey: $apiKey } }) {
    createArticle(
      input: {
        article: {
          title: "Posting articles to dev.to from any programming language via GraphQL: An Exhaustive Guide"
          bodyMarkdown: "Just use OneGraph, of course!"
          tags: ["graphql", "onegraph"]
        }
      }
    ) {
      article {
        bodyHtml
        bodyMarkdown
        id
        slug
        tags
        url
      }
    }
  }
}
```

