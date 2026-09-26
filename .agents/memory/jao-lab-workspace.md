---
name: JAO LAB workspace conventions
description: Durable monorepo details that are easy to miss when extending the JAO LAB commerce app.
---

The generated fetch client uses `Headers.entries()`, so the API client library TypeScript config must include `DOM.Iterable` in its `lib` list.

**Why:** Without it, OpenAPI code generation succeeds but the workspace library typecheck fails on the generated client.

**How to apply:** Preserve `DOM.Iterable` when changing the shared API client TypeScript configuration or regenerating the client.