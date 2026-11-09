# DecodingTrust Agent website

The self-hosted Next.js website for DecodingTrust Agent and its benchmark family.

```text
frontend/
  app/                # Routes and page metadata
  benchmarks/         # Benchmark registry, DTap components and the complete MAS visualizer
  components/         # Shared site layout and UI primitives
  lib/                # Shared data access and helpers
  public/             # Static site assets; benchmark assets are generated before dev/build
backend/
  traj-api/           # Existing DTap task and trajectory API
deploy/               # Server configuration and deployment utilities
```

See [benchmark modules](frontend/benchmarks/README.md) for the module structure, local preview and build commands,
and [DTap-MAS](frontend/benchmarks/dtap-mas/README.md) for data provenance and export tools.

```bash
cd frontend
npm ci
npm run dev -- --hostname 0.0.0.0 --port 3100
```

Open `http://localhost:3100/benchmarks`. The family directory and MAS visualizations use bundled data.
Existing DTap pages additionally need their API; dynamic routes and production builds need `DT_DATA_ROOT`.
Details are in the benchmark module guide. Production is deployed manually on the existing server.
