
from pathlib import Path
import sys

try:
    from pypdf import PdfReader
except ImportError:
    print("MISSING_PYPDF")
    sys.exit(10)

pdf_path = Path(sys.argv[1])
txt_path = Path(sys.argv[2])

reader = PdfReader(str(pdf_path))

parts = []

for page_no, page in enumerate(reader.pages, start=1):
    try:
        text = page.extract_text() or ""
    except Exception as exc:
        text = ""
        print(
            f"WARNING page {page_no}: {exc}",
            file=sys.stderr
        )

    parts.append(text)

txt_path.write_text(
    "\n\n".join(parts),
    encoding="utf-8"
)

print(
    f"PAGES={len(reader.pages)}"
)

print(
    f"CHARS={sum(len(x) for x in parts)}"
)
