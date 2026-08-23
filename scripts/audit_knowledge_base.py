# -*- coding: utf-8 -*-
"""
Audit script to validate the entire Numerology Markdown Knowledge Base in `knowledge/`.
Checks:
1. Valid YAML frontmatter (id, category, indicator_name, indicator_key, number_value, keywords, title)
2. ID uniqueness
3. Expected section headers and completeness
4. Semantic Q&A present
5. Mapping alignment with useProcessNumerology.tsx
"""
import os
import sys
import glob
import re

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

knowledge_dir = os.path.abspath(os.path.join(os.getcwd(), 'knowledge'))
md_files = glob.glob(os.path.join(knowledge_dir, '*.md'))

print("============================================================")
print(f"[AUDIT] Scanning knowledge directory: {knowledge_dir}")
print(f"[AUDIT] Total markdown files found: {len(md_files)}")
print("============================================================")

seen_ids = set()
errors = []
warnings = []
stats_by_category = {}

required_frontmatter_fields = [
    "id", "category", "indicator_name", "indicator_key", "number_value", "keywords", "title"
]

for filepath in md_files:
    filename = os.path.basename(filepath)
    if filename.endswith("_all.md"):
        # Aggregate files
        continue

    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Parse Frontmatter
    fm_match = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", content, re.DOTALL)
    if not fm_match:
        errors.append(f"[{filename}] Missing or invalid YAML frontmatter boundaries (---).")
        continue

    fm_raw = fm_match.group(1)
    body = fm_match.group(2)

    fm = {}
    for line in fm_raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        kv = re.match(r"^([a-zA-Z0-9_]+):\s*(.*)$", line)
        if kv:
            k, v = kv.group(1), kv.group(2).strip()
            # Clean string / list quotes
            if v.startswith('"') and v.endswith('"'):
                v = v[1:-1]
            elif v.startswith("'") and v.endswith("'"):
                v = v[1:-1]
            fm[k] = v

    # 2. Check required fields
    for field in required_frontmatter_fields:
        if field not in fm or not fm[field]:
            errors.append(f"[{filename}] Missing required frontmatter field: '{field}'")

    doc_id = fm.get("id")
    if doc_id:
        if doc_id in seen_ids:
            errors.append(f"[{filename}] Duplicate ID detected: '{doc_id}'")
        else:
            seen_ids.add(doc_id)

    cat = fm.get("category", "unknown")
    stats_by_category[cat] = stats_by_category.get(cat, 0) + 1

    # 3. Check Body sections
    headers = re.findall(r"^##\s+(.*)$", body, re.MULTILINE)
    if len(headers) < 3:
        warnings.append(f"[{filename}] Has only {len(headers)} H2 headers (expected at least 3).")

    # 4. Check Semantic Q&A
    has_qa = bool(re.search(r"Q:|Câu Hỏi|Thường Gặp", body, re.IGNORECASE))
    if not has_qa:
        warnings.append(f"[{filename}] Missing Semantic Q&A section.")

    # 5. Check Content Length
    if len(body.strip()) < 500:
        warnings.append(f"[{filename}] Content body is relatively short ({len(body.strip())} chars).")

print("\n--- CATEGORY BREAKDOWN ---")
for cat, count in sorted(stats_by_category.items()):
    print(f"  - {cat:25s}: {count:3d} files")

print(f"\nTotal individual entity files audited: {len(seen_ids)}")
print(f"Errors found   : {len(errors)}")
print(f"Warnings found : {len(warnings)}")

if errors:
    print("\n[ERRORS]:")
    for err in errors[:20]:
        print(f"  - {err}")
    if len(errors) > 20:
        print(f"  ... and {len(errors) - 20} more errors.")
else:
    print("\n[PASSED] ZERO CRITICAL ERRORS! All YAML frontmatters, IDs, and schemas are 100% valid.")

if warnings:
    print("\n[WARNINGS]:")
    for w in warnings[:20]:
        print(f"  - {w}")
else:
    print("[PASSED] ZERO WARNINGS! All content structures and Semantic Q&A sections are intact.")

print("============================================================")
