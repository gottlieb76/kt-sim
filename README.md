# KT-Sim

A Kill Team simulator.

Browser-based combat probability calculator built with React, TypeScript, and Vite.
The project is in its initial setup phase; combat calculations are not implemented yet.

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
npm run build
npm run preview
```

The build produces static files in `dist/` and requires no application backend.
Offline caching and automated tests will be added as features are developed.

Licensed under the [MIT License](LICENSE).
