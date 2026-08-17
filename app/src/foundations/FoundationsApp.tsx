import { StrictMode, useLayoutEffect, useState, type ComponentType } from 'react'
import type { Root } from 'react-dom/client'
import '../app/app.css'
import '../app/business.css'
import '../app/dashboard.css'
import '../app/intelligence.css'
import '../app/mobility.css'
import '../app/news.css'
import '../app/health.css'
import '../shell/app-shell.css'
import './docs.css'
import { WingGlyph } from '../onboarding/WingGlyph'
import { ComponentPage, ComponentsOverview } from './ComponentsView'
import { DocsRail } from './DocsRail'
import { DocsSearch } from './DocsSearch'
import { OnThisPage } from './OnThisPage'
import { ChangelogPage } from './pages/ChangelogPage'
import { IntroductionPage } from './pages/IntroductionPage'
import { PullCord } from './PullCord'
import { useDocsRoute, type PageId } from './route'
import { AxesSection } from './sections/AxesSection'
import { ColorSection } from './sections/ColorSection'
import { ElevationSection } from './sections/ElevationSection'
import { IconsSection } from './sections/IconsSection'
import { MotionSection } from './sections/MotionSection'
import { ScaleSection } from './sections/ScaleSection'
import { TypeSection } from './sections/TypeSection'

type Preview = 'light' | 'dark'

const useThemePreview = (): [Preview, (next: Preview) => void] => {
  const [theme, setTheme] = useState<Preview>(
    () => (document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'),
  )
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  return [theme, setTheme]
}

const Header = ({ theme, onTheme }: { theme: Preview; onTheme: (next: Preview) => void }) => (
  <header className="wgd-header">
    <div className="wgd-header__brand">
      {}
      <WingGlyph className="wgd-header__mark" />
      <span>
        Wingman <strong>Design System</strong>
      </span>
    </div>
    <DocsSearch />
    <div className="wgd-header__right">
      <span className="wgd-header__target">Expo SDK 54+ &middot; RN 0.81+ &middot; New Architecture</span>
    </div>
    {}
    <PullCord theme={theme} onToggle={onTheme} />
  </header>
)

const Foundations = () => (
  <div className="wgd-page">
    <h1 className="wgd-h1">Foundations</h1>
    <p className="wgd-lead">
      The token system Wingman is built from, rendering at its real values. Every swatch, specimen, bar and
      motion demo below is read off the running stylesheet, so this page cannot disagree with the app.
    </p>
    <p className="wgd-note">
      For the rules and the reasoning, read <code>design/design-system/foundations.md</code>. For what each
      token becomes in React Native, read <code>design/design-system/tokens.md</code>. This page is the
      values.
    </p>
    <ColorSection />
    <TypeSection />
    <ScaleSection />
    <ElevationSection />
    <MotionSection />
    <IconsSection />
    <AxesSection />
  </div>
)

const PAGES: Record<PageId, ComponentType> = {
  introduction: IntroductionPage,
  changelog: ChangelogPage,
}

const Docs = () => {
  const route = useDocsRoute()
  const [theme, setTheme] = useThemePreview()
  const routeKey =
    route.view === 'foundations'
      ? 'foundations'
      : route.view === 'page'
        ? `page:${route.page}`
        : `components:${route.component ?? ''}`
  return (
    <div className="wgd" data-docs-theme={theme}>
      <Header theme={theme} onTheme={setTheme} />
      <div className="wgd-body">
        <DocsRail route={route} />
        <main className="wgd-main">
          {route.view === 'page' ? (
            (() => {
              const Page = PAGES[route.page]
              return <Page />
            })()
          ) : route.view === 'foundations' ? (
            <Foundations />
          ) : route.component === null ? (
            <ComponentsOverview />
          ) : (
            <ComponentPage id={route.component} />
          )}
        </main>
        <OnThisPage routeKey={routeKey} />
      </div>
    </div>
  )
}

export const mountFoundations = (root: Root) => {
  document.title = 'Wingman Design System'
  root.render(
    <StrictMode>
      <Docs />
    </StrictMode>,
  )
}
