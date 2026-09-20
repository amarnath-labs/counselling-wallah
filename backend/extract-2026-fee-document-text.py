import json
import re
from pathlib import Path
from pypdf import PdfReader


BASE = Path(__file__).resolve().parent

MANIFEST_FILE = (
    BASE / "fee-documents-2026-manifest.json"
)

EVIDENCE_FILE = (
    BASE / "safe-26-fee-evidence-pack.json"
)

OUTPUT_FILE = (
    BASE / "fee-documents-2026-extracted.json"
)

REVIEW_FILE = (
    BASE / "fee-documents-2026-extraction-review.json"
)

READABLE_FILE = (
    BASE / "fee-documents-2026-readable.txt"
)


FEE_TERMS = re.compile(
    r"""
    fee|
    fees|
    tuition|
    institute|
    admission|
    semester|
    sem\b|
    hostel|
    mess|
    caution|
    refundable|
    registration|
    development|
    library|
    examination|
    exam|
    medical|
    insurance|
    transport|
    student\s+activity|
    category|
    income|
    sc\b|
    st\b|
    obc|
    ews|
    pwd|
    day\s+scholar|
    hosteller|
    waiver|
    remission|
    total|
    ₹|
    rs\.?|
    inr
    """,
    re.I | re.X
)


BTECH_TERMS = re.compile(
    r"""
    b\.?\s*tech|
    btech|
    bachelor\s+of\s+technology|
    undergraduate|
    \bug\b
    """,
    re.I | re.X
)


CURRENT_YEAR = re.compile(
    r"""
    2026\s*[-–]\s*27|
    2026\s*[-–]\s*2027|
    2026_27|
    2026-2027|
    academic\s+year\s+2026|
    ay\s*2026
    """,
    re.I | re.X
)


MONEY = re.compile(
    r"""
    ₹\s*\d[\d,]*(?:\.\d+)?|
    rs\.?\s*\d[\d,]*(?:\.\d+)?|
    inr\s*\d[\d,]*(?:\.\d+)?|
    \b\d{1,3}(?:,\d{2,3})+(?:\.\d+)?\b
    """,
    re.I | re.X
)


def clean_line(value):
    value = str(value or "")
    value = value.replace("\xa0", " ")
    value = re.sub(r"[ \t]+", " ", value)
    return value.strip()


def normalize_page_text(text):
    lines = []

    for line in str(text or "").splitlines():
        line = clean_line(line)

        if line:
            lines.append(line)

    return "\n".join(lines)


def money_values(text):
    values = []

    for match in MONEY.finditer(str(text or "")):
        raw = match.group(0)

        digits = re.sub(
            r"[^\d.]",
            "",
            raw
        )

        try:
            number = float(digits)

            if number.is_integer():
                number = int(number)

            values.append({
                "raw": raw,
                "value": number
            })

        except ValueError:
            pass

    return values


def extract_relevant_blocks(text, radius=2):
    lines = [
        clean_line(x)
        for x in str(text or "").splitlines()
        if clean_line(x)
    ]

    selected = []

    for i, line in enumerate(lines):
        if (
            FEE_TERMS.search(line)
            or MONEY.search(line)
        ):
            start = max(0, i - radius)
            end = min(
                len(lines),
                i + radius + 1
            )

            block = "\n".join(
                lines[start:end]
            )

            selected.append(block)

    # dedupe while preserving order
    unique = []
    seen = set()

    for block in selected:
        key = re.sub(
            r"\s+",
            " ",
            block
        ).strip()

        if key not in seen:
            seen.add(key)
            unique.append(block)

    return unique


def page_quality(text):
    money = money_values(text)

    fee_present = bool(
        FEE_TERMS.search(text)
    )

    btech_present = bool(
        BTECH_TERMS.search(text)
    )

    current_year = bool(
        CURRENT_YEAR.search(text)
    )

    score = 0

    if fee_present:
        score += 25

    if btech_present:
        score += 20

    if current_year:
        score += 20

    if len(money) >= 2:
        score += 20

    if len(money) >= 5:
        score += 10

    if len(text) >= 200:
        score += 5

    return {
        "score": score,
        "fee_present": fee_present,
        "btech_present": btech_present,
        "current_year_present": current_year,
        "money_count": len(money)
    }


def extract_pdf(record):
    raw_path = record.get(
        "local_path"
    )

    if not raw_path:
        raise ValueError(
            "Missing local_path"
        )

    pdf_path = BASE / raw_path

    if not pdf_path.exists():
        raise FileNotFoundError(
            str(pdf_path)
        )

    reader = PdfReader(
        str(pdf_path)
    )

    pages = []
    full_text_parts = []

    for page_index, page in enumerate(
        reader.pages,
        start=1
    ):
        try:
            text = page.extract_text() or ""
        except Exception as exc:
            text = ""

            pages.append({
                "page": page_index,
                "text": "",
                "error": str(exc),
                "quality": {
                    "score": 0,
                    "fee_present": False,
                    "btech_present": False,
                    "current_year_present": False,
                    "money_count": 0
                }
            })

            continue

        text = normalize_page_text(
            text
        )

        quality = page_quality(
            text
        )

        pages.append({
            "page": page_index,
            "text": text,
            "quality": quality
        })

        if text:
            full_text_parts.append(
                text
            )

    full_text = "\n\n".join(
        full_text_parts
    )

    blocks = extract_relevant_blocks(
        full_text,
        radius=3
    )

    amounts = money_values(
        full_text
    )

    total_chars = len(
        full_text
    )


    if total_chars < 150:
        extraction_status = "INSUFFICIENT_TEXT_REVIEW"
    elif len(blocks) == 0:
        extraction_status = "NO_FEE_EVIDENCE_REVIEW"
    else:
        extraction_status = "TEXT_EXTRACTED"

    return {
        "college_id": record.get("college_id"),
        "college_name": record.get("college_name"),
        "document_type": record.get("document_type"),
        "academic_year": record.get("academic_year"),
        "source_url": record.get("source_url"),
        "local_path": record.get("local_path"),
        "page_count": len(reader.pages),
        "character_count": total_chars,
        "detected_amounts": amounts,
        "relevant_blocks": blocks,
        "pages": pages,
        "extraction_status": extraction_status
    }


def extract_direct_html(record, evidence_by_name):
    college_name = record.get("college_name")
    evidence = evidence_by_name.get(college_name)

    if not evidence:
        return {
            "college_id": record.get("college_id"),
            "college_name": college_name,
            "document_type": record.get("document_type"),
            "academic_year": record.get("academic_year"),
            "source_url": record.get("source_url"),
            "extraction_status": "DIRECT_EVIDENCE_NOT_FOUND",
            "relevant_blocks": [],
            "candidate_tables": []
        }

    candidate_tables = evidence.get("candidate_tables") or []
    relevant_lines = evidence.get("relevant_lines") or []

    text_lines = []

    for item in relevant_lines:
        if isinstance(item, dict):
            value = item.get("text", "")
        else:
            value = str(item)

        value = clean_line(value)

        if value:
            text_lines.append(value)

    full_text = "\n".join(text_lines)

    table_text_parts = []

    for table in candidate_tables:
        for row in table.get("rows") or []:
            table_text_parts.append(
                " | ".join(str(cell) for cell in row)
            )

    table_text = "\n".join(table_text_parts)

    combined_text = full_text + "\n" + table_text

    return {
        "college_id": record.get("college_id"),
        "college_name": college_name,
        "document_type": record.get("document_type"),
        "academic_year": record.get("academic_year"),
        "source_url": record.get("source_url"),
        "local_path": None,
        "page_count": None,
        "character_count": len(combined_text),
        "detected_amounts": money_values(combined_text),
        "relevant_blocks": extract_relevant_blocks(
            combined_text,
            radius=3
        ),
        "candidate_tables": candidate_tables,
        "raw_relevant_lines": relevant_lines,
        "extraction_status": "DIRECT_HTML_EXTRACTED"
    }


def build_readable(records):
    output = []

    for item in records:
        output.append("\n" + "=" * 90)
        output.append(
            f"COLLEGE: {item.get('college_name')}"
        )
        output.append(
            f"TYPE: {item.get('document_type')}"
        )
        output.append(
            f"YEAR: {item.get('academic_year')}"
        )
        output.append(
            f"STATUS: {item.get('extraction_status')}"
        )
        output.append(
            f"SOURCE: {item.get('source_url')}"
        )
        output.append(
            f"PAGES: {item.get('page_count')}"
        )
        output.append(
            f"CHARACTERS: {item.get('character_count')}"
        )

        output.append("\n--- DETECTED AMOUNTS ---")

        amounts = item.get("detected_amounts") or []

        output.append(
            ", ".join(
                str(x.get("raw", ""))
                for x in amounts[:100]
            )
        )

        output.append("\n--- FEE EVIDENCE ---")

        blocks = item.get("relevant_blocks") or []

        for block in blocks[:80]:
            output.append(block)
            output.append("---")

        tables = item.get("candidate_tables") or []

        if tables:
            output.append("\n--- TABLES ---")

            for table in tables:
                output.append(
                    f"TABLE {table.get('table_index')}"
                )

                for row in table.get("rows") or []:
                    output.append(
                        " | ".join(
                            str(cell) for cell in row
                        )
                    )

                output.append("---")

    return "\n".join(output)


def main():
    print()
    print("=" * 50)
    print("2026 B.TECH FEE DOCUMENT TEXT EXTRACTOR")
    print("=" * 50)
    print()

    manifest = json.loads(
        MANIFEST_FILE.read_text(
            encoding="utf-8-sig"
        )
    )

    evidence = json.loads(
        EVIDENCE_FILE.read_text(
            encoding="utf-8-sig"
        )
    )

    evidence_by_name = {
        row.get("college_name"): row
        for row in evidence
    }

    extracted = []
    review = []

    for index, record in enumerate(
        manifest,
        start=1
    ):
        college_name = record.get("college_name")

        print(
            f"[{index}/{len(manifest)}] {college_name}"
        )

        try:
            if (
                record.get("fetch_status")
                == "DIRECT_EVIDENCE_ALREADY_CAPTURED"
            ):
                result = extract_direct_html(
                    record,
                    evidence_by_name
                )

            elif (
                record.get("fetch_status")
                == "FETCHED"
            ):
                result = extract_pdf(record)

            else:
                result = {
                    **record,
                    "extraction_status":
                        "UNSUPPORTED_MANIFEST_STATUS"
                }

            extracted.append(result)

            print(
                " -> "
                + result.get(
                    "extraction_status",
                    "UNKNOWN"
                )
            )

            print(
                " -> chars:",
                result.get("character_count")
            )

            print(
                " -> amounts:",
                len(
                    result.get(
                        "detected_amounts",
                        []
                    )
                )
            )

            if result.get(
                "extraction_status"
            ) not in {
                "TEXT_EXTRACTED",
                "DIRECT_HTML_EXTRACTED"
            }:
                review.append(result)

        except Exception as exc:
            failed = {
                **record,
                "extraction_status":
                    "EXTRACTION_FAILED",
                "error":
                    str(exc)
            }

            extracted.append(failed)
            review.append(failed)

            print(
                " -> FAILED:",
                exc
            )

    OUTPUT_FILE.write_text(
        json.dumps(
            extracted,
            indent=2,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )

    REVIEW_FILE.write_text(
        json.dumps(
            review,
            indent=2,
            ensure_ascii=False
        ),
        encoding="utf-8"
    )

    READABLE_FILE.write_text(
        build_readable(extracted),
        encoding="utf-8"
    )

    successful = [
        x
        for x in extracted
        if x.get("extraction_status")
        in {
            "TEXT_EXTRACTED",
            "DIRECT_HTML_EXTRACTED"
        }
    ]

    print()
    print("=" * 50)
    print("EXTRACTION SUMMARY")
    print("=" * 50)
    print()

    print(
        "Manifest entries :",
        len(manifest)
    )

    print(
        "Successfully read :",
        len(successful)
    )

    print(
        "Review required   :",
        len(review)
    )

    print(
        "Accounted         :",
        len(extracted)
    )

    print()
    print("Saved:")
    print(OUTPUT_FILE.name)
    print(REVIEW_FILE.name)
    print(READABLE_FILE.name)

    print()
    print(
        "DATABASE HAS NOT BEEN MODIFIED."
    )


if __name__ == "__main__":
    main()
