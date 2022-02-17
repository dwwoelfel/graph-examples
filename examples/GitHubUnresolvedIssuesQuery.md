---
operationName: GitHubUnresolvedIssuesQuery
services:
  - service: GITHUB
    slug: github
    friendlyServiceName: GitHub
    typePrefix: GitHub
doc: >
  Fetch the first ten open issues for a GitHub repository, sorted by when they
  were created.

---

```graphql
query GitHubUnresolvedIssuesQuery {
  gitHub {
    viewer {
      issues(
        orderBy: { direction: DESC, field: CREATED_AT }
        first: 10
        states: OPEN
      ) {
        edges {
          node {
            title
            repository {
              nameWithOwner
            }
          }
        }
      }
    }
  }
}
```

