#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import zipfile
from collections import OrderedDict, defaultdict
from pathlib import Path
from typing import Any

RUN_SLUG = "paper_v1"
RUN_NAME = "DecodingTrust Agent Paper Results"
SOURCE_LABEL = "DecodingTrust_Agent.zip"
ASR_TABLE_PATH = "table/main/asr_by_domain.tex"
BSR_TABLE_PATH = "table/main/benign_acc_by_domain.tex"
METRIC_ORDER = ["bsr", "direct_asr", "indirect_asr"]
BENIGN_TABLE_CANDIDATES = ["benign_bsr.tex", "benign_BSR.tex", "benign_tsr.tex"]

DOMAINS = [
    {"key": "workflow", "label": "Workflow", "shortLabel": "Workflow", "sortOrder": 1},
    {"key": "crm", "label": "CRM", "shortLabel": "CRM", "sortOrder": 2},
    {"key": "customer-service", "label": "Customer Service", "shortLabel": "CS", "sortOrder": 3},
    {"key": "travel", "label": "Travel", "shortLabel": "Travel", "sortOrder": 4},
    {"key": "coding", "label": "Coding", "shortLabel": "Coding", "sortOrder": 5},
    {"key": "browser", "label": "Browser", "shortLabel": "Browser", "sortOrder": 6},
    {"key": "research", "label": "Research", "shortLabel": "Research", "sortOrder": 7},
    {"key": "os-filesystem", "label": "OS-FS", "shortLabel": "OS-FS", "sortOrder": 8},
    {"key": "os-gui", "label": "OS-GUI", "shortLabel": "OS-GUI", "sortOrder": 9},
    {"key": "finance", "label": "Finance", "shortLabel": "Finance", "sortOrder": 10},
    {"key": "legal", "label": "Legal", "shortLabel": "Legal", "sortOrder": 11},
    {"key": "telecom", "label": "Telecom", "shortLabel": "Telecom", "sortOrder": 12},
    {"key": "medical", "label": "Medical", "shortLabel": "Medical", "sortOrder": 13},
]

DOMAIN_KEYS = [domain["key"] for domain in DOMAINS]
DOMAIN_LABELS = [domain["label"] for domain in DOMAINS]
METRIC_LABELS = {
    "bsr": "BSR",
    "direct_asr": "Direct ASR",
    "indirect_asr": "Indirect ASR",
}

DOMAIN_TABLE_DIRECTORIES = {
    "workflow": "workflow",
    "crm": "crm",
    "customer-service": "customer_service",
    "travel": "travel",
    "coding": "code",
    "browser": "browser",
    "research": "research",
    "os-filesystem": "os_filesystem",
    "os-gui": "os_gui",
    "finance": "finance",
    "legal": "legal",
    "telecom": "telecom",
    "medical": "medical",
}

FRAMEWORK_NAME_ALIASES = {
    "OpenAI Agents SDK": "OpenAI Agents",
    "OpenAI SDK": "OpenAI Agents",
    "Claude SDK": "Claude Code",
    "Claude Code": "Claude Code",
    "Google ADK": "Google ADK",
    "OpenClaw": "OpenClaw",
}

MODEL_NAME_ALIASES = {
    "Claude-Opus-4.6": "Opus-4.6",
    "Claude-Sonnet-4.5": "Sonnet-4.5",
    "Gemini-3-pro": "Gemini-3-Pro",
    "Gemini-3.1-Pro": "Gemini-3.1-Pro",
}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower())
    return slug.strip("-")


def escape_sql(value: str) -> str:
    return value.replace("'", "''")


def normalize_framework_name(value: str) -> str:
    return FRAMEWORK_NAME_ALIASES.get(value, value)


def normalize_model_name(value: str) -> str:
    return MODEL_NAME_ALIASES.get(value, value)


def unwrap_latex(text: str) -> str:
    patterns = [
        r"\\textbf\{([^{}]*)\}",
        r"\\textit\{([^{}]*)\}",
        r"\\multirow\{[^{}]*\}\{\*\}\{([^{}]*)\}",
        r"\\makecell\{([^{}]*)\}",
        r"\\multicolumn\{[^{}]*\}\{[^{}]*\}\{([^{}]*)\}",
    ]
    value = text
    changed = True
    while changed:
        changed = False
        for pattern in patterns:
            next_value = re.sub(pattern, r"\1", value)
            if next_value != value:
                value = next_value
                changed = True
    return value


def clean_cell(cell: str) -> str:
    value = cell.strip()
    value = value.replace("\\\\", " ")
    value = value.replace(r"\bf", "")
    value = unwrap_latex(value)
    value = value.replace(r"\%", "%")
    value = value.replace(r"\&", "&")
    value = value.replace("~", " ")
    value = value.replace("{", "")
    value = value.replace("}", "")
    value = re.sub(r"\\[a-zA-Z]+", "", value)
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def split_latex_rows(text: str) -> list[str]:
    tabular_match = re.search(
        r"\\begin\{tabular\}\{[^{}]*\}(?P<body>.*)\\end\{tabular\}",
        text,
        flags=re.DOTALL,
    )
    source = tabular_match.group("body") if tabular_match else text
    rows: list[str] = []
    current: list[str] = []
    brace_depth = 0
    index = 0

    while index < len(source):
        char = source[index]
        if char == "{":
            brace_depth += 1
        elif char == "}":
            brace_depth = max(0, brace_depth - 1)

        if (
            char == "\\"
            and index + 1 < len(source)
            and source[index + 1] == "\\"
            and brace_depth == 0
        ):
            row = "".join(current).strip()
            if row:
                rows.append(row)
            current = []
            index += 2
            continue

        current.append(char)
        index += 1

    tail = "".join(current).strip()
    if tail:
        rows.append(tail)
    return rows


def split_latex_cells(row: str) -> list[str]:
    cells: list[str] = []
    current: list[str] = []
    brace_depth = 0

    for char in row:
        if char == "{":
            brace_depth += 1
        elif char == "}":
            brace_depth = max(0, brace_depth - 1)

        if char == "&" and brace_depth == 0:
            cells.append("".join(current).strip())
            current = []
            continue

        current.append(char)

    cells.append("".join(current).strip())
    return cells


def strip_table_rule_commands(value: str) -> str:
    return re.sub(
        r"\\(?:toprule|midrule|bottomrule|cmidrule(?:\([^)]*\))?\{[^{}]*\})",
        " ",
        value,
    ).strip()


def parse_numeric(cell: str) -> float | None:
    value = clean_cell(cell).replace("%", "")
    if value in {"", "--", "---"}:
        return None
    return round(float(value), 1)


def register_framework(
    frameworks: OrderedDict[str, dict[str, Any]], framework_name: str
) -> dict[str, Any]:
    normalized_name = normalize_framework_name(framework_name)
    framework_key = slugify(normalized_name)
    if framework_key not in frameworks:
        frameworks[framework_key] = {
            "key": framework_key,
            "name": normalized_name,
            "sortOrder": len(frameworks) + 1,
        }
    return frameworks[framework_key]


def register_model(models: OrderedDict[str, dict[str, Any]], model_name: str) -> dict[str, Any]:
    normalized_name = normalize_model_name(model_name)
    model_key = slugify(normalized_name)
    if model_key not in models:
        models[model_key] = {
            "key": model_key,
            "name": normalized_name,
            "sortOrder": len(models) + 1,
        }
    return models[model_key]


def parse_category_label(cell: str, section_prefix: str | None = None) -> dict[str, Any]:
    raw_value = clean_cell(cell)
    if not raw_value:
        return {"key": "", "label": "", "taskCount": None}

    match = re.search(r"\((\d+)\)$", raw_value)
    task_count = int(match.group(1)) if match else None
    base_label = raw_value[: match.start()].strip() if match else raw_value
    label = f"{section_prefix} · {base_label}" if section_prefix else base_label
    return {
        "key": slugify(label),
        "label": label,
        "baseLabel": base_label,
        "taskCount": task_count,
    }


def parse_asr_table(
    table_text: str,
    frameworks: OrderedDict[str, dict[str, Any]],
    models: OrderedDict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    scores: list[dict[str, Any]] = []
    current_threat: str | None = None
    current_framework: str | None = None

    for raw_line in table_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if r"\multirow{10}{*}{\textbf{Indirect}}" in line:
            current_threat = "indirect_asr"
            continue
        if r"\multirow{10}{*}{\textbf{Direct}}" in line:
            current_threat = "direct_asr"
            continue
        if current_threat is None:
            continue

        if not line.endswith(r"\\"):
            if "&" in line:
                framework_candidate = clean_cell(line.split("&", 1)[1])
                if framework_candidate:
                    current_framework = framework_candidate
            continue

        if "&" not in line:
            continue

        cells = [clean_cell(cell) for cell in re.sub(r"\\\\\s*$", "", line).split("&")]
        if len(cells) < 15:
            continue

        if cells[0]:
            current_framework = normalize_framework_name(cells[0])
        model_cell = cells[1]
        if not current_framework or not model_cell:
            continue

        framework = register_framework(frameworks, current_framework)
        model = register_model(models, model_cell)
        for domain, raw_value in zip(DOMAINS, cells[2 : 2 + len(DOMAINS)]):
            scores.append(
                {
                    "runSlug": RUN_SLUG,
                    "metricType": current_threat,
                    "frameworkKey": framework["key"],
                    "frameworkName": framework["name"],
                    "modelKey": model["key"],
                    "modelName": model["name"],
                    "domainKey": domain["key"],
                    "domainLabel": domain["label"],
                    "value": parse_numeric(raw_value),
                }
            )

    return scores


def parse_bsr_table(
    table_text: str,
    frameworks: OrderedDict[str, dict[str, Any]],
    models: OrderedDict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    scores: list[dict[str, Any]] = []
    current_framework: str | None = None

    for raw_line in table_text.splitlines():
        line = raw_line.strip()
        if not line:
            continue

        if not line.endswith(r"\\"):
            framework_candidate = clean_cell(line)
            if framework_candidate:
                current_framework = framework_candidate
            continue

        if "&" not in line:
            continue

        cells = [clean_cell(cell) for cell in re.sub(r"\\\\\s*$", "", line).split("&")]
        if len(cells) < 15:
            continue

        if cells[0]:
            current_framework = normalize_framework_name(cells[0])
        model_cell = cells[1]
        if not current_framework or not model_cell:
            continue

        framework = register_framework(frameworks, current_framework)
        model = register_model(models, model_cell)
        for domain, raw_value in zip(DOMAINS, cells[2 : 2 + len(DOMAINS)]):
            scores.append(
                {
                    "runSlug": RUN_SLUG,
                    "metricType": "bsr",
                    "frameworkKey": framework["key"],
                    "frameworkName": framework["name"],
                    "modelKey": model["key"],
                    "modelName": model["name"],
                    "domainKey": domain["key"],
                    "domainLabel": domain["label"],
                    "value": parse_numeric(raw_value),
                }
            )

    return scores


def parse_domain_category_table(
    table_text: str,
    domain_key: str,
    metric_type: str,
    frameworks: OrderedDict[str, dict[str, Any]],
    models: OrderedDict[str, dict[str, Any]],
) -> dict[str, Any]:
    current_framework: str | None = None
    current_section_prefix: str | None = None
    header_categories: list[dict[str, Any]] = []
    categories_by_key: OrderedDict[str, dict[str, Any]] = OrderedDict()
    entries: OrderedDict[tuple[str, str], dict[str, Any]] = OrderedDict()

    for row in split_latex_rows(table_text):
        line = strip_table_rule_commands(row)
        if not line:
            continue

        if not header_categories and "&" in line:
            cells = [clean_cell(cell) for cell in split_latex_cells(line)]
            if len(cells) >= 4 and cells[0] == "" and cells[1] == "":
                raw_categories = cells[2:]
                while raw_categories and raw_categories[-1] == "":
                    raw_categories.pop()
                header_categories = [parse_category_label(cell) for cell in raw_categories if clean_cell(cell)]
                continue

        if not header_categories:
            continue

        if line.startswith(r"\multicolumn"):
            section_value = clean_cell(line)
            section_value = re.sub(r"\((\d+\s*tasks?)\)$", "", section_value, flags=re.IGNORECASE).strip()
            current_section_prefix = section_value or None
            continue

        if "&" not in line:
            framework_candidate = clean_cell(line)
            if framework_candidate:
                current_framework = normalize_framework_name(framework_candidate)
            continue

        cells = [clean_cell(cell) for cell in split_latex_cells(line)]
        if len(cells) < 4:
            continue

        if cells[0]:
            current_framework = normalize_framework_name(cells[0])
        model_cell = cells[1]
        if not current_framework or not model_cell:
            continue

        framework = register_framework(frameworks, current_framework)
        model = register_model(models, model_cell)
        entry_key = (framework["key"], model["key"])
        if entry_key not in entries:
            entries[entry_key] = {
                "frameworkKey": framework["key"],
                "frameworkName": framework["name"],
                "modelKey": model["key"],
                "modelName": model["name"],
                "categoryScores": OrderedDict(),
            }

        value_cells = cells[2:]
        while value_cells and value_cells[-1] == "":
            value_cells.pop()
        category_value_cells = value_cells[: len(header_categories)]

        for header_category, raw_value in zip(header_categories, category_value_cells):
            resolved_category = parse_category_label(header_category["baseLabel"], current_section_prefix)
            category_key = resolved_category["key"]
            if category_key not in categories_by_key:
                categories_by_key[category_key] = {
                    "key": category_key,
                    "label": resolved_category["label"],
                    "taskCount": header_category["taskCount"],
                }
            entries[entry_key]["categoryScores"][category_key] = parse_numeric(raw_value)

    category_list = list(categories_by_key.values())
    sorted_entries = []
    for entry in entries.values():
        category_scores = {category["key"]: None for category in category_list}
        category_scores.update(entry["categoryScores"])
        values = list(category_scores.values())
        sorted_entries.append(
            {
                **entry,
                "categoryScores": category_scores,
                "overall": average(values),
                "scoredCategories": sum(1 for value in values if value is not None),
            }
        )

    sorted_entries.sort(
        key=lambda entry: (
            999 if entry["overall"] is None else 0,
            -(entry["overall"] or 0) if metric_type == "bsr" else (entry["overall"] or 0),
            entry["frameworkName"],
            entry["modelName"],
        )
    )

    return {
        "domainKey": domain_key,
        "metricType": metric_type,
        "categories": category_list,
        "entries": sorted_entries,
    }


def parse_domain_category_tables(
    archive: zipfile.ZipFile,
    frameworks: OrderedDict[str, dict[str, Any]],
    models: OrderedDict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    category_tables = []
    archive_names = set(archive.namelist())

    for domain_key, directory_name in DOMAIN_TABLE_DIRECTORIES.items():
        preferred_benign_path = None
        for candidate in BENIGN_TABLE_CANDIDATES:
            candidate_path = f"table/{directory_name}/{candidate}"
            if candidate_path in archive_names:
                preferred_benign_path = candidate_path
                break

        metric_paths = {
            "direct_asr": f"table/{directory_name}/direct_asr.tex",
            "indirect_asr": f"table/{directory_name}/indirect_asr.tex",
        }
        if preferred_benign_path:
            metric_paths["bsr"] = preferred_benign_path

        for metric_type, path in metric_paths.items():
            if path not in archive_names:
                continue
            table_text = archive.read(path).decode("utf-8", errors="ignore")
            category_tables.append(
                parse_domain_category_table(table_text, domain_key, metric_type, frameworks, models)
            )

    return category_tables


def average(values: list[float | None]) -> float | None:
    clean_values = [value for value in values if value is not None]
    if not clean_values:
        return None
    return round(sum(clean_values) / len(clean_values), 1)


def build_entries(
    scores: list[dict[str, Any]],
    frameworks: OrderedDict[str, dict[str, Any]],
    models: OrderedDict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str, str], dict[str, Any]] = {}
    for score in scores:
        entry_key = (score["metricType"], score["frameworkKey"], score["modelKey"])
        if entry_key not in grouped:
            grouped[entry_key] = {
                "entryKey": "::".join(entry_key),
                "metricType": score["metricType"],
                "metricLabel": METRIC_LABELS[score["metricType"]],
                "frameworkKey": score["frameworkKey"],
                "frameworkName": score["frameworkName"],
                "modelKey": score["modelKey"],
                "modelName": score["modelName"],
                "domainScores": {domain_key: None for domain_key in DOMAIN_KEYS},
            }
        grouped[entry_key]["domainScores"][score["domainKey"]] = score["value"]

    entries = list(grouped.values())
    framework_order = {key: value["sortOrder"] for key, value in frameworks.items()}
    model_order = {key: value["sortOrder"] for key, value in models.items()}
    metric_order = {metric: index for index, metric in enumerate(METRIC_ORDER)}

    for entry in entries:
        domain_values = list(entry["domainScores"].values())
        entry["overall"] = average(domain_values)
        entry["scoredDomains"] = sum(1 for value in domain_values if value is not None)

    entries.sort(
        key=lambda entry: (
            metric_order[entry["metricType"]],
            framework_order[entry["frameworkKey"]],
            model_order[entry["modelKey"]],
        )
    )
    return entries


def build_averages(scores: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    averages_by_metric: dict[str, dict[str, Any]] = {}

    for metric in METRIC_ORDER:
        metric_scores = [score for score in scores if score["metricType"] == metric]
        domain_averages = {}
        for domain in DOMAINS:
            values = [
                score["value"]
                for score in metric_scores
                if score["domainKey"] == domain["key"]
            ]
            domain_averages[domain["key"]] = average(values)

        overall = average([score["value"] for score in metric_scores])
        unique_entries = {
            (score["frameworkKey"], score["modelKey"]) for score in metric_scores
        }
        averages_by_metric[metric] = {
            "metricType": metric,
            "metricLabel": METRIC_LABELS[metric],
            "overall": overall,
            "entryCount": len(unique_entries),
            "scoredCells": sum(1 for score in metric_scores if score["value"] is not None),
            "domainAverages": domain_averages,
        }

    return averages_by_metric


def build_dataset(
    scores: list[dict[str, Any]],
    category_tables: list[dict[str, Any]],
    frameworks: OrderedDict[str, dict[str, Any]],
    models: OrderedDict[str, dict[str, Any]],
) -> dict[str, Any]:
    entries = build_entries(scores, frameworks, models)
    averages = build_averages(scores)
    counts_by_metric = defaultdict(int)
    for entry in entries:
        counts_by_metric[entry["metricType"]] += 1

    return {
        "run": {
            "slug": RUN_SLUG,
            "name": RUN_NAME,
            "sourceLabel": SOURCE_LABEL,
            "sourcePath": "table/main/*.tex + table/<domain>/{direct_asr,indirect_asr,benign_*}.tex",
            "isPublished": True,
        },
        "metrics": [
            {
                "key": metric,
                "label": METRIC_LABELS[metric],
                "entryCount": counts_by_metric.get(metric, 0),
            }
            for metric in METRIC_ORDER
        ],
        "domains": DOMAINS,
        "frameworks": list(frameworks.values()),
        "models": list(models.values()),
        "scores": scores,
        "entries": entries,
        "averages": averages,
        "categoryTables": category_tables,
    }


def build_seed_sql(dataset: dict[str, Any]) -> str:
    run = dataset["run"]
    lines = [
        "-- Generated by scripts/generate-benchmark-data.py",
        "begin;",
        "",
        "update public.benchmark_runs",
        f"set is_published = false where slug <> '{escape_sql(run['slug'])}';",
        "",
        "insert into public.benchmark_runs (slug, name, source_label, source_path, is_published, published_at)",
        "values (",
        f"  '{escape_sql(run['slug'])}',",
        f"  '{escape_sql(run['name'])}',",
        f"  '{escape_sql(run['sourceLabel'])}',",
        f"  '{escape_sql(run['sourcePath'])}',",
        "  true,",
        "  now()",
        ")",
        "on conflict (slug) do update set",
        "  name = excluded.name,",
        "  source_label = excluded.source_label,",
        "  source_path = excluded.source_path,",
        "  is_published = excluded.is_published,",
        "  published_at = excluded.published_at,",
        "  updated_at = now();",
        "",
    ]

    for framework in dataset["frameworks"]:
        lines.extend(
            [
                "insert into public.benchmark_frameworks (key, name, sort_order)",
                f"values ('{escape_sql(framework['key'])}', '{escape_sql(framework['name'])}', {framework['sortOrder']})",
                "on conflict (key) do update set",
                "  name = excluded.name,",
                "  sort_order = excluded.sort_order,",
                "  updated_at = now();",
                "",
            ]
        )

    for model in dataset["models"]:
        lines.extend(
            [
                "insert into public.benchmark_models (key, name, sort_order)",
                f"values ('{escape_sql(model['key'])}', '{escape_sql(model['name'])}', {model['sortOrder']})",
                "on conflict (key) do update set",
                "  name = excluded.name,",
                "  sort_order = excluded.sort_order,",
                "  updated_at = now();",
                "",
            ]
        )

    for domain in dataset["domains"]:
        lines.extend(
            [
                "insert into public.benchmark_domains (key, label, short_label, sort_order)",
                f"values ('{escape_sql(domain['key'])}', '{escape_sql(domain['label'])}', '{escape_sql(domain['shortLabel'])}', {domain['sortOrder']})",
                "on conflict (key) do update set",
                "  label = excluded.label,",
                "  short_label = excluded.short_label,",
                "  sort_order = excluded.sort_order,",
                "  updated_at = now();",
                "",
            ]
        )

    for score in dataset["scores"]:
        value_sql = "null" if score["value"] is None else f"{score['value']:.1f}"
        lines.extend(
            [
                "insert into public.benchmark_scores (run_id, framework_id, model_id, domain_id, metric_type, value)",
                "values (",
                f"  (select id from public.benchmark_runs where slug = '{escape_sql(score['runSlug'])}'),",
                f"  (select id from public.benchmark_frameworks where key = '{escape_sql(score['frameworkKey'])}'),",
                f"  (select id from public.benchmark_models where key = '{escape_sql(score['modelKey'])}'),",
                f"  (select id from public.benchmark_domains where key = '{escape_sql(score['domainKey'])}'),",
                f"  '{escape_sql(score['metricType'])}',",
                f"  {value_sql}",
                ")",
                "on conflict (run_id, framework_id, model_id, domain_id, metric_type) do update set",
                "  value = excluded.value,",
                "  updated_at = now();",
                "",
            ]
        )

    lines.append("commit;")
    return "\n".join(lines)


def generate_dataset(zip_path: Path) -> dict[str, Any]:
    frameworks: OrderedDict[str, dict[str, Any]] = OrderedDict()
    models: OrderedDict[str, dict[str, Any]] = OrderedDict()
    with zipfile.ZipFile(zip_path) as archive:
        asr_text = archive.read(ASR_TABLE_PATH).decode("utf-8", errors="ignore")
        bsr_text = archive.read(BSR_TABLE_PATH).decode("utf-8", errors="ignore")

    scores = parse_asr_table(asr_text, frameworks, models)
    scores.extend(parse_bsr_table(bsr_text, frameworks, models))
    with zipfile.ZipFile(zip_path) as archive:
        category_tables = parse_domain_category_tables(archive, frameworks, models)
    return build_dataset(scores, category_tables, frameworks, models)


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate benchmark data from the DecodingTrust paper ZIP.")
    parser.add_argument("zip_path", help="Path to DecodingTrust_Agent.zip")
    parser.add_argument(
        "--json-output",
        default="frontend/public/data/benchmark-data.json",
        help="Path to write the public benchmark JSON",
    )
    parser.add_argument(
        "--seed-sql-output",
        default="supabase/seed.sql",
        help="Path to write the Supabase seed SQL",
    )
    args = parser.parse_args()

    zip_path = Path(args.zip_path).expanduser().resolve()
    dataset = generate_dataset(zip_path)
    write_json(Path(args.json_output), dataset)
    write_text(Path(args.seed_sql_output), build_seed_sql(dataset))


if __name__ == "__main__":
    main()
