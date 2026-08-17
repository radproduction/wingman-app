import { TabBar } from './TabBar'

export const AppChrome = ({ route, open }: { route: string; open: boolean }) => (
  <div className="wm-chrome gh" data-down={!open || undefined} aria-hidden={!open || undefined}>
    <TabBar route={route} />
  </div>
)
