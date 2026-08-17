import React from 'react';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, Ellipse, G } from 'react-native-svg';
import type { IconSvgElement } from '../../wingman-ds/icons/duotone';

/**
 * The one Icon component. Every glyph in the app is drawn through here, never as
 * inline SVG at a call site (foundations §9). A glyph is a Hugeicons duotone set
 * — a 0.4-opacity fill layer under a 1.5 stroke, BOTH painted from one colour —
 * so a single `color` moves both layers. Size follows the chip rung it sits in
 * (18 / 22 / 24 / 26), never a per-call-site choice.
 */

const TAGS: Record<string, React.ComponentType<any>> = {
  path: Path,
  circle: Circle,
  rect: Rect,
  line: Line,
  polyline: Polyline,
  polygon: Polygon,
  ellipse: Ellipse,
  g: G,
};

// react-native-svg wants camelCase props; the vendored glyphs already use them
// (strokeWidth, strokeLinecap…). "currentColor" is resolved to the icon colour.
function resolve(attrs: Record<string, string>, color: string) {
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'key') continue;
    out[k] = v === 'currentColor' ? color : v;
  }
  return out;
}

export function Icon({
  glyph,
  size = 24,
  color,
}: {
  glyph: IconSvgElement;
  size?: number;
  color: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {glyph.map(([tag, attrs], i) => {
        const El = TAGS[tag];
        if (!El) return null;
        return <El key={i} {...resolve(attrs as Record<string, string>, color)} />;
      })}
    </Svg>
  );
}
