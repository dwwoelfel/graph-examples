---
operationName: GetNpmPackageDownloads
services:
  - NPM
doc: >
  Get the downloads for a package on npm given the package name
  
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

