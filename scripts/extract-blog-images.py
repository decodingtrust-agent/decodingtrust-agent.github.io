"""Render report covers and original figure regions without redrawing their contents."""

import argparse
import hashlib
import json
import math
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "frontend/public/blog"
SCALE = 2200
POINTS_PER_PAGE = 792

EXTRACTS = [
    ("meta", "muse-spark-1-3/cover.png", 1, None, "Report cover"),
    ("meta", "muse-spark-1-3/figure-25.png", 61, (80, 56, 450, 277), "Figure 25"),
    ("meta", "muse-spark-1-3/figure-29.png", 66, (80, 56, 450, 277), "Figure 29"),
    ("pokee", "pokee-ai/cover.png", 1, None, "White paper first page"),
    ("pokee", "pokee-ai/figure-1.png", 7, (100, 159, 405, 308), "Figure 1"),
    ("pokee", "pokee-ai/figure-2.png", 12, (112, 88, 395, 546), "Figure 2"),
    ("pokee", "pokee-ai/table-8.png", 24, (100, 138, 410, 124), "Table 8"),
]


def render(source, destination, page, region):
    destination.parent.mkdir(parents=True, exist_ok=True)
    command = ["pdftoppm", "-f", str(page), "-l", str(page), "-scale-to", str(SCALE), "-singlefile", "-png"]
    if region:
        pixels = [math.floor(value * SCALE / POINTS_PER_PAGE) for value in region]
        for flag, value in zip(["-x", "-y", "-W", "-H"], pixels):
            command.extend([flag, str(value)])
    command.extend([str(source), str(destination.with_suffix(""))])
    subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--meta-report", type=Path, required=True)
    parser.add_argument("--pokee-report", type=Path,
                        default=ROOT / "frontend/public/papers/pokee-ai-dtap-security-whitepaper.pdf")
    arguments = parser.parse_args()
    sources = {"meta": arguments.meta_report.resolve(), "pokee": arguments.pokee_report.resolve()}
    urls = {
        "meta": "https://research.meta.ai/static/muse-spark-1-3-evaluation-report",
        "pokee": "/papers/pokee-ai-dtap-security-whitepaper.pdf",
    }
    records = []
    for source_id, filename, page, region, label in EXTRACTS:
        source = sources[source_id]
        destination = PUBLIC / filename
        render(source, destination, page, region)
        records.append({
            "image": f"/blog/{filename}", "source": urls[source_id],
            "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
            "pdf_page": page, "label": label, "region_points": region,
        })
        print(f"Rendered original {label}: {destination.relative_to(ROOT)}")
    manifest = ROOT / "frontend/content/blog/source-images.json"
    manifest.write_text(json.dumps(records, indent=2) + "\n")
