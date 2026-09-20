import json
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent

INPUT = BASE / "fee-documents-2026-extracted.json"
OUTPUT = BASE / "fee-normalization-audit.txt"


FEE_WORDS = re.compile(
    r"""
    tuition|
    institute\s+fee|
    admission\s+fee|
    semester|
    sem\b|
    hostel|
    mess|
    caution|
    refundable|
    registration|
    examination|
    exam\s+fee|
    development|
    library|
    medical|
    insurance|
    transport|
    student\s+activit|
    total|
    fee\s+structure|
    fees|
    income|
    sc\b|
    st\b|
    obc|
    ews|
    pwd|
    hosteller|
    day\s+scholar|
    waiver|
    remission
    """,
    re.I | re.X
)


def clean(value):
    return re.sub(
        r"\s+",
        " ",
        str(value or "")
    ).strip()


def useful_line(line):
    line = clean(line)

    if not line:
        return False

    return bool(
        FEE_WORDS.search(line)
    )


def table_text(table):
    rows = table.get("rows") or []

    return "\n".join(
        " | ".join(
            str(cell)
            for cell in row
        )
        for row in rows
    )


def main():
    data = json.loads(
        INPUT.read_text(
            encoding="utf-8"
        )
    )

    out = []

    for record in data:
        out.append("\n" + "=" * 100)

        out.append(
            f"COLLEGE: {record.get('college_name')}"
        )

        out.append(
            f"TYPE: {record.get('document_type')}"
        )

        out.append(
            f"STATUS: {record.get('extraction_status')}"
        )

        out.append(
            f"SOURCE: {record.get('source_url')}"
        )

        out.append(
            f"CHARS: {record.get('character_count')}"
        )

        out.append("\n--- DIRECT TABLES ---")

        tables = (
            record.get("candidate_tables")
            or []
        )

        if tables:
            for table in tables:
                txt = table_text(table)

                if not FEE_WORDS.search(txt):
                    continue

                out.append(
                    f"\nTABLE {table.get('table_index')}"
                )

                out.append(txt)
        else:
            out.append("NONE")

        out.append("\n--- PDF FEE LINES ---")

        seen = set()
        lines = []

        for page in record.get("pages") or []:
            page_number = page.get("page")
            text = page.get("text") or ""

            for raw in text.splitlines():
                line = clean(raw)

                if not useful_line(line):
                    continue

                key = line.lower()

                if key in seen:
                    continue

                seen.add(key)

                lines.append(
                    f"[PAGE {page_number}] {line}"
                )

        if lines:
            out.extend(
                lines[:250]
            )
        else:
            out.append("NONE")

        out.append("\n--- RELEVANT BLOCKS ---")

        blocks = (
            record.get("relevant_blocks")
            or []
        )

        count = 0

        for block in blocks:
            if not FEE_WORDS.search(block):
                continue

            out.append(
                clean(block)
            )

            out.append("---")

            count += 1

            if count >= 80:
                break

        if count == 0:
            out.append("NONE")

    OUTPUT.write_text(
        "\n".join(out),
        encoding="utf-8"
    )

    print()
    print("=" * 50)
    print("FEE NORMALIZATION AUDIT CREATED")
    print("=" * 50)
    print()
    print("Records :", len(data))
    print("Saved   :", OUTPUT.name)
    print()
    print("DATABASE HAS NOT BEEN MODIFIED.")


if __name__ == "__main__":
    main()