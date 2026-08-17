import { useState, type ReactNode } from 'react'
import { highlight } from './highlight'
import { isUnthemed, type ThemedValue } from './resolve'
import { tv } from './tokenStore'

export const Section = ({ id, title, lead, children }: { id: string; title: string; lead?: ReactNode; children: ReactNode }) => (
  <section className="wgd-section" id={id}>
    <h2 className="wgd-h2">{title}</h2>
    {lead ? <p className="wgd-lead">{lead}</p> : null}
    {children}
  </section>
)

export const Sub = ({ title, note, children }: { title: string; note?: ReactNode; children: ReactNode }) => (
  <div className="wgd-sub">
    <h3 className="wgd-h3">{title}</h3>
    {note ? <p className="wgd-note">{note}</p> : null}
    {children}
  </div>
)

export const Copy = ({ text }: { text: string }) => {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      className="wgd-copy"
      aria-label={`Copy ${text}`}
      onClick={() => {
        void navigator.clipboard?.writeText(text)
        setDone(true)
        window.setTimeout(() => setDone(false), 1200)
      }}
    >
      {done ? 'copied' : 'copy'}
    </button>
  )
}

export const TokenRow = ({ name, swatch }: { name: string; swatch?: boolean }) => {
  const value = tv(name)
  const flat = isUnthemed(value)
  return (
    <tr>
      <th scope="row">
        <code>{name}</code>
        <Copy text={name} />
      </th>
      <td>
        {swatch ? <span className="wgd-swatch" style={{ background: value.light }} /> : null}
        <code>{value.light || '(not set)'}</code>
      </td>
      <td>
        {flat ? (
          <span className="wgd-same">same</span>
        ) : (
          <>
            {swatch ? <span className="wgd-swatch wgd-swatch--dark" style={{ background: value.dark }} /> : null}
            <code>{value.dark}</code>
          </>
        )}
      </td>
    </tr>
  )
}

export const TokenTable = ({ tokens, swatch }: { tokens: readonly string[]; swatch?: boolean }) => (
  <div className="wgd-scroll">
    <table className="wgd-table">
      <thead>
        <tr>
          <th scope="col">Token</th>
          <th scope="col">Light</th>
          <th scope="col">Dark</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((name) => (
          <TokenRow key={name} name={name} swatch={swatch} />
        ))}
      </tbody>
    </table>
  </div>
)

export const Note = ({ children }: { children: ReactNode }) => <p className="wgd-note">{children}</p>

export const Trap = ({ children }: { children: ReactNode }) => (
  <div className="wgd-trap">
    <span className="wgd-trap__tag">React Native</span>
    <div>{children}</div>
  </div>
)

export const Code = ({ children }: { children: string }) => (
  <pre className="wgd-code">
    <code>{highlight(children)}</code>
  </pre>
)

export const themedText = (value: ThemedValue): string =>
  isUnthemed(value) ? value.light : `${value.light} / ${value.dark}`
