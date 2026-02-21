#!/usr/bin/env python3
import warnings
warnings.filterwarnings("ignore", category=SyntaxWarning)

"""
Parse all config.yaml files from DecodingTrust-Agent dataset
and generate JSON files for the registry page.

Outputs:
  - public/data/tasks-index.json  (~1-2MB) - lightweight listing data
  - public/data/tasks/<slug>.json          - individual full task details
"""

import ast
import json
import re
import textwrap
import yaml
from pathlib import Path


DATASET_ROOT = Path("/home/zhaorun/DecodingTrust-Agent/dataset")
OUTPUT_DIR = Path("/home/zhaorun/decodingtrust-agent.github.io/frontend/public/data")

DOMAIN_AUTHORS = {
    "browser": "Tianneng Shi",
    "crm": "Zhaorun Chen",
    "os-filesystem": "Xiaogeng Liu",
    "telecom": "Mintong Kang",
    "travel": "Xun Liu",
    "windows": "Yuzhou Nie",
    "workflow": "Haibo Tong",
    "medical": "Chejian Xu",
    "customer-service": "Qichang Liu",
}


def determine_type_and_threat(config_path: Path):
    parts = config_path.relative_to(DATASET_ROOT).parts
    if len(parts) >= 2 and parts[1] == "benign":
        return "benign", None
    elif len(parts) >= 2 and parts[1] == "malicious":
        threat_model = parts[2] if len(parts) > 2 and parts[2] in ("direct", "indirect") else None
        return "malicious", threat_model
    return "unknown", None


def make_slug(config_path: Path) -> str:
    rel = config_path.relative_to(DATASET_ROOT)
    parts = list(rel.parts[:-1])
    slug = "-".join(str(p) for p in parts)
    slug = re.sub(r'[^a-zA-Z0-9_\-]', '-', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    return slug


def extract_function_source(source: str, func_name: str) -> str | None:
    """Extract a function's source code from a Python file using AST."""
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return None

    for node in ast.walk(tree):
        if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name == func_name:
            # Get the source lines for this function
            start = node.lineno - 1
            end = node.end_lineno if hasattr(node, 'end_lineno') and node.end_lineno else None
            if end is None:
                return None
            lines = source.splitlines()
            func_lines = lines[start:end]
            return "\n".join(func_lines)
    return None


def extract_judge_code(config_path: Path) -> dict:
    """Extract eval_task and eval_attack from judge.py next to config.yaml."""
    judge_path = config_path.parent / "judge.py"
    if not judge_path.exists():
        return {"judge_exists": False, "eval_task": None, "eval_attack": None}

    try:
        source = judge_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return {"judge_exists": True, "eval_task": None, "eval_attack": None}

    eval_task = extract_function_source(source, "eval_task")
    eval_attack = extract_function_source(source, "eval_attack")

    return {
        "judge_exists": True,
        "eval_task": eval_task,
        "eval_attack": eval_attack,
    }


def parse_config(config_path: Path):
    with open(config_path, "r") as f:
        try:
            config = yaml.safe_load(f)
        except yaml.YAMLError:
            return None

    if not config or not isinstance(config, dict):
        return None

    task = config.get("Task", {}) or {}
    agent = config.get("Agent", {}) or {}
    attack = config.get("Attack", {}) or {}
    red_team = config.get("RedTeamingAgent", {}) or {}
    policies = config.get("Policies", []) or []

    task_type, threat_model = determine_type_and_threat(config_path)

    task_id = task.get("task_id", "")
    rel_parts = config_path.relative_to(DATASET_ROOT).parts
    folder_domain = rel_parts[0] if rel_parts else ""
    slug = make_slug(config_path)

    risk_category = attack.get("risk_category", None)
    malicious_goal = attack.get("malicious_goal", None)
    threat_model_from_config = attack.get("threat_model", None)

    if threat_model_from_config:
        threat_model = threat_model_from_config

    attack_type_val = attack.get("attack_type", None)
    if attack_type_val == "none" or task_type == "benign":
        task_type = "benign"
        threat_model = None

    # Parse MCP servers
    mcp_servers = []
    for server in (agent.get("mcp_servers", []) or []):
        if isinstance(server, dict):
            mcp_servers.append({
                "name": server.get("name", ""),
                "enabled": server.get("enabled", True),
                "tool_blacklist": server.get("tool_blacklist", []),
            })

    author = DOMAIN_AUTHORS.get(folder_domain, None)

    # Extract judge.py verifier code
    judge = extract_judge_code(config_path)

    # Full entry (for detail page)
    full_entry = {
        "slug": slug,
        "task_id": str(task_id),
        "domain": folder_domain,
        "author": author,
        "type": task_type,
        "threat_model": threat_model if task_type == "malicious" else None,
        "task_category": task.get("task_category", None),
        "task_instruction": task.get("task_instruction", ""),
        "template_id": task.get("template_id", None),
        "base_task": task.get("base_task", None),
        "benign_task_ref": task.get("benign_task_ref", None),
        "risk_category": risk_category,
        "malicious_goal": malicious_goal,
        "attack_strategy": attack.get("attack_strategy", None),
        "difficulty": attack.get("difficulty", None),
        "attack_vector": attack.get("attack_vector", None),
        "target_tool": attack.get("target_tool", None),
        "risk_id": attack.get("risk_id", None),
        "attack_turns": attack.get("attack_turns", None),
        "agent_name": agent.get("name", None),
        "agent_system_prompt": agent.get("system_prompt", ""),
        "mcp_servers": mcp_servers,
        "red_team_injections": red_team.get("available_injections", None),
        "red_team_env_injection": red_team.get("env_injection_config", None),
        "red_team_skills": red_team.get("skills", None),
        "policies": policies if policies else None,
        "config_path": str(config_path.relative_to(DATASET_ROOT)),
        # Judge/Verifier
        "judge_exists": judge["judge_exists"],
        "eval_task": judge["eval_task"],
        "eval_attack": judge["eval_attack"],
    }

    # Index entry (lightweight for listing page)
    instruction = task.get("task_instruction", "")
    goal = malicious_goal or ""

    index_entry = {
        "slug": slug,
        "task_id": str(task_id),
        "domain": folder_domain,
        "author": author,
        "type": task_type,
        "threat_model": threat_model if task_type == "malicious" else None,
        "task_category": task.get("task_category", None),
        "task_instruction": instruction[:300] + ("..." if len(instruction) > 300 else ""),
        "risk_category": risk_category,
        "malicious_goal": goal[:300] + ("..." if len(goal) > 300 else "") if goal else None,
        "difficulty": attack.get("difficulty", None),
        "has_judge": judge["judge_exists"],
        "has_attack_turns": bool(attack.get("attack_turns")),
    }

    return index_entry, full_entry


def main():
    index_tasks = []
    config_files = list(DATASET_ROOT.rglob("config.yaml"))
    print(f"Found {len(config_files)} config.yaml files")

    tasks_dir = OUTPUT_DIR / "tasks"
    tasks_dir.mkdir(parents=True, exist_ok=True)

    seen_slugs = set()
    judge_count = 0
    for config_path in sorted(config_files):
        result = parse_config(config_path)
        if result is None:
            continue
        index_entry, full_entry = result
        if not index_entry["task_id"]:
            continue

        slug = full_entry["slug"]
        if slug in seen_slugs:
            print(f"  WARNING: duplicate slug {slug}")
            continue
        seen_slugs.add(slug)

        if full_entry["judge_exists"]:
            judge_count += 1

        index_tasks.append(index_entry)

        detail_path = tasks_dir / f"{slug}.json"
        with open(detail_path, "w") as f:
            json.dump(full_entry, f, indent=None, ensure_ascii=False)

    print(f"Successfully parsed {len(index_tasks)} tasks ({judge_count} with judge.py)")

    # Compute summary stats
    domains = sorted(set(t["domain"] for t in index_tasks))
    types = sorted(set(t["type"] for t in index_tasks))
    threat_models = sorted(set(t["threat_model"] for t in index_tasks if t["threat_model"]))
    risk_categories = sorted(set(t["risk_category"] for t in index_tasks if t["risk_category"]))

    output = {
        "version": "0.1",
        "total_tasks": len(index_tasks),
        "domains": domains,
        "types": types,
        "threat_models": threat_models,
        "risk_categories": risk_categories,
        "tasks": index_tasks,
    }

    index_path = OUTPUT_DIR / "tasks-index.json"
    with open(index_path, "w") as f:
        json.dump(output, f, indent=None, ensure_ascii=False)

    old_path = OUTPUT_DIR / "tasks.json"
    if old_path.exists():
        old_path.unlink()

    print(f"Index written to {index_path} ({index_path.stat().st_size / 1024 / 1024:.1f} MB)")
    print(f"Task details written to {tasks_dir}/ ({len(list(tasks_dir.glob('*.json')))} files)")
    print(f"Domains: {domains}")
    print(f"Risk categories ({len(risk_categories)})")


if __name__ == "__main__":
    main()
