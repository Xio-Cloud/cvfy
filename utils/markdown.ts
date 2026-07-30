const MARKDOWN_LINK_PROTOCOL_REGEX = /^(?:https?:\/\/|mailto:)/i

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

function sanitizeHref(rawHref: string): string {
  const href = rawHref.trim()
  return MARKDOWN_LINK_PROTOCOL_REGEX.test(href)
    ? href
    : '#'
}

function renderInlineMarkdown(markdown: string): string {
  const escaped = escapeHtml(markdown)

  return escaped
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text: string, href: string) => {
      const safeHref = escapeHtml(sanitizeHref(href))
      return `<a href="${safeHref}" target="_blank" rel="noopener">${text}</a>`
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_]+)_(?!_)/g, '$1<em>$2</em>')
}

export function renderMarkdown(markdown?: string | null): string {
  if (!markdown)
    return ''

  const lines = markdown.split('\n')
  const html: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let paragraphLines: string[] = []

  const pushParagraph = () => {
    if (paragraphLines.length === 0)
      return
    html.push(`<p>${paragraphLines.join('<br>')}</p>`)
    paragraphLines = []
  }

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmedLine = line.trimStart()
    const listItemPrefix = trimmedLine.slice(0, 2)
    const isUnorderedList = ['- ', '* ', '+ '].includes(listItemPrefix)
    const orderedListMatch = trimmedLine.match(/^(\d+\.)\s/)

    if (isUnorderedList) {
      const item = trimmedLine.slice(2).trim()
      pushParagraph()
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${renderInlineMarkdown(item)}</li>`)
      continue
    }

    if (orderedListMatch) {
      const item = trimmedLine.slice(orderedListMatch[0].length).trim()
      pushParagraph()
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push(`<li>${renderInlineMarkdown(item)}</li>`)
      continue
    }

    closeList()
    if (line.trim() === '') {
      pushParagraph()
    }
    else {
      paragraphLines.push(renderInlineMarkdown(line))
    }
  }

  closeList()
  pushParagraph()
  return html.join('')
}

export function htmlSummaryToMarkdown(summary: string): string {
  if (!summary.includes('<'))
    return summary

  if (typeof DOMParser === 'undefined') {
    return summary.trim()
  }

  const parser = new DOMParser()
  const htmlDocument = parser.parseFromString(summary, 'text/html')
  const markdownLines: string[] = []

  for (const child of htmlDocument.body.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent?.trim()
      if (text) {
        markdownLines.push(text)
      }
      continue
    }

    if (child.nodeType !== Node.ELEMENT_NODE)
      continue

    const element = child as HTMLElement
    const tagName = element.tagName.toLowerCase()
    if (tagName === 'ul' || tagName === 'ol') {
      for (const listItem of element.querySelectorAll('li')) {
        const item = listItem.textContent?.trim()
        if (item) {
          markdownLines.push(`- ${item}`)
        }
      }
      markdownLines.push('')
      continue
    }

    if (tagName === 'br') {
      markdownLines.push('')
      continue
    }

    const text = element.textContent?.trim()
    if (text) {
      markdownLines.push(text)
      markdownLines.push('')
    }
  }

  return markdownLines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
