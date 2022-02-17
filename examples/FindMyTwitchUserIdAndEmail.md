---
operationName: FindMyTwitchUserIdAndEmail
services:
  - TWITCH_TV
doc: |
  Finds a few details about the user if they're logged into Twitch:

  - Twitch `userId`
  - email
  - whether the email has been verified by Twitch (`emailVerified`)
  - The display name (what you'd see in the Twitch chat)

---

```graphql
query FindMyTwitchUserIdAndEmail {
  me {
    twitchTv {
      id
      email
      emailVerified
      displayName
    }
  }
}
```

