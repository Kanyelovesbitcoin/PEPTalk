import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import { fetchCompoundExplanation, type CompoundExplanation } from '@/lib/utils/aiInsights';
import type { Compound } from '@/types/compound';
import type { CompoundInsight, QuizAnswers, StackMatch } from '@/types/quiz';

interface StackResultCardProps {
  compound: Compound;
  match: StackMatch;
  insight?: CompoundInsight;
  insightsLoading?: boolean;
  quizAnswers?: QuizAnswers;
  allMatches?: StackMatch[];
  onPress: () => void;
}

const tierLabel: Record<StackMatch['tier'], string> = {
  primary: '§ 01 — PRIMARY',
  secondary: '§ 02 — SECONDARY',
  supporting: '§ 03 — SUPPORTING',
};

export function StackResultCard({
  compound,
  match,
  insight,
  insightsLoading,
  quizAnswers,
  allMatches,
  onPress,
}: StackResultCardProps) {
  const [explanation, setExplanation] = useState<CompoundExplanation | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [showExplain, setShowExplain] = useState(false);

  async function handleExplain() {
    if (explanation) {
      setShowExplain(!showExplain);
      return;
    }
    if (!quizAnswers || !allMatches) return;

    setExplainLoading(true);
    setShowExplain(true);
    try {
      const result = await fetchCompoundExplanation(quizAnswers, compound.id, allMatches);
      setExplanation(result);
    } catch {
      setExplanation(null);
      setShowExplain(false);
    } finally {
      setExplainLoading(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.tier}>{tierLabel[match.tier]}</Text>
        <Text style={styles.classLabel}>{compound.type.toUpperCase()}</Text>
      </View>

      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <Text style={styles.name}>{compound.name}</Text>
        {compound.nickname ? <Text style={styles.alt}>{compound.nickname}</Text> : null}
        <Text style={styles.summary}>{compound.summary}</Text>
        <Text style={styles.reasoning}>{match.reasoning}</Text>
      </Pressable>

      {insightsLoading && !insight ? (
        <View style={styles.divided}>
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} size="small" />
            <Text style={styles.loadingText}>Generating personalized insights…</Text>
          </View>
        </View>
      ) : null}

      {insight ? (
        <View style={styles.divided}>
          <Text style={styles.kicker}>AI INSIGHT</Text>
          <Text style={styles.insightBody}>{insight.personalReasoning}</Text>
          {insight.benefits.map((benefit) => (
            <View key={benefit} style={styles.bulletRow}>
              <Text style={styles.bulletGlyph}>—</Text>
              <Text style={styles.bulletText}>{benefit}</Text>
            </View>
          ))}
          {insight.synergyNote ? (
            <Text style={styles.synergy}>{insight.synergyNote}</Text>
          ) : null}
        </View>
      ) : null}

      {quizAnswers && allMatches ? (
        <View style={styles.divided}>
          <Pressable
            disabled={explainLoading}
            onPress={handleExplain}
            style={({ pressed }) => [styles.explainBtn, pressed && styles.pressed]}>
            {explainLoading ? (
              <ActivityIndicator color={colors.accent} size="small" />
            ) : (
              <Ionicons
                color={colors.accent}
                name={showExplain ? 'chevron-up' : 'add'}
                size={14}
              />
            )}
            <Text style={styles.explainText}>
              {showExplain && explanation ? 'Hide deep dive' : 'Explain this compound'}
            </Text>
          </Pressable>

          {showExplain && explanation ? (
            <View style={styles.explainContent}>
              <Text style={styles.explainBody}>{explanation.explanation}</Text>

              <Text style={styles.kicker}>PRACTICAL TIPS</Text>
              {explanation.practicalTips.map((tip) => (
                <View key={tip} style={styles.bulletRow}>
                  <Text style={styles.bulletGlyph}>+</Text>
                  <Text style={styles.bulletText}>{tip}</Text>
                </View>
              ))}

              <Text style={[styles.kicker, styles.kickerWarn]}>WATCH OUT FOR</Text>
              {explanation.watchOutFor.map((item) => (
                <View key={item} style={styles.bulletRow}>
                  <Text style={[styles.bulletGlyph, styles.bulletGlyphWarn]}>!</Text>
                  <Text style={styles.bulletText}>{item}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1D1D1D',
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    padding: 22,
  },
  pressed: {
    opacity: 0.85,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tier: {
    ...t.eyebrow,
    color: colors.accent,
  },
  classLabel: {
    ...t.eyebrow,
    color: colors.textDim,
  },
  name: {
    fontFamily: fonts.sansMedium,
    color: colors.text,
    fontSize: 26,
    letterSpacing: -0.55,
    lineHeight: 32,
  },
  alt: {
    ...t.bodySmall,
    color: colors.textDim,
    marginTop: 2,
  },
  summary: {
    ...t.body,
    color: colors.textMuted,
    marginTop: 14,
  },
  reasoning: {
    ...t.bodySmall,
    color: colors.textDim,
    marginTop: 10,
  },

  divided: {
    backgroundColor: '#000000',
    borderRadius: 14,
    marginTop: 16,
    padding: 14,
  },

  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  loadingText: {
    ...t.bodySmall,
    color: colors.textDim,
  },

  kicker: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 10,
  },
  kickerWarn: {
    color: colors.amber,
    marginTop: 14,
  },
  insightBody: {
    ...t.body,
    color: colors.text,
    marginBottom: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 4,
  },
  bulletGlyph: {
    ...t.data,
    color: colors.accent,
    width: 12,
  },
  bulletGlyphWarn: {
    color: colors.amber,
  },
  bulletText: {
    ...t.bodySmall,
    color: colors.textMuted,
    flex: 1,
  },
  synergy: {
    ...t.bodySmall,
    color: colors.textDim,
    fontStyle: 'italic',
    marginTop: 10,
  },

  explainBtn: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  explainText: {
    ...t.label,
    color: colors.accent,
    fontSize: 13,
  },
  explainContent: {
    backgroundColor: colors.backgroundAlt,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
    padding: 16,
  },
  explainBody: {
    ...t.bodySmall,
    color: colors.textMuted,
    marginBottom: 14,
  },
});
