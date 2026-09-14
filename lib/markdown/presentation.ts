function splitMarkdownTableRow(line: string): string[] {
  let value = line.trim();
  if (value.startsWith('|')) value = value.slice(1);
  if (value.endsWith('|')) value = value.slice(0, -1);
  return value.split('|').map((cell) => cell.trim());
}

function isMarkdownTableDivider(line: string): boolean {
  const cells = splitMarkdownTableRow(line);
  return cells.length >= 2 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function cleanTableHeader(value: string): string {
  return value.replace(/[*_`\[\]]/g, '').trim();
}

/** Converts GFM tables into wrapping lists so model output stays readable on mobile. */
export function normalizeMarkdownForMobile(markdown: string): string {
  if (!markdown.includes('|')) return markdown;

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const output: string[] = [];

  for (let index = 0; index < lines.length;) {
    const headerLine = lines[index];
    const dividerLine = lines[index + 1];
    if (!headerLine.includes('|') || !dividerLine || !isMarkdownTableDivider(dividerLine)) {
      output.push(headerLine);
      index += 1;
      continue;
    }

    const headers = splitMarkdownTableRow(headerLine).map(cleanTableHeader);
    const rows: string[][] = [];
    index += 2;

    while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
      if (!isMarkdownTableDivider(lines[index])) rows.push(splitMarkdownTableRow(lines[index]));
      index += 1;
    }

    if (!rows.length) {
      output.push(headerLine, dividerLine);
      continue;
    }

    for (const row of rows) {
      const parts = row.flatMap((cell, cellIndex) => {
        if (!cell) return [];
        const header = headers[cellIndex];
        return header ? [`**${header}:** ${cell}`] : [cell];
      });
      if (parts.length) output.push(`- ${parts.join('; ')}`);
    }
  }

  return output.join('\n');
}
