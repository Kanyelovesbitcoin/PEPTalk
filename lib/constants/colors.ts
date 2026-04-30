import type { GoalTag } from '@/types/compound';

export const colors = {
  background: '#0B0A08',
  backgroundAlt: '#131210',
  surface: '#1A1611',
  surfaceAlt: '#241E16',
  surfaceGlass: 'rgba(36, 30, 22, 0.72)',
  card: '#131210',

  text: '#EFE7D2',
  textMuted: 'rgba(239, 231, 210, 0.55)',
  textDim: 'rgba(239, 231, 210, 0.30)',
  textFaint: 'rgba(239, 231, 210, 0.12)',

  border: 'rgba(239, 231, 210, 0.10)',
  borderStrong: 'rgba(239, 231, 210, 0.22)',

  accent: '#D4A84B',
  accentSoft: '#E8C97A',
  accentDeep: '#8B6F2D',
  accentDim: '#8B6F2D',
  accentInk: '#0B0A08',

  jade: '#A8C99A',
  jadeDeep: '#6B9460',
  jadeGlow: 'rgba(168, 201, 154, 0.25)',

  amber: '#D4A84B',
  rose: '#E0623F',
  success: '#A8C99A',
  warning: '#D4A84B',
  danger: '#E0623F',
  crimson: '#E0623F',

  peptide: '#D4A84B',
  shadow: 'rgba(0, 0, 0, 0.65)',
  glow: 'rgba(212, 168, 75, 0.22)',
};

// Longevity / looksmaxing goal palette — gold + jade family with subtle hue shifts.
export const goalColors: Record<GoalTag, string> = {
  recovery: '#A8C99A',
  energy: '#D4A84B',
  sharpness: '#E8C97A',
  vitality: '#A8C99A',
  aesthetic: '#D4A84B',
  sleep: '#8AA886',
};
