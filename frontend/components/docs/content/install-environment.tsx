"use client"

import { Server, Container, Network, RotateCcw } from "lucide-react"
import { CodeBlock } from "../code-block"
import { Callout } from "../callout"

export function InstallEnvironmentContent() {
  return (
    <div>
      <p className="text-lg text-muted-foreground leading-relaxed mb-8">
        Each domain ships with one or more Docker-Compose stacks under{" "}
        <code>dt_arena/envs/&lt;env&gt;/</code> that emulate the real apps the agent
        interacts with — Salesforce, Gmail, Slack, GitHub, and friends. The evaluation
        runner brings them up automatically per task; this page covers the prerequisites,
        what each stack contains, and how to drive them by hand for debugging.
      </p>

      <Callout type="info" title="Prerequisites">
        Docker Engine 24+ (or Docker Desktop) with the <code>compose</code> plugin, and at
        least 16 GB of free disk for the bigger stacks (SuiteCRM, GitLab).
      </Callout>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Container className="h-5 w-5 text-accent" />
          Pull the sandbox images
        </h2>
        <p className="text-muted-foreground mb-3">
          Most environments ship a <code>docker-compose-hub.yml</code> file that pulls
          prebuilt images. The first task in a domain pulls them on demand, so you can
          either let the runner do it or warm the cache up front:
        </p>
        <CodeBlock
          code={`# Warm the image cache for a domain (CRM example)
docker compose -f dt_arena/envs/salesforce_crm/docker-compose-hub.yml pull

# Or all environments at once
for f in dt_arena/envs/*/docker-compose-hub.yml; do
  docker compose -f "$f" pull
done`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Server className="h-5 w-5 text-accent" />
          Bring up a single environment
        </h2>
        <p className="text-muted-foreground mb-3">
          For interactive debugging — for example, watching the SuiteCRM UI while you run
          a task — start the stack manually:
        </p>
        <CodeBlock
          code={`# Salesforce CRM (SuiteCRM + MariaDB)
docker compose -f dt_arena/envs/salesforce_crm/docker-compose.yml up -d

# Browse the UI
open http://localhost:8080      # SuiteCRM dashboard

# Tear down (and reset state)
docker compose -f dt_arena/envs/salesforce_crm/docker-compose.yml down -v`}
          language="bash"
        />
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Network className="h-5 w-5 text-accent" />
          Port allocation for parallel runs
        </h2>
        <p className="text-muted-foreground mb-3">
          When you run more than one task at a time the runner allocates dynamic ports out
          of a configurable range so multiple sandbox copies can coexist. Pin the range
          either via CLI flag or env var:
        </p>
        <CodeBlock
          code={`# CLI flag
python eval/evaluation.py --task-file tasks.jsonl --max-parallel 4 \\
  --port-range 10000-12000

# Or environment variable (picked up by every entrypoint)
export DT_PORT_RANGE="10000-12000"`}
          language="bash"
        />
        <p className="text-muted-foreground mt-3">
          Each environment exposes its ports via dynamic variables (e.g.{" "}
          <code>SALESFORCE_API_PORT</code>) that the runner injects into both the MCP
          server and the task <code>setup.sh</code>. The mapping lives in{" "}
          <code>dt_arena/config/env.yaml</code>.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <RotateCcw className="h-5 w-5 text-accent" />
          Resetting between tasks
        </h2>
        <p className="text-muted-foreground mb-3">
          Many environments support fast in-place resets without recreating containers,
          via a <code>reset.sh</code> mounted inside the container and registered under{" "}
          <code>reset_scripts:</code> in <code>env.yaml</code>:
        </p>
        <CodeBlock
          code={`# dt_arena/config/env.yaml
environments:
  salesforce:
    docker_compose: "dt_arena/envs/salesforce_crm/docker-compose.yaml"
    reset_scripts:
      mariadb: "/scripts/reset.sh"   # Path INSIDE the container
    ports:
      SALESFORCE_API_PORT:
        default: 8080
        container_port: 8080`}
          language="yaml"
        />
        <p className="text-muted-foreground mt-3">
          When the runner finishes a task it calls{" "}
          <code>docker exec &lt;container&gt; /scripts/reset.sh</code> instead of bringing
          the whole stack down. New environments get reset support by mounting a script
          and adding it under <code>reset_scripts</code>.
        </p>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Available environments</h2>
        <p className="text-muted-foreground mb-3">
          The full registry lives at <code>dt_arena/envs/registry.yaml</code>. As of the
          latest release the platform ships sandboxes for Gmail, Google Calendar / Docs /
          Drive / Sheets / Forms, Slack, Zoom, Atlassian, WhatsApp, X, LinkedIn, Reddit,
          Notion, Dropbox, GitHub, GitLab, Snowflake, Databricks, PayPal, Robinhood,
          Chase, ServiceNow, Salesforce CRM, OS-Filesystem, Code-Terminal, Browser
          (e-commerce), arXiv (research), Telecom, Hospital (medical), Yahoo Finance,
          Booking, Expedia, Southwest, United, Enterprise, FedEx, and DoorDash. See the{" "}
          <strong>Environment</strong> sidebar for the per-app docs page.
        </p>
      </div>

      <Callout type="warning" title="Linux + sudo for Docker">
        On Linux, the per-task setup scripts call <code>sudo docker exec ...</code> to
        seed databases inside containers. Add yourself to the <code>docker</code> group or
        configure passwordless sudo for <code>/usr/bin/docker</code> if running unattended.
      </Callout>
    </div>
  )
}
