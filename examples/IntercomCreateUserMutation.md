---
operationName: IntercomCreateUserMutation
services:
  - service: INTERCOM
    slug: intercom
    friendlyServiceName: Intercom
    typePrefix: Intercom
doc: |
  Create a new user on Intercom.

---

```graphql
mutation IntercomCreateUserMutation {
  intercom {
    createUser(input: { email: "newuser@example.com", name: "New User" }) {
      user {
        id
        email
      }
    }
  }
}
```

