import { Fragment, type CSSProperties } from 'react'

export const DashboardSkeleton = () => (
  <div className="wg-skel__skeleton is-pulsing" aria-hidden="true">
    <div className="wg-wskel">
      <span className="tall" />
      <span />
      <span />
      <span className="wide" />
      <span className="tall" />
    </div>
  </div>
)

export const PanelSkeleton = ({ groups, chip }: { groups: number[]; chip?: number }) => (
  <div
    className="wg-skel__skeleton is-pulsing"
    aria-hidden="true"
    style={chip ? ({ '--skel-chip': `${chip}px` } as CSSProperties) : undefined}
  >
    <div className="wg-skel__brief" />
    {groups.map((rows, g) => (
      <Fragment key={g}>
        <div className="wg-skel__head" />
        <div className="wg-skel__list">
          {Array.from({ length: rows }).map((_, i) => (
            <div className="wg-skel__row wg-card-line" key={i}>
              <span className="wg-skel__chip" />
              <span className="wg-skel__tx">
                <i className="a" />
                <i className="b" />
              </span>
            </div>
          ))}
        </div>
      </Fragment>
    ))}
  </div>
)
