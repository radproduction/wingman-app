import type { ReactNode } from 'react'

const RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|(\b(?:interface|type|enum|const|let|var|function|return|import|export|from|extends|implements|new|typeof|keyof|readonly|default|case|switch|if|else|for|while|true|false|null|undefined|void|never|number|string|boolean|class|static|async|await|in|of|as)\b)|(\b[A-Z][A-Za-z0-9_]*\b)|(\b\d+(?:\.\d+)?\b)/g

const CLASS = ['wgd-tok-comment', 'wgd-tok-string', 'wgd-tok-keyword', 'wgd-tok-type', 'wgd-tok-number']

export const highlight = (code: string): ReactNode[] => {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  for (const match of code.matchAll(RE)) {
    const index = match.index
    if (index > last) out.push(code.slice(last, index))
    const group = match.slice(1).findIndex((g) => g !== undefined)
    out.push(
      <span key={key++} className={CLASS[group]}>
        {match[0]}
      </span>,
    )
    last = index + match[0].length
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}
