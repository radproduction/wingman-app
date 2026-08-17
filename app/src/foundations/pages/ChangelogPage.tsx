import { DS_CHANGELOG } from '../dsMeta'

export const ChangelogPage = () => (
  <div className="wgd-page">
    <h1 className="wgd-h1">Changelog</h1>
    <p className="wgd-lead">
      What changed in the design system, per version. The same history ships inside the kit as its
      CHANGELOG.md, from the same source, so the two cannot disagree.
    </p>

    {DS_CHANGELOG.map((entry) => (
      <section className="wgd-docsec" key={entry.version}>
        <h2 className="wgd-h2">
          {entry.version} <span className="wgd-changelog__date">{entry.date}</span>
        </h2>
        <ul className="wgd-list">
          {entry.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    ))}
  </div>
)
