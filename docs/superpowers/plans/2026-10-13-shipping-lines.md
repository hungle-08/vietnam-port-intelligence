# Shipping lines implementation plan

> For agentic workers: use superpowers:executing-plans for inline execution.

Goal: Source-backed top 10 container carriers on Home, stored as Neon history and reusable identities.
Architecture: pure validated parser + snapshot JSON -> additive SQL tables -> server-only repository -> localized ranking component.
Spec: docs/superpowers/specs/2026-10-13-shipping-lines.md

- [x] Extract one dated primary-source snapshot; collect brand references, keep retrieval provenance.
- [x] Test parser: handle grouped names, comma numbers, chart share vs charter share, missing/inconsistent snapshot rejection. Implement parser and import CLI.
- [x] Add migration for identities, snapshot headers, rankings, empty carrier-port relation; seed dev then production and verify idempotency/counts/numeric payload.
- [x] Add repository and localized ranking UI, independent error state, shared 0–25% scale, TEU/vessels/date/source; preserve map and directory.
- [x] Run tests/lint/typecheck/build; fresh review and fix material issues; update documentation.

Existing checkout has no commits, so use it and do not create/stage a baseline commit. Preserve user files and database credentials. Browser inspection remains unavailable under prior tool policy; use static markup checks and explicit limitations.
