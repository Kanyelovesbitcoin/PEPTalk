import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { frustrationById } from '@/lib/constants/frustrations';
import { goalById } from '@/lib/constants/goals';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';

import type { OnboardingAnswerField, OnboardingAnswers, SlideConfig } from './types';

type RevealSlideConfig = Extract<SlideConfig, { kind: 'reveal' }>;

const experienceLabels: Record<string, string> = {
  new: 'first-time',
  regular: 'regular-tracker',
  some: 'experimented',
};

const horizonLabels: Record<string, string> = {
  '4w': '4-week review',
  '8w': '8-week review',
  '12w': '12-week review',
  long: 'long-horizon review',
};

interface RevealSlideProps {
  answers: OnboardingAnswers;
  slide: RevealSlideConfig;
}

function formatStack(values: string[] | undefined) {
  const explicitValues = Array.from(new Set(values?.filter((id) => id !== 'nothing-yet' && compoundById[id]) ?? []));
  if (!explicitValues.length) {
    return 'No stack selected yet';
  }

  const labels = explicitValues.map((id) => compoundById[id]?.name ?? id);
  const visible = labels.slice(0, 3).join(', ');
  const remainder = labels.length - 3;
  return remainder > 0 ? `${visible} +${remainder} more` : visible;
}

function formatAnswerValue(field: OnboardingAnswerField, answers: OnboardingAnswers) {
  switch (field) {
    case 'age':
      return typeof answers.age === 'number' ? String(answers.age) : 'Not shared';
    case 'consistency':
      return typeof answers.consistency === 'number' ? `${answers.consistency}/10` : 'Not set';
    case 'currentStack':
      return formatStack(answers.currentStack);
    case 'experience':
      return answers.experience ? experienceLabels[answers.experience] ?? answers.experience : 'general';
    case 'frustration':
      return answers.frustration ? frustrationById[answers.frustration]?.label ?? answers.frustration : 'Not selected';
    case 'horizon':
      return answers.horizon ? horizonLabels[answers.horizon] ?? answers.horizon : 'open-ended review';
    case 'name':
      return answers.name?.trim() || 'Private file';
    case 'notifications':
      return answers.notifications === true ? 'Reminders allowed' : answers.notifications === false ? 'Not now' : 'Not set';
    case 'primaryGoal':
      return answers.primaryGoal ? goalById[answers.primaryGoal]?.title ?? answers.primaryGoal : 'research';
    case 'satisfaction':
      return typeof answers.satisfaction === 'number' ? `${answers.satisfaction}/10` : 'Not set';
    default:
      return 'Not set';
  }
}

function formatTemplate(template: string, answers: OnboardingAnswers) {
  const tokens: Record<string, string> = {
    age: formatAnswerValue('age', answers),
    consistency: formatAnswerValue('consistency', answers),
    currentStack: formatAnswerValue('currentStack', answers),
    experience: formatAnswerValue('experience', answers),
    frustration: formatAnswerValue('frustration', answers),
    goal: formatAnswerValue('primaryGoal', answers),
    horizon: formatAnswerValue('horizon', answers),
    name: formatAnswerValue('name', answers),
    notifications: formatAnswerValue('notifications', answers),
    primaryGoal: formatAnswerValue('primaryGoal', answers),
    satisfaction: formatAnswerValue('satisfaction', answers),
  };

  return template.replace(/\{(\w+)\}/g, (_, key: string) => tokens[key] ?? '');
}

export function RevealSlide({ answers, slide }: RevealSlideProps) {
  const title = formatTemplate(slide.titleTemplate, answers);

  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.panel}>
        {slide.summaryRows.map((row) => {
          const value = row.valueTemplate
            ? formatTemplate(row.valueTemplate, answers)
            : row.value
              ? row.value
              : row.field
                ? formatAnswerValue(row.field, answers)
                : row.fallback ?? 'Not set';

          return (
            <View key={row.label} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{value || row.fallback || 'Not set'}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
  },
  panel: {
    backgroundColor: colors.surfaceGlass,
    borderColor: colors.borderStrong,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 28,
    overflow: 'hidden',
  },
  row: {
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  rowLabel: {
    ...t.dataSmall,
    color: colors.textDim,
  },
  rowValue: {
    color: colors.text,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    ...t.displayLg,
    color: colors.text,
    letterSpacing: 0,
    lineHeight: 42,
    maxWidth: 390,
  },
  wrap: {
    paddingBottom: 20,
  },
});
