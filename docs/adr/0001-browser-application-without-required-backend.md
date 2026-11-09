# 0001: Browser application without a required backend

Status: Accepted
Date: 2026-11-09

## Context and goal

KT-Sim is a browser-based decision tool. Users must be able to calculate and
inspect results without depending on a running application backend, previously
saved state, or a network connection. An available backend may enhance this
standalone experience with state such as saves, imports, and models. This boundary
applies across the roadmap, from the Probability Lab to later game-rule support.

## Decision

Build KT-Sim as a standalone browser application with all logic needed for core
workflows executed client side. Bundle the engine, supported rule behavior, and
baseline data required for those workflows with the application. Core use must
work from a fresh session without persisted state, server-side evaluation,
authentication, or runtime requests to external services. Temporary in-memory
state for inputs and calculations is expected; "without state" means no dependency
on previously saved browser or backend state.

The application can be served as static assets. Hosting delivers those assets;
it is not an application backend. Once the required assets and data are available
locally, supported workflows must work offline with the same calculation behavior
as online use.

Keep the deterministic TypeScript engine independent of React, game-specific
rules, and network access. Expensive evaluation remains client side, using
explicit resource limits and worker execution where needed to keep the interface
responsive. Never silently approximate results to fit browser constraints.

An optional backend may provide persistence and additional content, including
saves, imports, and models. Keep these integrations behind explicit application
interfaces and adapters, separate from the engine, domain behavior, and
presentation. Backend transport and storage formats must be translated and
validated at this boundary rather than becoming engine contracts. Standalone
operation must not need a backend adapter to be present.

When a backend is unavailable, core workflows remain usable. Clearly identify
enhancements that need connectivity or content that has not been loaded; do not
silently substitute baseline data for a requested saved model. Once compatible
content is loaded locally, its calculation behavior remains client side. This
decision permits backend enhancements without committing to their delivery or a
particular API, storage system, or framework. Requiring a backend for core use
would need a new architectural decision.

## Alternatives and tradeoffs

- A required backend could centralize computation and data updates, but would
  make availability depend on connectivity and a maintained service.
- A hybrid application with required runtime APIs could reduce bundled data,
  but would prevent standalone offline use unless equivalent local behavior and
  data were also supplied.
- A native desktop application could support local execution, but would add
  platform-specific distribution work beyond the browser-based product.

## Consequences and verification

Static hosting and local execution simplify deployment and allow use without
transmitting calculation inputs to a server. Browser CPU, memory, and storage
constraints bound supported experiments; failures must be explicit and actionable.
Bundled data and application assets need compatible versioning and an update
strategy. Client-side code and bundled data are inspectable and cannot contain
secrets.

Optional backend state adds integration, compatibility, and failure-handling
costs. Keep those costs outside the standalone core, and refine persistence,
import, and model features as separate stories when scheduled.

This decision establishes the architecture; it does not claim offline reopening
is already implemented. [Offline application caching](../probability-lab-backlog.md#independent--offline-usability--engineering-add-offline-application-caching)
(#13) remains independently scheduled and does not gate Milestone 1, as described
in the [roadmap](../roadmap.md#engineering-and-validation).

Verify core workflows in a fresh session with no saved browser state and no
backend configured. When backend enhancements are delivered, verify both the
enhanced path and backend unavailability, including actionable errors and continued
standalone calculation. Check imported or retrieved content at the adapter
boundary and ensure equivalent local inputs produce identical exact results.

Verify delivered offline support by loading the application successfully online,
disconnecting, reopening it, and exercising supported calculations and bundled
data without runtime network dependencies. Compare exact results online and
offline, and check version-consistent updates and recovery after reconnecting
without clearing existing browser data. Continue to verify client-side evaluation
limits and responsiveness as engine capabilities grow.
