---
operationName: MuxVideoAssetByOneGraphNodeId
services:
  - service: MUX
    slug: mux
    friendlyServiceName: Mux
    typePrefix: Mux
doc: >
  Look up a Mux video asset directly by its oneGraphNodeId.


  You'll need your Mux access token `id`/`secret` for the variables (find them on the [Mux dashboard settings](https://dashboard.mux.com/settings/access-tokens)):


  ```

  {
    "secret": "mymuxsecret",
    "tokenId": "mytokenid"
  }

  ```

---

```graphql
query MuxVideoAssetByOneGraphNodeId(
  $tokenId: String!
  $secret: String!
  $oneGraphNodeId: ID!
) {
  oneGraphNode(
    auths: { muxAuth: { accessToken: { secret: $secret, tokenId: $tokenId } } }
    oneGraphId: $oneGraphNodeId
  ) {
    ... on MuxVideoAsset {
      ...MuxVideoAssetFragment
    }
  }
}

fragment MuxVideoAssetFragment on MuxVideoAsset {
  isLive
  id
  isTest
  errors {
    type
    messages
  }
  playbackIds {
    id
    policy
  }
  status
  oneGraphId
}
```

