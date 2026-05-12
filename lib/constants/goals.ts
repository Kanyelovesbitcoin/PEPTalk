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
    description: 'Recovery research',
  },
  {
    id: 'energy',
    title: 'Energy',
    shortTitle: 'Energy',
    icon: 'flash',
    accent: goalColors.energy,
    description: 'Energy context',
  },
  {
    id: 'sharpness',
    title: 'Focus',
    shortTitle: 'Focus',
    icon: 'compass',
    accent: goalColors.sharpness,
    description: 'Focus research',
  },
  {
    id: 'vitality',
    title: 'Vitality',
    shortTitle: 'Vitality',
    icon: 'leaf',
    accent: goalColors.vitality,
    description: 'Vitality context',
  },
  {
    id: 'aesthetic',
    title: 'Aesthetic',
    shortTitle: 'Aesthetic',
    icon: 'sparkles',
    accent: goalColors.aesthetic,
    description: 'Cosmetic context',
  },
  {
    id: 'sleep',
    title: 'Sleep',
    shortTitle: 'Sleep',
    icon: 'moon',
    accent: goalColors.sleep,
    description: 'Sleep context',
  },
];

export const goalById = goals.reduce<Record<GoalTag, GoalDefinition>>((lookup, goal) => {
  lookup[goal.id] = goal;
  return lookup;
}, {} as Record<GoalTag, GoalDefinition>);
