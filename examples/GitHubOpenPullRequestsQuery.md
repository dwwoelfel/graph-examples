---
operationName: GitHubOpenPullRequestsQuery
services:
  - service: GITHUB
    slug: github
    friendlyServiceName: GitHub
    typePrefix: GitHub
doc: >
  Fetch the first ten open pull requests for a GitHub repository, sorted by when
  they were opened.

---

```graphql
query GitHubOpenPullRequestsQuery {
  gitHub {
    repository(name: "graphql-js", owner: "graphql") {
      pullRequests(
        orderBy: { direction: DESC, field: CREATED_AT }
        first: 10
        states: OPEN
      ) {
        nodes {
          title
        }
      }
    }
  }
}
```

