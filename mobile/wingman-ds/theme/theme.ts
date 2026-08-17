// AUTO-GENERATED - Wingman Design System v0.1.6. DO NOT EDIT BY HAND.
// Source of truth: app/src/app/app.css in the Wingman repo; this file is
// regenerated whenever a token changes, so a hand edit here is a fork that
// silently drifts. Get a fresh copy from the documentation site's
// Installation page.
//
// Conversion notes (the full guide is docs/tokens.md in this kit):
//  - px and ms are plain numbers (1 CSS px = 1 dp).
//  - lineHeight is absolute in React Native: fontSize * type.pillLine.
//  - the pill label sink is fontSize * type.pillNudgeEm as asymmetric padding
//    (top gains, bottom loses); zero for Arabic, Urdu and Hindi. Android needs
//    includeFontPadding: false alongside it.
//  - shadows: use .boxShadow (RN 0.76+, New Architecture) on Android 9+ and
//    iOS; .android78Elevation is the Android 7-8 fallback.
//  - circles are diameter / 2, computed - never a hardcoded radius.
//  - easings drop into Reanimated's Easing.bezier as written.

export const theme = {
  "palette": {
    "light": {
      "canvas": "#f0eee8",
      "panel": "#e9edf4",
      "panelInner": "#eef1f7",
      "settled": "#dae1ec",
      "homeSurface": "#ffffff",
      "surface": "#ffffff",
      "surfaceAlt": "#fefdfb",
      "card": "#fefdfb",
      "cardTonal": "#eceae4",
      "cardTonalCool": "#d5dceb",
      "disc": "#e9edf4",
      "ink": "#1c1b1a",
      "muted": "#6f6d68",
      "onAccent": "#ffffff",
      "onInk": "#fefdfb",
      "accent": "#4a6fd4",
      "accentDeep": "#3a5cb8",
      "accentTonal": "#dde5f8",
      "accentLine": "rgba(58, 92, 184, 0.16)",
      "focusRing": "rgba(74, 111, 212, 0.35)",
      "warn": "#b26a00",
      "warnTonal": "#ecdcc9",
      "alert": "#ff4757",
      "ok": "#3e6b55",
      "okSoft": "#4a8a72",
      "okTonal": "#d9f2e0",
      "online": "#4cd137",
      "chipBlue": "#e3e7f7",
      "chipLavender": "#eae3f2",
      "chipMint": "#dfede6",
      "chipPeach": "#f7e8dc",
      "chipSand": "#f3e9df",
      "chipRose": "#f8e0e3",
      "toneBlue": "#4a6fd4",
      "toneLavender": "#8b74b8",
      "toneMint": "#52907a",
      "tonePeach": "#c47c3f",
      "toneSand": "#94794a",
      "toneRose": "#c4636f",
      "toneLavenderText": "#6d5a92",
      "tonePeachText": "#9a5f2e",
      "toneSandText": "#82613c",
      "track": "#c9c6bf",
      "trackCool": "#c3ccdd",
      "line": "rgba(28, 27, 26, 0.07)",
      "lineSoft": "rgba(28, 27, 26, 0.06)",
      "lineStrong": "rgba(28, 27, 26, 0.14)",
      "frameLine": "rgba(28, 27, 26, 0.13)",
      "cardLine": "rgba(28, 27, 26, 0.13)",
      "scrim": "rgba(28, 27, 26, 0.42)",
      "glass": "rgba(254, 253, 251, 0.6)",
      "glassHi": "rgba(255, 255, 255, 0.85)",
      "glassLine": "rgba(255, 255, 255, 0.35)",
      "knob": "#ffffff",
      "brandDisc": "#eef1f7",
      "artPaper": "#eef1f7",
      "artInk": "#d5dceb",
      "toastBg": "rgba(28, 27, 26, 0.94)",
      "metricVeil": "rgba(255, 255, 255, 0.7)",
      "metricTeal": "#a0e0d5",
      "metricTealFill": "#6fccbc",
      "metricTealDisc": "#e2f5f0",
      "metricTealInk": "#0d3a33",
      "metricTealIcon": "#0f5e51",
      "metricAmber": "#f0dcae",
      "metricAmberFill": "#e3c169",
      "metricAmberDisc": "#f7eed6",
      "metricAmberInk": "#4a3a12",
      "metricAmberIcon": "#8a6d1f",
      "metricViolet": "#e2d6f6",
      "metricVioletFill": "#c2a6ee",
      "metricVioletDisc": "#efe7fb",
      "metricVioletInk": "#2d2050",
      "metricVioletIcon": "#5b2e92",
      "dayBg": "#b1c4f1",
      "dayFoot": "#cbd8f6",
      "dayTrack": "#8fa9e0",
      "dayDisc": "#dce5fa",
      "dayInk": "#172850",
      "dayStrong": "#2e53a8",
      "tfFlow": "#3f9c6b",
      "tfSlow": "#d98324",
      "tfHeavy": "#db5b4d",
      "tfSevere": "#b23125",
      "tfJam": "#7f1d15",
      "tfFetch": "#9fb4ec",
      "routeAlt": "#8aa9ee",
      "factDisc": "#e7e9ee",
      "factIcon": "#4f4d48"
    },
    "dark": {
      "canvas": "#131313",
      "panel": "#191919",
      "panelInner": "#1b1b1b",
      "settled": "#121213",
      "homeSurface": "#131313",
      "surface": "#1e1e20",
      "surfaceAlt": "#242426",
      "card": "#1e1e20",
      "cardTonal": "#262628",
      "cardTonalCool": "#2a2a2c",
      "disc": "#2c2c2e",
      "ink": "#f4f4f4",
      "muted": "#a0a0a0",
      "onAccent": "#101014",
      "onInk": "#141414",
      "accent": "#8ab4f8",
      "accentDeep": "#adcbff",
      "accentTonal": "#223349",
      "accentLine": "rgba(138, 180, 248, 0.22)",
      "focusRing": "rgba(138, 180, 248, 0.45)",
      "warn": "#e0a44a",
      "warnTonal": "#3a2e1c",
      "alert": "#ff6b78",
      "ok": "#6fbf98",
      "okSoft": "#6fbf98",
      "okTonal": "#1e3a2c",
      "online": "#4cd137",
      "chipBlue": "#223052",
      "chipLavender": "#2e2740",
      "chipMint": "#22392f",
      "chipPeach": "#3a2c22",
      "chipSand": "#363026",
      "chipRose": "#3d262a",
      "toneBlue": "#93aef0",
      "toneLavender": "#b9a3e0",
      "toneMint": "#7fc3a5",
      "tonePeach": "#e0a874",
      "toneSand": "#cdb47f",
      "toneRose": "#e79aa4",
      "toneLavenderText": "#b9a3e0",
      "tonePeachText": "#e0a874",
      "toneSandText": "#cdb47f",
      "track": "#3a3a3a",
      "trackCool": "#404040",
      "line": "rgba(255, 255, 255, 0.09)",
      "lineSoft": "rgba(255, 255, 255, 0.07)",
      "lineStrong": "rgba(255, 255, 255, 0.16)",
      "frameLine": "rgba(255, 255, 255, 0.18)",
      "cardLine": "rgba(255, 255, 255, 0.04)",
      "scrim": "rgba(0, 0, 0, 0.62)",
      "glass": "rgba(26, 26, 26, 0.72)",
      "glassHi": "rgba(255, 255, 255, 0.1)",
      "glassLine": "rgba(255, 255, 255, 0.06)",
      "knob": "#ffffff",
      "brandDisc": "#303032",
      "artPaper": "#757575",
      "artInk": "#222222",
      "toastBg": "rgba(242, 244, 248, 0.95)",
      "metricVeil": "rgba(255, 255, 255, 0.12)",
      "metricTeal": "#1e4a44",
      "metricTealFill": "#2a655c",
      "metricTealDisc": "#123430",
      "metricTealInk": "#cfeee7",
      "metricTealIcon": "#6fccbc",
      "metricAmber": "#3a2f14",
      "metricAmberFill": "#5a4a1e",
      "metricAmberDisc": "#2a2210",
      "metricAmberInk": "#f0e2b8",
      "metricAmberIcon": "#d8b96a",
      "metricViolet": "#342a52",
      "metricVioletFill": "#4b3a75",
      "metricVioletDisc": "#241d38",
      "metricVioletInk": "#e2d6f6",
      "metricVioletIcon": "#b393e8",
      "dayBg": "#222f4f",
      "dayFoot": "#2b3c64",
      "dayTrack": "#42588a",
      "dayDisc": "#17203a",
      "dayInk": "#cbd8f6",
      "dayStrong": "#82a2ed",
      "tfFlow": "#56c187",
      "tfSlow": "#eaa24a",
      "tfHeavy": "#ef776a",
      "tfSevere": "#db5346",
      "tfJam": "#b0392c",
      "tfFetch": "#c2d6fb",
      "routeAlt": "#d4e3fd",
      "factDisc": "#0c0c0c",
      "factIcon": "#a8a8a8"
    }
  },
  "shadows": {
    "light": {
      "card": {
        "boxShadow": "0 4px 16px rgba(28, 27, 26, 0.12)",
        "android78Elevation": 3
      },
      "nav": {
        "boxShadow": "0 10px 30px rgba(28, 27, 26, 0.18), 0 2px 8px rgba(28, 27, 26, 0.08)",
        "android78Elevation": 12
      },
      "sheet": {
        "boxShadow": "0 -18px 44px rgba(28, 27, 26, 0.16)",
        "android78Elevation": 16
      },
      "thumb": {
        "boxShadow": "0 2px 6px rgba(28, 27, 26, 0.2), 0 0 0 1px rgba(28, 27, 26, 0.05)",
        "android78Elevation": 2
      },
      "toast": {
        "boxShadow": "0 10px 30px rgba(28, 27, 26, 0.28)",
        "android78Elevation": 12
      }
    },
    "dark": {
      "card": {
        "boxShadow": "0 4px 16px rgba(0, 0, 0, 0.5)",
        "android78Elevation": 3
      },
      "nav": {
        "boxShadow": "0 10px 30px rgba(0, 0, 0, 0.55), 0 2px 8px rgba(0, 0, 0, 0.4)",
        "android78Elevation": 12
      },
      "sheet": {
        "boxShadow": "0 -18px 44px rgba(0, 0, 0, 0.5)",
        "android78Elevation": 16
      },
      "thumb": {
        "boxShadow": "0 2px 6px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.08)",
        "android78Elevation": 2
      },
      "toast": {
        "boxShadow": "0 10px 30px rgba(0, 0, 0, 0.55)",
        "android78Elevation": 12
      }
    }
  },
  "space": {
    "4": 4,
    "8": 8,
    "12": 12,
    "16": 16,
    "24": 24,
    "32": 32,
    "48": 48,
    "64": 64
  },
  "radius": {
    "none": 0,
    "xs": 6,
    "sm": 8,
    "md": 12,
    "lg": 16,
    "xl": 24,
    "pill": 999
  },
  "chip": {
    "xs": 32,
    "sm": 40,
    "md": 48,
    "lg": 52
  },
  "chipIcon": {
    "xs": 18,
    "sm": 22,
    "md": 24,
    "lg": 26
  },
  "row": {
    "padY": 12,
    "gap": 12,
    "chip": 40,
    "listGap": 8,
    "setPadY": 12,
    "fsRow": 15,
    "fsSub": 13
  },
  "density": {
    "compact": {
      "padY": 8,
      "gap": 8,
      "chip": 32,
      "listGap": 4,
      "setPadY": 8,
      "fsRow": 15,
      "fsSub": 13,
      "chipXs": 32,
      "chipSm": 32,
      "chipMd": 48,
      "chipLg": 52,
      "chipIconXs": 18,
      "chipIconSm": 18,
      "chipIconMd": 24,
      "chipIconLg": 26
    }
  },
  "textSize": {
    "small": {
      "row": 13.5,
      "sub": 12
    },
    "large": {
      "row": 16.5,
      "sub": 14
    }
  },
  "type": {
    "fontStack": "'Google Sans Flex', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    "pillLine": 1.3,
    "pillNudgeEm": 0.055,
    "fontRound": 100,
    "roles": [
      {
        "role": "display/lg",
        "size": 30,
        "weight": 400,
        "lineHeight": 1.15,
        "tracking": "-1%",
        "use": "onboarding heading"
      },
      {
        "role": "display/md",
        "size": 26,
        "weight": 400,
        "lineHeight": 1.1,
        "use": "day-card key value"
      },
      {
        "role": "display/sm",
        "size": 19,
        "weight": 400,
        "lineHeight": 1.15,
        "use": "tile value, wordmark"
      },
      {
        "role": "title/lg",
        "size": 17,
        "weight": 500,
        "use": "hero greeting, field text"
      },
      {
        "role": "title/md",
        "size": 16,
        "weight": 500,
        "use": "section headings"
      },
      {
        "role": "title/sm",
        "size": 15,
        "weight": 500,
        "use": "row titles, button labels"
      },
      {
        "role": "body/md",
        "size": 15,
        "weight": 400,
        "lineHeight": 1.45,
        "use": "screen body copy"
      },
      {
        "role": "body/sm",
        "size": 13.5,
        "weight": 400,
        "lineHeight": 1.4,
        "use": "hero summary, toast"
      },
      {
        "role": "label/md",
        "size": 13,
        "weight": 500,
        "use": "card and tile titles"
      },
      {
        "role": "label/sm",
        "size": 12,
        "weight": 500,
        "use": "channel chip"
      },
      {
        "role": "label/xs",
        "size": 11,
        "weight": 500,
        "use": "tab bar labels"
      },
      {
        "role": "caption",
        "size": 12.5,
        "weight": 400,
        "lineHeight": 1.45,
        "use": "notes, hints, subtext"
      },
      {
        "role": "overline",
        "size": 11,
        "weight": 500,
        "tracking": "+8%",
        "use": "all-caps kickers"
      }
    ]
  },
  "motion": {
    "duration": {
      "stagger": 40,
      "micro": 80,
      "quick": 150,
      "fast": 250,
      "medium": 350,
      "slow": 400,
      "verySlow": 500
    },
    "easing": {
      "smoothOut": "cubic-bezier(0.22, 1, 0.36, 1)",
      "inOut": "ease-in-out",
      "out": "ease-out",
      "linear": "linear",
      "bounce": "cubic-bezier(0.34, 1.36, 0.64, 1)",
      "bounceStrong": "cubic-bezier(0.34, 3.85, 0.64, 1)"
    },
    "distance": {
      "micro": 4,
      "small": 6,
      "base": 8,
      "medium": 12,
      "large": 30
    },
    "scale": {
      "large": 0.96,
      "medium": 0.97,
      "small": 0.98,
      "tiny": 0.99
    },
    "blur": {
      "small": 2,
      "medium": 3,
      "large": 8
    },
    "named": {
      "modal": {
        "openDur": 250,
        "ease": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "toast": {
        "open": 350,
        "close": 250,
        "distance": 16,
        "blur": 2,
        "scale": 0.97,
        "ease": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "tabs": {
        "dur": 250,
        "ease": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "page": {
        "slideDur": 250,
        "slideDistance": "100%",
        "parallax": "25%",
        "blur": 3,
        "slideEase": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "check": {
        "box": 150,
        "draw": 350,
        "delay": 0,
        "uncheck": 150,
        "ease": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "toggle": {
        "dur": 350,
        "travel": 18,
        "ov1": 1,
        "ov2": 0,
        "track": 150,
        "ease": "cubic-bezier(0.34, 1.35, 0.64, 1)"
      },
      "stagger": {
        "dur": 500,
        "distance": 12,
        "stagger": 40,
        "blur": 3,
        "ease": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "acc": {
        "expand": 250,
        "collapse": 250,
        "chevron": 250,
        "ease": "cubic-bezier(0.22, 1, 0.36, 1)"
      },
      "pulse": {
        "dur": 1000,
        "min": 0.25,
        "skelHold": 1500,
        "revealDur": 400,
        "revealBlur": 2,
        "revealEase": "ease-in-out"
      }
    }
  }
} as const

export type Theme = typeof theme
export type ThemeMode = keyof typeof theme.palette
