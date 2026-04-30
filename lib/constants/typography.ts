import { Platform, type TextStyle } from 'react-native';

// Font families loaded via @expo-google-fonts in the root layout.
// Body: Atkinson Hyperlegible — accessible, premium, polished.
// Display: Source Serif 4 — warm editorial serif.
// Data: IBM Plex Mono — eyebrows, dates, metric readouts.
export const fonts = {
  serif: Platform.select({
    default: 'SourceSerif4_400Regular',
    web: 'Source Serif 4, Georgia, serif',
  }) as string,
  serifLight: Platform.select({
    default: 'SourceSerif4_300Light',
    web: 'Source Serif 4, Georgia, serif',
  }) as string,
  sans: Platform.select({
    default: 'AtkinsonHyperlegible_400Regular',
    web: 'Atkinson Hyperlegible, system-ui, sans-serif',
  }) as string,
  sansMedium: Platform.select({
    default: 'AtkinsonHyperlegible_700Bold',
    web: 'Atkinson Hyperlegible, system-ui, sans-serif',
  }) as string,
  sansSemi: Platform.select({
    default: 'AtkinsonHyperlegible_700Bold',
    web: 'Atkinson Hyperlegible, system-ui, sans-serif',
  }) as string,
  mono: Platform.select({
    default: 'IBMPlexMono_400Regular',
    web: 'IBM Plex Mono, ui-monospace, monospace',
  }) as string,
  monoMedium: Platform.select({
    default: 'IBMPlexMono_500Medium',
    web: 'IBM Plex Mono, ui-monospace, monospace',
  }) as string,
};

export const type = {
  heroNum: {
    fontFamily: fonts.serifLight,
    fontSize: 120,
    lineHeight: 110,
    letterSpacing: -5,
  } satisfies TextStyle,
  displayLg: {
    fontFamily: fonts.serifLight,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.2,
  } satisfies TextStyle,
  display: {
    fontFamily: fonts.serifLight,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.8,
  } satisfies TextStyle,
  displaySmall: {
    fontFamily: fonts.serifLight,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  } satisfies TextStyle,
  eyebrow: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  } satisfies TextStyle,
  sectionNum: {
    fontFamily: fonts.mono,
    fontSize: 11,
    letterSpacing: 1.1,
  } satisfies TextStyle,
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 24,
  } satisfies TextStyle,
  bodySmall: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 20,
  } satisfies TextStyle,
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
  } satisfies TextStyle,
  data: {
    fontFamily: fonts.mono,
    fontSize: 13,
    letterSpacing: 0.4,
  } satisfies TextStyle,
  dataSmall: {
    fontFamily: fonts.mono,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  } satisfies TextStyle,
};
