"""Export a bundled task to one offline HTML file using Python's standard library.

    python export_task.py personal/rt/indirect/pii-disclosure/001 task.html
"""
from __future__ import annotations

import base64
import json
import mimetypes
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parents[1] / "visualization"


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def inline_css(path: Path) -> str:
    text = path.read_text()
    text = re.sub(r'@import url\("([^"]+)"\);', lambda m: inline_css(path.parent / m[1]), text)
    def resource(match: re.Match) -> str:
        value = match[1].strip("\"'")
        return match[0] if value.startswith("data:") else f"url({data_uri(path.parent / value)})"

    return re.sub(r"url\(([^)]+)\)", resource, text)


def export(task: str, output: str) -> Path:
    path = Path(task)
    if not path.is_file():
        path = HERE / "data/task" / f"{task}.json"
    body = json.loads(path.read_text())
    body.pop("nav", None)
    data = json.dumps(body, ensure_ascii=False).replace("</", "<\\/")
    html = (HERE / "task.html").read_text()
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">',
                  lambda m: f"<style>{inline_css(HERE / m[1])}</style>", html)

    def script(match: re.Match) -> str:
        code = (HERE / match[1]).read_text().replace("</script", "<\\/script")
        prefix = f"window.TASK_DATA={data};" if match[1] == "task.js" else ""
        return f"<script>{prefix}{code}</script>"

    html = re.sub(r'<script src="([^"]+)"></script>', script, html)
    for image in (HERE / "assets").rglob("*"):
        if image.is_file():
            html = html.replace(str(image.relative_to(HERE)), data_uri(image))
    destination = Path(output)
    destination.write_text(html)
    return destination


if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    print(export(sys.argv[1], sys.argv[2]))
