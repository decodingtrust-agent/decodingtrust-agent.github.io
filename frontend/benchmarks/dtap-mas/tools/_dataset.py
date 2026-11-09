"""Build task cards and paired navigation from the MAS dataset index."""
from pathlib import Path
import json

def world_id(world_type: str) -> str:
    """The base world a task is set in (its graft is applied on top): world type P3 is world p3-01."""
    return f"{world_type.lower()}-01"


def find_worlds(dirs: list[Path]) -> dict[str, Path]:
    worlds: dict[str, Path] = {}
    for d in dirs:
        for f in sorted(d.glob("*.json")):
            if f.name.endswith(".agents.json"):
                continue
            if f.stem in worlds:
                raise SystemExit(f"world id {f.stem!r} found twice: {worlds[f.stem]} and {f}")
            worlds[f.stem] = f
    return worlds


def card(d: Path, kind: str) -> dict:
    """The fields the DTAP site's benchmark cards show (frontend/app/benchmark/page.tsx): the task id, type, threat
    model, the principals' requests (task_instruction), the malicious goal, tags, and the group's size."""
    import yaml
    t = json.loads((d / "task.json").read_text())
    agents = json.loads((d / "agents.json").read_text())
    attack = json.loads((d / "attack.json").read_text()) if (d / "attack.json").exists() else None
    names = {p["id"]: p["name"] for p in t["participants"]}
    with_agents = {a["principal"] for a in agents}  # one request per principal that has an agent
    goals = t.get("benign", {}).get("principal_goals", {})
    asks = {p: goals[p] for p in goals if p in with_agents}
    if not asks:  # an older task may still carry the request per agent as task_instruction
        for a in agents:
            if a.get("task_instruction"):
                asks.setdefault(a["principal"], a["task_instruction"])
    return {"task_id": yaml.safe_load((d / "config.yaml").read_text())["Task"]["task_id"],
            "type": "rt" if kind == "rt" else "benign",
            "task_instruction": "\n".join(f"{names.get(p, p).split()[0]}: {x}" for p, x in asks.items()),
            "malicious_goal": attack["goal"] if attack else None,
            "people": len(t["participants"]) - (1 if attack else 0), "agents": len(agents),
            "principals": len({a["principal"] for a in agents})}


def dataset_tasks(d: Path) -> dict[str, dict]:
    """A dataset root's tasks (its index.json), keyed by their path in the dataset (coding/benign/003,
    coding/rt/indirect/<category>/001): both versions of a scenario, each naming the other."""
    out = {}
    for r in json.loads((d / "index.json").read_text()):
        for kind, key, pair in (("benign", r["benign"], r["malicious"]), ("rt", r["malicious"], r["benign"])):
            parts = key.split("/")  # <domain>/benign/<n>  or  <domain>/rt/<threat model>/<category>/<n>
            slug = key.split("/")[3] if kind == "rt" else json.loads((d / pair / "attack.json").read_text())["risk_category"]
            out[key] = {"dir": d / key, "kind": kind, "pair": pair, "scenario": r["scenario"], "domain": r["domain"],
                        "title": r["title"], "category": r["risk_category"], "world": world_id(r["world_type"]),
                        "threat_model": parts[2] if kind == "rt" else None, "category_slug": slug if kind == "rt" else None,
                        "tags": [slug, "indirect", r["domain"]] if kind == "rt" else [r["domain"], world_id(r["world_type"])],
                        **card(d / key, kind)}
    return out
