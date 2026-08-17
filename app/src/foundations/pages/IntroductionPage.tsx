import { BrandLockup } from '../BrandLockup'
import { Note } from '../parts'
import { DS_VERSION } from '../dsMeta'
import { navigateDocs } from '../route'

export const IntroductionPage = () => (
  <div className="wgd-page">
    {}
    <h1 className="wgd-h1 wgd-hero">
      <BrandLockup className="wgd-hero__mark" />
      <span className="wgd-hero__suffix">Design System</span>
    </h1>
    <p className="wgd-lead">
      The design system behind the Wingman app, documented for the team building it a second time in
      React Native. Version {DS_VERSION}. Nothing on this site is a mock-up: the app exists, ships as a
      web PWA, and every value in these pages is read off its running stylesheet, so the documentation
      cannot disagree with the product.
    </p>

    <section className="wgd-docsec">
      <h2 className="wgd-h2">What this is</h2>
      <p className="wgd-lead">
        Wingman is a proactive assistant that lives on WhatsApp; the app is where you meet it, shape it,
        and check on it. The visual language is calm, rounded, tonal, and low density. This site carries
        that language in three layers:
      </p>
      <ul className="wgd-list">
        <li>
          <strong>Foundations</strong>: the token system - colour, typography, spacing and shape,
          elevation, motion, iconography, and the runtime axes - each rendered at its real values in
          both themes.
        </li>
        <li>
          <strong>Components</strong>: the roster of roughly 85 components audited out of the app, each
          documented with its anatomy, states, tokens, and a binding React Native contract. The roster
          is honest about status: what is documented, what is pending, and what deliberately does not
          cross to native.
        </li>
      </ul>
    </section>

    <section className="wgd-docsec">
      <h2 className="wgd-h2">The direction of truth</h2>
      <div className="wgd-scroll">
        <table className="wgd-table">
          <thead>
            <tr>
              <th scope="col">Layer</th>
              <th scope="col">Authority</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">The app's stylesheet and screens</th>
              <td className="wgd-cell-wrap">The value source of truth. What the app renders is what the design system is.</td>
            </tr>
            <tr>
              <th scope="row">This site</th>
              <td className="wgd-cell-wrap">Authors the cross-platform contract. One source, two syntaxes.</td>
            </tr>
            <tr>
              <th scope="row">The React Native implementation</th>
              <td className="wgd-cell-wrap">Downstream. It never wins an argument with the two above.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <Note>
        A wrong contract is fixed in the contract first, then implemented - never one thing on this site
        and another in the app. When the React Native build genuinely needs to diverge, that is a
        decision made together, and the contract records it.
      </Note>
    </section>

    <section className="wgd-docsec">
      <h2 className="wgd-h2">The target</h2>
      <div className="wgd-scroll">
        <table className="wgd-table">
          <tbody>
            <tr>
              <th scope="row">Framework</th>
              <td className="wgd-cell-wrap">Expo managed, SDK 54+, Continuous Native Generation, EAS Build and Update</td>
            </tr>
            <tr>
              <th scope="row">React Native</th>
              <td>0.81+, New Architecture, Hermes</td>
            </tr>
            <tr>
              <th scope="row">Platforms</th>
              <td className="wgd-cell-wrap">iOS 15.1+ and Android minSdk 24 from day one; phone-first, portrait only for v1</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section className="wgd-docsec">
      <h2 className="wgd-h2">Where to start</h2>
      <ul className="wgd-list">
        <li>
          Read the <button type="button" className="wgd-link" onClick={() => navigateDocs({ view: 'foundations' })}>Foundations</button>{' '}
          top to bottom once - the rules live there, and the React Native callouts flag every conversion
          that is not one-for-one.
        </li>
        <li>
          Build components from their pages in{' '}
          <button type="button" className="wgd-link" onClick={() => navigateDocs({ view: 'components', component: null })}>Components</button>,
          starting with Button - the pilot that sets the shape every page follows.
        </li>
      </ul>
    </section>
  </div>
)
