import { goalColors } from '@/lib/constants/colors';
import type { GoalTag } from '@/types/compound';

export interface GoalDefinition {
  id: GoalTag;
  title: string;
  shortTitle: string;
  icon: string;
  accent: string;
  description: string;
}

export const goals: GoalDefinition[] = [
  {
    id: 'recovery',
    title: 'Recovery',
    shortTitle: 'Recovery',
    icon: 'pulse',
    accent: goalColors.recovery,
    description: 'Repair faster',
  },
  {
    id: 'energy',
    title: 'Energy',
    shortTitle: 'Energy',
    icon: 'flash',
    accent: goalColors.energy,
    description: 'Sustained drive',
  },
  {
    id: 'sharpness',
    title: 'Focus',
    shortTitle: 'Focus',
    icon: 'compass',
    accent: goalColors.sharpness,
    description: 'Clearer attention',
  },
  {
    id: 'vitality',
    title: 'Vitality',
    shortTitle: 'Vitality',
    icon: 'leaf',
    accent: goalColors.vitality,
    description: 'Cellular renewal',
  },
  {
    id: 'aesthetic',
    title: 'Aesthetic',
    shortTitle: 'Aesthetic',
    icon: 'sparkles',
    accent: goalColors.aesthetic,
    description: 'Visible glow-up',
  },
  {
    id: 'sleep',
    title: 'Sleep',
    shortTitle: 'Sleep',
    icon: 'moon',
    accent: goalColors.sleep,
    description: 'Deep recovery',
  },
];

export const goalById = goals.reduce<Record<GoalTag, GoalDefinition>>((lookup, goal) => {
  lookup[goal.id] = goal;
  return lookup;
}, {} as Record<GoalTag, GoalDefinition>);
