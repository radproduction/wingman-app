import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';
import { WING_BOX, WING_W, WING_STAR } from '../../wingman-ds/assets/brand';

/**
 * The W+Star brand mark as an app-icon lockup — the exact presentation on the
 * onboarding hero: a light card peeking from behind a blue squircle that holds
 * the white mark. Geometry is the vendored brand path data (brand.ts), so it is
 * the same mark the web app, icons and splash draw.
 */
export function BrandMark({ size = 112 }: { size?: number }) {
  const { palette } = useTheme();
  const offset = size * 0.14;
  const radius = size * 0.28; // the squircle rung
  const markW = size * 0.58;
  const markH = markW * (WING_BOX.height / WING_BOX.width);

  return (
    <View style={{ width: size + offset, height: size + offset }}>
      {/* the light card behind, peeking top-left */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: palette.glassHi,
        }}
      />
      {/* the blue squircle holding the white mark */}
      <View
        style={{
          position: 'absolute',
          top: offset,
          left: offset,
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: palette.accent,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Svg width={markW} height={markH} viewBox={`0 0 ${WING_BOX.width} ${WING_BOX.height}`} fill="none">
          <Path d={WING_W} fill={palette.onAccent} />
          <Path d={WING_STAR} fill={palette.onAccent} />
        </Svg>
      </View>
    </View>
  );
}
