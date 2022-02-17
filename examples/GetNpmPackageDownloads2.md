---
operationName: GetNpmPackageDownloads2
services:
  - service: NPM
    slug: npm
    friendlyServiceName: npm
    typePrefix: Npm
doc: Get Npm package downloads

---

```graphql
query GetNpmPackageDownloads2($name: String!) {
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

