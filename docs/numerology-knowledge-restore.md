# Restore `numerology_knowledge`

The local source of truth is `data/cadao.db`. Keep that file local and read-only.

## 1. Validate the backup

```powershell
npm run knowledge:restore:dry-run
```

Expected result: 608 valid records, split evenly between `vi` and `en`.

## 2. Recreate the table

Open the Supabase SQL Editor for the configured project and run the complete
contents of:

`supabase/migrations/20261102000100_restore_numerology_knowledge.sql`

The migration deliberately stops if `public.numerology_knowledge` already
exists. Inspect any existing table instead of deleting or overwriting it.

## 3. Import and verify

```powershell
npm run knowledge:restore
npm run knowledge:verify
```

The importer reads `.env.local`, upserts by
`(indicator_key, number_value, locale)`, refuses unknown remote keys, and then
compares every restored field with the SQLite backup. A successful verification
reports 608 records, 304 per locale, matching SHA-256 hashes, and denied anon
access.

The source backup intentionally remains authoritative. It does not contain
`walksOfLife=1` in either locale; this restore does not invent those records.
