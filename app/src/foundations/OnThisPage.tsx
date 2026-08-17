import { useEffect, useState } from 'react'

type Child = { id: string; text: string }
type Item = { id: string; text: string; children: Child[] }

const slug = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const collect = (): Item[] => {
  const main = document.querySelector('.wgd-main')
  if (!main) return []
  const taken = new Set<string>()
  const items: Item[] = []
  for (const el of main.querySelectorAll<HTMLElement>('h2, h3')) {
    const text = el.textContent?.trim() ?? ''
    if (!text) continue
    let id = el.id
    if (!id && el.tagName === 'H2') id = el.closest('section[id]')?.id ?? ''
    if (!id || taken.has(id)) {
      const base = slug(text) || 'section'
      let candidate = base
      let n = 2
      while (taken.has(candidate) || (document.getElementById(candidate) && document.getElementById(candidate) !== el))
        candidate = `${base}-${n++}`
      id = candidate
      el.id = id
    }
    taken.add(id)
    if (el.tagName === 'H2' || items.length === 0) items.push({ id, text, children: [] })
    else items[items.length - 1].children.push({ id, text })
  }
  return items
}

const flatten = (items: Item[]): Child[] => items.flatMap((item) => [{ id: item.id, text: item.text }, ...item.children])

const Link = ({ id, text, current, child }: { id: string; text: string; current: string; child?: boolean }) => (
  <a
    href={`#${id}`}
    className={`wgd-otp__link${child ? ' wgd-otp__link--child' : ''}`}
    aria-current={current === id ? 'true' : undefined}
  >
    {text}
  </a>
)

export const OnThisPage = ({ routeKey }: { routeKey: string }) => {
  const [items, setItems] = useState<Item[]>([])
  const [current, setCurrent] = useState('')

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const found = collect()
      setItems(found)
      setCurrent(found[0]?.id ?? '')
    })
    return () => cancelAnimationFrame(frame)
  }, [routeKey])

  useEffect(() => {
    const all = flatten(items)
    if (!all.length) return
    const onScroll = () => {
      let found = all[0].id
      for (const heading of all) {
        const node = document.getElementById(heading.id)
        if (node && node.getBoundingClientRect().top <= 120) found = heading.id
      }
      setCurrent(found)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items])

  if (flatten(items).length < 2) return <div className="wgd-otp" aria-hidden="true" />

  return (
    <nav className="wgd-otp" aria-label="On this page">
      <p className="wgd-otp__label">On this page</p>
      <ul className="wgd-otp__list">
        {items.map((item) => (
          <li key={item.id}>
            <Link id={item.id} text={item.text} current={current} />
            {item.children.length > 0 ? (
              <ul className="wgd-otp__sublist">
                {item.children.map((child) => (
                  <li key={child.id}>
                    <Link id={child.id} text={child.text} current={current} child />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </nav>
  )
}
