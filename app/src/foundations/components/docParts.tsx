import type { ReactNode } from 'react'
import { highlight } from '../highlight'
import { Copy } from '../parts'

export const Stage = ({
  ground = 'panel',
  children,
}: {
  ground?: 'panel' | 'home'
  children: ReactNode
}) => <div className={`wgd-stage wgd-stage--${ground}`}>{children}</div>

export type PropRow = {
  prop: string
  type: string
  default?: string
  rn: string
  desc: string
}

export const PropsTable = ({ rows }: { rows: readonly PropRow[] }) => (
  <div className="wgd-scroll">
    <table className="wgd-table wgd-table--props">
      <thead>
        <tr>
          <th scope="col">Prop</th>
          <th scope="col">Type</th>
          <th scope="col">Default</th>
          <th scope="col">React Native</th>
          <th scope="col">What it does</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.prop}>
            <th scope="row">
              <code>{row.prop}</code>
            </th>
            <td>
              <code>{row.type}</code>
            </td>
            <td>{row.default ? <code>{row.default}</code> : '-'}</td>
            <td>
              <code>{row.rn}</code>
            </td>
            <td className="wgd-cell-wrap">{row.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export type AnatomyRow = { part: string; spec: string }

export const Anatomy = ({ rows }: { rows: readonly AnatomyRow[] }) => (
  <div className="wgd-scroll">
    <table className="wgd-table">
      <thead>
        <tr>
          <th scope="col">Part</th>
          <th scope="col">Spec</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.part}>
            <th scope="row">{row.part}</th>
            <td className="wgd-cell-wrap">{row.spec}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export type BehaviourRow = { state: string; rule: string }

export const Behaviour = ({ rows }: { rows: readonly BehaviourRow[] }) => (
  <div className="wgd-scroll">
    <table className="wgd-table">
      <thead>
        <tr>
          <th scope="col">State</th>
          <th scope="col">Rule</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.state}>
            <th scope="row">{row.state}</th>
            <td className="wgd-cell-wrap">{row.rule}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const TokensUsed = ({ names }: { names: readonly string[] }) => (
  <ul className="wgd-tokens">
    {names.map((name) => (
      <li key={name} className="wgd-tokens__item">
        <code>{name}</code>
        <Copy text={name} />
      </li>
    ))}
  </ul>
)

export const Contract = ({ label, code }: { label: string; code: string }) => (
  <div className="wgd-contract">
    <div className="wgd-contract__bar">
      <span className="wgd-contract__tag">RN contract</span>
      <code>{label}</code>
      <Copy text={code} />
    </div>
    <pre className="wgd-code wgd-code--contract">
      <code>{highlight(code)}</code>
    </pre>
  </div>
)

export const DocSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="wgd-docsec">
    <h2 className="wgd-h2">{title}</h2>
    {children}
  </section>
)
