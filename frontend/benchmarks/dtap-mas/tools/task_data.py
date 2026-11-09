"""Assemble one synthesized task into a single JSON document for the Task view.

A task is either a pipeline run directory (spec.json, r<round>_<stage>.json, history/) or a finalized task folder
(task.json, memory/). The document holds what the Task view draws: people and their ties, agents and their tools
and memory.md, channels, the external attacker with their entry and the privilege path, assets and where they live,
the history timeline, the checks, the story ledger and the judge's review.

    Used by export_snapshot.py with DTAP_MAS_ROOT pointing at a temporary source archive.
"""
from __future__ import annotations

import json
import os
import re
import sys
from pathlib import Path

if not os.environ.get("DTAP_MAS_ROOT"):
    raise RuntimeError("Set DTAP_MAS_ROOT to the MAS source checkout, or run export_snapshot.py --source PATH.")
REPO = Path(os.environ["DTAP_MAS_ROOT"]).resolve()
sys.path.insert(0, str(REPO / "src"))

from worldgen.pipeline.catalog import RISK_CATEGORIES  # noqa: E402
from worldgen.topology.availability import availability  # noqa: E402
from worldgen.topology.schema import World, category_of  # noqa: E402

WORLDS = REPO / "src" / "worldgen" / "topology" / "worlds"
# Which tool an attack needs, by the kind of end state it checks.
HARM_SERVICE = {"payment": "paypal", "payment_request": "paypal", "email": "gmail", "repo_file": "github",
                "pr_merged": "github", "issue": "github", "event": "calendar", "event_changed": "calendar",
                "channel_member": "slack"}


def is_task(d: Path) -> bool:
    return (d / "spec.json").exists() or (d / "task.json").exists()


def _latest(d: Path, stage: str) -> dict | None:
    files = sorted(d.glob(f"r*_{stage}.json"), key=lambda f: int(re.match(r"r(\d+)_", f.name).group(1)))
    return json.loads(files[-1].read_text()) if files else None


def _status(d: Path) -> str:
    log = (d / "log.txt").read_text() if (d / "log.txt").exists() else ""
    if "FINALIZED" in log or (d / "task.json").exists():
        return "finalized"
    return "discarded" if "DISCARDED" in log else "in progress"


def _world(world_type: str, graft: dict) -> World:
    from worldgen.pipeline.gates import apply_graft
    from worldgen.pipeline.artifacts import Graft
    base = World.model_validate(json.loads((WORLDS / f"{world_type.lower()}-01.json").read_text()))
    return apply_graft(base, Graft.model_validate(graft))


def load_task(path: str | Path) -> dict:
    d = Path(path)
    if (d / "task.json").exists() and not (d / "spec.json").exists():
        return _from_finalized(d)
    spec = json.loads((d / "spec.json").read_text())
    intent, ep, plan = _latest(d, "intent"), _latest(d, "cast"), _latest(d, "plan")
    if not (intent and ep and plan):
        raise ValueError(f"{d}: the task has not reached the plan stage yet")
    seed, verify, review = _latest(d, "seed"), _latest(d, "verify"), _latest(d, "review")
    hist = d / "history"
    ledger = json.loads((hist / "ledger.json").read_text()) if (hist / "ledger.json").exists() else None
    memory = {f.stem.removeprefix("memory_"): f.read_text() for f in sorted(hist.glob("memory_*.md"))} if hist.is_dir() else {}
    world = _world(spec["world_type"], ep.get("graft", {}))
    return _assemble(task_id=spec["task_id"], world_type=spec["world_type"], category=spec["risk_category"],
                     structure=spec.get("structure"), status=_status(d), intent=intent, ep=ep, plan=plan,
                     seed=seed or {}, verify=verify, review=review, ledger=ledger, memory=memory, world=world)


def _from_finalized(d: Path) -> dict:
    from worldgen.pipeline.taskfiles import load
    t, agents, attack, _ = load(d)
    intent = t["provenance"]["intent"]
    # A benign task has no attack.json: no attacker, victims or attack checks to show.
    mal = ({"category": attack["risk_category_code"], **{k: attack[k] for k in (
        "actor", "victims", "asset_ids", "goal", "harm", "success_condition", "entry", "entry_points", "compromised")},
        "injection_edge": attack.get("injection_edge", []), "injection_note": attack.get("injection_note", ""),
        "injection_payload": attack.get("injection_payload", ""), "injection_subject": attack.get("injection_subject", ""),
        "harm_node": attack.get("harm_node")}
        if attack else {"actor": None, "victims": [], "asset_ids": [], "goal": "", "harm": "", "success_condition": "",
                        "entry": None, "entry_points": [], "compromised": None, "injection_edge": [], "injection_note": "",
                        "injection_payload": "", "injection_subject": "", "harm_node": None})
    # The benign version has no attacker: leave out the outsider cast for the attack (its intent role is_actor).
    actor_roles = set() if attack else {r["key"] for r in intent.get("roles", []) if r.get("is_actor")}
    people = [p for p in t["participants"] if p["role"] not in actor_roles]
    ep = {"casting": {p["role"]: p["id"] for p in people if p["role"] != "bystander"},
          "bystanders": [p["id"] for p in people if p["role"] == "bystander"],
          "graft": t["provenance"]["graft"], "now": t["now"], "context": t["context"],
          "principal_goals": t["benign"]["principal_goals"], "task_graph": t["benign"].get("task_graph", []),
          "assets": t["assets"], "malicious": mal}
    plan = {"agents": [{**{k: a.get(k) for k in ("id", "principal", "name", "role", "access")},
                        "briefing": a.get("briefing") or a.get("instructions", "")} for a in agents],
            "channels": t["channels"]}
    memory = {f.stem: f.read_text() for f in sorted((d / "memory").glob("*.md"))} if (d / "memory").is_dir() else {}
    world = _world(t["world"]["world_type"], ep["graft"])
    val = t.get("validation") or {}
    review = {"scores": val["review_scores"], "summary": val["review_summary"], "verdict": "pass"} if "review_scores" in val else None
    result = _assemble(task_id=t["task_id"], world_type=t["world"]["world_type"], category=t["risk_category"],
                       structure=t.get("structure"), status="finalized", intent=intent, ep=ep, plan=plan, seed=t["seed"],
                       verify={**t["verification"], "attack": attack["checks"] if attack else []}, review=review, ledger=(t.get("history") or {}).get("ledger"),
                       memory=memory, world=world)
    # The exported world.json is the source of truth for the finalized task's accounts; it can carry services the
    # synthesis base world does not model (e.g. x), so overlay them — otherwise the viz would hide a granted account.
    try:
        raw_people = json.loads((d / "world.json").read_text()).get("people", {})
        for p in result["people"]:
            acc = raw_people.get(p["id"], {}).get("accounts")
            if acc:
                p["accounts"] = acc
    except Exception:
        pass
    # A recorded (or synthesized) multi-agent run, if one sits in the task's trajectory/ folder: one file per agent
    # plus an optional result.json. The viz renders these as a timeline.
    tdir = d / "trajectory"
    if tdir.is_dir():
        try:
            runs = [json.loads(f.read_text()) for f in sorted(tdir.glob("agent_*.json"))]
            res = tdir / "result.json"
            result["trajectory"] = {"agents": runs, "result": json.loads(res.read_text()) if res.exists() else None}
        except Exception:
            result["trajectory"] = None
    return result


def _assemble(*, task_id, world_type, category, structure, status, intent, ep, plan, seed, verify, review, ledger,
              memory, world: World) -> dict:
    mal = ep["malicious"]
    actor = mal["actor"]
    role_of = {pid: k for k, pid in ep["casting"].items()}
    pids = list(dict.fromkeys([*ep["casting"].values(), *ep["bystanders"]]))
    agents_of: dict[str, list[dict]] = {}
    for a in plan["agents"]:
        agents_of.setdefault(a["principal"], []).append(a)
    cat = RISK_CATEGORIES.get(category)
    harm_services = sorted({HARM_SERVICE[c["kind"]] for c in (verify or {}).get("attack", []) if c["kind"] in HARM_SERVICE}
                           | ({"whatsapp", "slack"} & {c["service"] for c in plan["channels"]}
                              if any(c["kind"] == "message" for c in (verify or {}).get("attack", [])) else set()))

    people = []
    for p in pids:
        x = world.people[p]
        av = availability(p, x)
        people.append({
            "id": p, "name": x.name, "age": x.age, "gender": x.gender, "occupation": x.occupation,
            "location": x.location, "life_stage": x.life_stage, "traits": x.traits, "accounts": x.accounts,
            "role": role_of.get(p, "bystander"), "is_attacker": p == actor, "is_victim": p in mal.get("victims", []),
            "compromised": p == mal.get("compromised"), "has_agent": p in agents_of,
            "availability": {"tz": av.tz, "awake": f"{av.wake:02d}:00–{av.sleep:02d}:00",
                             "work": f"{av.work_start:02d}:00–{av.work_end:02d}:00, days {av.work_days}" if av.work_days else None},
        })
    ties = [{"a": r.a, "b": r.b, "type": r.type, "context": r.context, "category": category_of(r.type),
             "closeness": r.closeness} for r in world.relationships if r.a in pids and r.b in pids and r.a != r.b]

    agents = [{"id": a["id"], "principal": a["principal"], "name": a["name"], "role": a["role"], "access": a["access"],
               "briefing": a.get("briefing", ""), "memory": memory.get(a["principal"]),
               "holds_harm_tool": bool(set(a["access"]) & set(harm_services))} for a in plan["agents"]]

    placed: dict[str, list[str]] = {}
    timeline = []
    for m in seed.get("messages", []):
        timeline.append({"id": m["id"], "ts": m["ts"], "kind": "message", "channel": m["channel"], "from": m["author"],
                         "text": m["text"], "assets": m.get("asset_ids", [])})
    for e in seed.get("emails", []):
        timeline.append({"id": e["id"], "ts": e["ts"], "kind": "email", "channel": "email", "from": e["sender"],
                         "to": [*e["to"], *e.get("cc", [])], "subject": e["subject"], "text": e["body"],
                         "assets": e.get("asset_ids", [])})
    for e in seed.get("events", []):
        timeline.append({"id": e["id"], "ts": e["start"], "kind": "event", "channel": "calendar", "from": e["owner"],
                         "to": e.get("attendees", []), "subject": e["title"],
                         "text": " · ".join(x for x in (e["start"].replace("T", " ")[:16] + "–" + e["end"][11:16],
                                                         e.get("location", ""), e.get("notes", "")) if x),
                         "assets": e.get("asset_ids", []), "calendar_owner": e["owner"]})
    for p in seed.get("payments", []):
        timeline.append({"id": p["id"], "ts": p["ts"], "kind": "payment", "channel": "paypal", "from": p["sender"],
                         "to": [p["recipient"]], "subject": f"{p['amount']:,.2f} {p.get('currency', 'USD')}",
                         "text": p.get("memo", ""), "assets": p.get("asset_ids", [])})
    repos = []
    for r in seed.get("repos", []):
        repos.append({"id": r["id"], "full_name": f"{r['owner']}/{r['name']}", "members": r["members"],
                      "files": [f["path"] for f in r["files"]], "assets": r.get("asset_ids", []),
                      "pull_requests": [{"number": p["number"], "title": p["title"], "author": p["author"], "head": p["head"],
                                         "files": [f["path"] for f in p["files"]]} for p in r.get("pull_requests", [])]})
        for pr in r.get("pull_requests", []):
            timeline.append({"id": pr["id"], "ts": pr["ts"], "kind": "pull_request", "channel": r["id"], "from": pr["author"],
                             "subject": f"PR #{pr['number']}: {pr['title']}", "text": pr.get("body", ""),
                             "assets": pr.get("asset_ids", [])})
        for i in r.get("issues", []):
            timeline.append({"id": i["id"], "ts": i["ts"], "kind": "issue", "channel": r["id"], "from": i["author"],
                             "subject": f"Issue #{i['number']}: {i['title']}", "text": i["body"], "assets": i.get("asset_ids", [])})
        for aid in r.get("asset_ids", []):
            placed.setdefault(aid, []).append(f"{r['owner']}/{r['name']} (files)")
    for x in timeline:
        for aid in x["assets"]:
            placed.setdefault(aid, []).append(x["id"])
    for b in seed.get("balances", []):
        for aid in b.get("asset_ids", []):
            placed.setdefault(aid, []).append(f"{b['owner']}'s PayPal balance")
    timeline.sort(key=lambda x: (x["ts"], x["id"]))

    return {
        "id": task_id, "title": intent["title"], "summary": intent["summary"], "status": status,
        "world_type": world_type, "domain": "personal" if world_type.startswith("P") else "coding", "now": ep["now"],
        "category": {"code": category, "name": cat.name if cat else category, "harm": cat.harm if cat else "",
                     "severity": cat.severity if cat else ""},
        "structure": structure, "context": ep["context"],
        "benign": {"workflow": intent["benign_workflow"], "steps": intent["benign_steps"],
                   "principal_goals": ep["principal_goals"], "task_graph": ep.get("task_graph", [])},
        "threat": {"model": "indirect", "attacker": actor, "entry": mal.get("entry", "external"),
                   "entry_points": mal.get("entry_points", []), "compromised": mal.get("compromised"),
                   "victims": mal.get("victims", []), "goal": mal["goal"], "harm": mal["harm"],
                   "success_condition": mal["success_condition"], "asset_ids": mal.get("asset_ids", []),
                   "injection_edge": mal.get("injection_edge", []), "injection_note": mal.get("injection_note", ""),
                   "injection_payload": mal.get("injection_payload", ""), "injection_subject": mal.get("injection_subject", ""),
                   "harm_node": mal.get("harm_node"), "harm_services": harm_services},
        "people": people, "ties": ties, "agents": agents,
        "channels": [{"id": c["id"], "service": c["service"], "kind": c["kind"], "name": c["name"], "members": c["members"],
                      "purpose": c.get("purpose", "")} for c in plan["channels"]],
        "assets": [{**a, "placed_in": placed.get(a["id"], [])} for a in ep["assets"]],
        "balances": seed.get("balances", []), "repos": repos, "timeline": timeline,
        "checks": {"benign": (verify or {}).get("benign", []), "attack": (verify or {}).get("attack", [])},
        "ledger": None if not ledger else {"happenings": len(ledger["happenings"]), "facts": ledger["facts"],
                                           "private_notes": [h for h in ledger["happenings"] if h["action"] == "note.private"]},
        "review": review and {"verdict": review.get("verdict"), "scores": review["scores"], "summary": review["summary"]},
    }


if __name__ == "__main__":
    print(json.dumps(load_task(sys.argv[1]), indent=1, ensure_ascii=False))
