# Project conventions

- Use the generated Lovable auth helper for Google sign-in with a public same-origin return URL; existing session handling opens the tracker after authentication.
- Keep managed OAuth paths outside service-worker caching so sign-in always reaches the network.