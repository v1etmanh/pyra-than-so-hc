# -*- coding: utf-8 -*-
"""Audit generated Daily Decision RAG documents."""

from __future__ import annotations

import re
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
KNOWLEDGE_DIR = ROOT_DIR / "knowledge"
EXPECTED_QUESTIONS = 60
EXPECTED_DAYS = set(range(1, 10))


def frontmatter(raw: str) -> dict[str, str]:
    match = re.match(r"^---\s*\n(.*?)\n---\s*\n", raw, re.DOTALL)
    if not match:
        return {}
    values: dict[str, str] = {}
    for line in match.group(1).splitlines():
        key, separator, value = line.partition(":")
        if separator:
            values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def main() -> int:
    files = sorted(KNOWLEDGE_DIR.glob("daily_decision_*.md"))
    errors: list[str] = []
    ids: set[str] = set()
    question_ids: set[str] = set()
    days_by_question: dict[str, set[int]] = {}

    for path in files:
        meta = frontmatter(path.read_text(encoding="utf-8"))
        required = ["id", "category", "indicator_key", "question_id", "personal_day", "safety_level", "title"]
        for field in required:
            if not meta.get(field):
                errors.append(f"{path.name}: missing {field}")
        if meta.get("id") in ids:
            errors.append(f"{path.name}: duplicate id {meta['id']}")
        ids.add(meta.get("id", ""))
        question_id = meta.get("question_id", "")
        question_ids.add(question_id)
        try:
            day = int(meta.get("personal_day", "0"))
        except ValueError:
            day = 0
        days_by_question.setdefault(question_id, set()).add(day)

        body = path.read_text(encoding="utf-8")
        for marker in ("Câu hỏi / Question", "Gợi ý theo năng lượng", "Semantic Q&A"):
            if marker not in body:
                errors.append(f"{path.name}: missing section marker {marker}")
        if len(body) < 500:
            errors.append(f"{path.name}: body is shorter than 500 characters")

    for question_id, days in sorted(days_by_question.items()):
        if days != EXPECTED_DAYS:
            errors.append(f"{question_id}: expected days 1-9, found {sorted(days)}")

    expected_documents = EXPECTED_QUESTIONS * 9
    print(f"Daily Decision files: {len(files)}")
    print(f"Question IDs: {len(question_ids)}")
    print(f"Expected files: {expected_documents}")
    print(f"Errors: {len(errors)}")
    if errors:
        for error in errors[:30]:
            print(f"- {error}")
        return 1
    if len(files) != expected_documents or len(question_ids) != EXPECTED_QUESTIONS:
        print("- File/question count does not match the expected 60 x 9 matrix")
        return 1
    print("PASSED: Daily Decision knowledge base is complete and structurally valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
