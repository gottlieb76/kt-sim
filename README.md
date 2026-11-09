# KT-Sim

A Kill Team simulator.

Browser-based combat probability calculator built with React, TypeScript, and Vite.
The project is in its initial setup phase. An exact [probability engine](docs/probability-engine.md)
supports chained rolls, selective rerolls, configurable outcomes, and branch inspection.
The calculator page supports 1–12 D6s, hit/crit thresholds, and a shared reroll
budget with selectable policies. Inspect each stage's outcomes as exact fractions
and percentages. Kill Team combat resolution is not implemented yet.

See the [living roadmap](docs/roadmap.md) for milestones and deliverables, and
the [linked backlog](docs/probability-lab-backlog.md) for evolving ideas and
acceptance criteria. A bounded immutable stage API now supports code-first composition with complete
die histories; the workbench still uses the efficient count-only calculator.
Next: connect composed experiments to minimal stage inspection.

## Development

Requires Node.js 24 and npm. An `.nvmrc` file is included for users of nvm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite.

### Accessing the development VM from your host machine

Start the development server in the project directory on the VM:

```sh
npm run dev
```

On your host machine, open a terminal and forward port 5173 over SSH:

```sh
ssh -N -L 5173:127.0.0.1:5173 frederik@<VM-IP>
```

Replace `<VM-IP>` with the VM's IP address or SSH hostname. Open
[http://localhost:5173](http://localhost:5173) in your host browser. Keep both
the development server and SSH tunnel running; press Ctrl+C to stop either one.
If Vite reports a different port, use that port in the tunnel and browser URL.

## Checks and builds

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run preview
```

The build produces static files in `dist/` and requires no application backend.
Offline caching will be added as features are developed.

Pull requests targeting `trunk` run the `PR tests` workflow on Node.js 24 using
`npm ci` followed by `npm test`. The check is named `npm tests`; failing tests
fail the check. When branch protection or rulesets are available, require this
check for `trunk` to enforce it as a merge gate. Adding the workflow alone does
not prevent merging. The current private repository's plan does not support
enforcing branch protection or rulesets, as reported by the GitHub API.

Licensed under the [MIT License](LICENSE).
