---
operationName: GetNpmPackageDownloads
services:
  - NPM
---

```graphql
query GetNpmPackageDownloads($name: String!) {
  npm {
    package(name: $name) {
      downloads {
        lastMonth {
          count
        }
      }
    }
  }
}
```

