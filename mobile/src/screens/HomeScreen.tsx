import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Screen } from '../components/Screen';
import { Icon } from '../theme/Icon';
import { useTheme } from '../theme/ThemeProvider';
import { api } from '../api/client';
import type { Me, DashboardSummary } from '../api/types';
import { Mail01Icon, Task01Icon } from '../../wingman-ds/icons/duotone';

/**
 * Reference Home screen — proves the whole loop end to end: design tokens +
 * a component + LIVE data from the existing backend. Not the final Home (that is
 * the widget canvas, D-035); this is the pattern the rest of the screens follow.
 *
 * "Status is the headline": the card leads with the assistant's read, evidence
 * underneath. Separation is tonal (surface on canvas), with the one sanctioned
 * card hairline.
 */
export function HomeScreen() {
  const { theme, palette } = useTheme();
  const [me, setMe] = useState<Me | null>(null);
  const [dash, setDash] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [u, d] = await Promise.all([api.me().catch(() => null), api.dashboard().catch(() => null)]);
      if (u) setMe(u);
      if (d) setDash(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const urgent = dash?.emailCounts?.urgent ?? 0;
  const needsReply = dash?.emailCounts?.needsReply ?? 0;
  const tasksDue = dash?.tasksDueToday ?? 0;

  return (
    <Screen
      onRefresh={() => {
        setRefreshing(true);
        load();
      }}
      refreshing={refreshing}
    >
      <Text style={{ color: palette.ink, fontSize: 26, lineHeight: 29 }}>
        {me?.name ? `Hi ${me.name}` : 'Hi there'}
      </Text>

      {loading ? (
        <View style={{ paddingVertical: theme.space['32'], alignItems: 'center' }}>
          <ActivityIndicator color={palette.accent} />
        </View>
      ) : (
        <>
          <Card>
            <Row icon={Mail01Icon} tone={palette.toneBlue} disc={palette.chipBlue}>
              <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '500' }}>
                {urgent === 0 && needsReply === 0 ? 'Inbox is clear' : `${urgent} urgent, ${needsReply} to reply`}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 13 }}>Email</Text>
            </Row>
          </Card>

          <Card>
            <Row icon={Task01Icon} tone={palette.toneMint} disc={palette.chipMint}>
              <Text style={{ color: palette.ink, fontSize: 15, fontWeight: '500' }}>
                {tasksDue === 0 ? 'Nothing due today' : `${tasksDue} due today`}
              </Text>
              <Text style={{ color: palette.muted, fontSize: 13 }}>Tasks</Text>
            </Row>
          </Card>

          <Text style={{ color: palette.muted, fontSize: 12.5, textAlign: 'center', marginTop: theme.space['8'] }}>
            Live from your Wingman backend. Pull to refresh.
          </Text>
        </>
      )}
    </Screen>
  );

  // ── local building blocks (the card TREATMENT, not a Card component) ──
  function Card({ children }: { children: React.ReactNode }) {
    return (
      <View
        style={{
          backgroundColor: palette.card,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          borderColor: palette.cardLine,
          padding: theme.space['16'],
        }}
      >
        {children}
      </View>
    );
  }

  function Row({
    icon,
    tone,
    disc,
    children,
  }: {
    icon: React.ComponentProps<typeof Icon>['glyph'];
    tone: string;
    disc: string;
    children: React.ReactNode;
  }) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space['12'] }}>
        <View
          style={{
            width: theme.chip.md,
            height: theme.chip.md,
            borderRadius: theme.chip.md / 2,
            backgroundColor: disc,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon glyph={icon} size={theme.chipIcon.md} color={tone} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>{children}</View>
      </View>
    );
  }
}
