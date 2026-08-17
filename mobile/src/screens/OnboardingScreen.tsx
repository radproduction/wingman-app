import React, { useRef, useState } from 'react';
import { ScrollView, Text, View, useWindowDimensions, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { BrandMark } from '../components/BrandMark';
import { PageDots } from '../components/PageDots';
import { Button } from '../components/Button';

/**
 * The intro carousel — the first thing a new user sees, matching the prototype:
 * a soft pastel hero holding the brand mark, a display heading, page dots, and
 * one action. Swipe or tap Next; the last slide's action begins sign-in.
 */
const SLIDES = [
  { title: 'Meet Wingman,\nyour chief of staff' },
  { title: 'Your whole day,\nin one calm place' },
  { title: 'Always just a\nmessage away' },
];

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { theme, palette } = useTheme();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const grad = [palette.chipLavender, palette.chipRose, palette.chipPeach] as const;

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };
  const next = () => (index < SLIDES.length - 1 ? goTo(index + 1) : onDone());

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.canvas }} edges={['top', 'bottom']}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onEnd}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <View
            key={i}
            style={{ width, paddingHorizontal: theme.space['16'], paddingTop: theme.space['16'], gap: theme.space['24'] }}
          >
            <LinearGradient
              colors={grad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ height: '64%', borderRadius: theme.radius.xl, alignItems: 'center', justifyContent: 'center' }}
            >
              <BrandMark size={120} />
            </LinearGradient>
            <Text style={{ color: palette.ink, fontSize: 30, lineHeight: 36, letterSpacing: -0.4 }}>{s.title}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: theme.space['16'], paddingBottom: theme.space['16'], gap: theme.space['24'] }}>
        <PageDots count={SLIDES.length} index={index} onPick={goTo} />
        <Button label={index === SLIDES.length - 1 ? 'Get started' : 'Next'} tone="soft" full onPress={next} />
      </View>
    </SafeAreaView>
  );
}
