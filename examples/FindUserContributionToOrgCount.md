---
operationName: FindUserContributionToOrgCount
services:
  - GITHUB
doc: >
  Finds out how many PRs have been merged across an org for a given user - use
  this to reward your community members, like Gatsby!

---

```graphql
query FindUserContributionToOrgCount(
  # You'll need to format this string when fetching this query
  # at runtime.
  # For example, your JavaScript might look like:
  # const query = `org:${repoOwner} author:${username} type:pr is:merged`;
  $query: String = "org:onegraph author:sgrove type:pr is:merged"
) {
  gitHub {
    search(first: 1, query: $query, type: ISSUE) {
      contributionCount: issueCount
    }
  }
}
```

