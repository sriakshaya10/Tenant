import React from 'react'

/**
 * A small markdown renderer for generated reports: headings, paragraphs,
 * bullet/numbered lists, tables, rules, **bold**, *italic* and `code`.
 * Deliberately limited — reports don't need more, and it avoids a dependency.
 */

function inline(text: string, keyPrefix: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
  return parts.filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={key}>{part.slice(1, -1)}</em>
    return <React.Fragment key={key}>{part}</React.Fragment>
  })
}

function cells(row: string) {
  return row
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map(c => c.trim())
}

export function Markdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const blocks: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i].trimEnd()
    const key = `b${i}`

    if (!line.trim()) {
      i++
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      const level = Math.min(heading[1].length, 3)
      const Tag = `h${level}` as 'h1' | 'h2' | 'h3'
      blocks.push(<Tag key={key}>{inline(heading[2], key)}</Tag>)
      i++
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push(<hr key={key} />)
      i++
      continue
    }

    if (line.trim().startsWith('|')) {
      const rows: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) rows.push(lines[i++])
      const [head, ...rest] = rows
      const body = rest.filter(r => !/^\s*\|?[\s:|-]+\|?\s*$/.test(r))
      blocks.push(
        <div key={key} className="my-4 overflow-x-auto rounded-md border border-line">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-canvas/70">
              <tr>
                {cells(head).map((c, j) => (
                  <th key={j} className="border-b border-line px-3 py-2 font-medium text-ink">
                    {inline(c, `${key}-h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {body.map((r, ri) => (
                <tr key={ri}>
                  {cells(r).map((c, j) => (
                    <td key={j} className="px-3 py-2 text-ink-soft">
                      {inline(c, `${key}-${ri}-${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      )
      continue
    }

    if (/^\s*[-*•]\s+/.test(line) || /^\s*\d+[.)]\s+/.test(line)) {
      const ordered = /^\s*\d+[.)]\s+/.test(line)
      const pattern = ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*•]\s+/
      const items: React.ReactNode[] = []
      while (i < lines.length && pattern.test(lines[i])) {
        items.push(<li key={`${key}-${items.length}`}>{inline(lines[i].replace(pattern, ''), `${key}-${items.length}`)}</li>)
        i++
      }
      blocks.push(ordered ? <ol key={key}>{items}</ol> : <ul key={key}>{items}</ul>)
      continue
    }

    const para: string[] = []
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|\s*[-*•]\s|\s*\d+[.)]\s|-{3,}|\s*\|)/.test(lines[i])) {
      para.push(lines[i].trim())
      i++
    }
    // A line no other rule claimed (e.g. "---text"): take it as plain text so the loop always advances.
    if (para.length === 0) para.push(lines[i++].trim())
    // Reports put one field per line, so keep those line breaks.
    blocks.push(
      <p key={key}>
        {para.map((text, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {inline(text, `${key}-${j}`)}
          </React.Fragment>
        ))}
      </p>,
    )
  }

  return <div className="prose-report text-sm">{blocks}</div>
}
