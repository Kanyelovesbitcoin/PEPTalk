import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { colors } from '@/lib/constants/colors';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { compoundById } from '@/lib/data/compounds';
import { fonts, type as t } from '@/lib/constants/typography';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { storage } from '@/lib/utils/storage';

export default function FavoritesScreen() {
  const { savedStacks } = useQuiz();
  const [note, setNote] = useState('');
  const [noteReady, setNoteReady] = useState(false);

  useEffect(() => {
    storage.getItem(STORAGE_KEYS.logbookNote).then((stored) => {
      setNote(stored ?? '');
      setNoteReady(true);
    });
  }, []);

  useEffect(() => {
    if (!noteReady) return;
    storage.setItem(STORAGE_KEYS.logbookNote, note);
  }, [note, noteReady]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={savedStacks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <>
            <EmptyState
              copy="Take the Glowmax guide and save items to see it here."
              cta={{ label: 'Take the guide', onPress: () => router.push('/quiz') }}
              icon="bookmark-outline"
              kicker="Nothing saved"
              title="Your archive is empty."
            />
            <View style={styles.notesCard}>
              <Text style={styles.notesKicker}>Notes</Text>
              <TextInput
                multiline
                onChangeText={setNote}
                placeholder="Add context, observations, or questions for your next review."
                placeholderTextColor={colors.textFaint}
                style={styles.notesInput}
                textAlignVertical="top"
                value={note}
              />
            </View>
          </>
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Logbook</Text>
            <Text style={styles.sub}>
              Open any past Glowmax result to revisit the educational logic and related references.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const primary = compoundById[item.compounds[0]?.compoundId];
          const date = new Date(item.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
          });

          return (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/quiz/results',
                  params: { stackId: item.id },
                })
              }
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardDate}>{date.toUpperCase()}</Text>
                <Text style={styles.arrow}>→</Text>
              </View>
              <Text style={styles.cardTitle}>
                {primary ? `${primary.name} Saved` : 'Saved'}
              </Text>
              <View style={styles.divider} />
              <Text style={styles.cardCopy}>
                {item.compounds
                  .map((match) => compoundById[match.compoundId]?.name)
                  .filter(Boolean)
                  .join('  ·  ')}
              </Text>
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    flex: 1,
  },
  content: {
    paddingBottom: 150,
    paddingHorizontal: 14,
    paddingTop: 18,
  },
  header: {
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  title: {
    fontFamily: fonts.sansMedium,
    color: colors.text,
    fontSize: 32,
    letterSpacing: -0.75,
    lineHeight: 38,
  },
  sub: {
    ...t.bodySmall,
    color: colors.textDim,
    marginTop: 8,
  },

  card: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 12,
    padding: 20,
  },
  pressed: {
    opacity: 0.9,
  },
  cardHead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardDate: {
    ...t.eyebrow,
    color: colors.accent,
  },
  arrow: {
    color: colors.textDim,
    fontSize: 14,
  },
  cardTitle: {
    fontFamily: fonts.sansMedium,
    color: colors.text,
    fontSize: 22,
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  divider: {
    backgroundColor: colors.border,
    borderRadius: 12,
    height: 1,
    marginVertical: 12,
  },
  cardCopy: {
    ...t.dataSmall,
    color: colors.textMuted,
    fontSize: 12,
  },
  notesCard: {
    backgroundColor: colors.surfaceGlass,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
    padding: 20,
  },
  notesKicker: {
    ...t.eyebrow,
    color: colors.accent,
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: colors.backgroundAlt,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    color: colors.text,
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 120,
    padding: 14,
  },

  empty: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 18,
    padding: 22,
  },
  emptyKicker: {
    ...t.eyebrow,
    color: colors.textDim,
    marginBottom: 10,
  },
  emptyTitle: {
    ...t.displaySmall,
    color: colors.text,
    fontSize: 22,
    lineHeight: 26,
    marginBottom: 6,
  },
  emptyCopy: {
    ...t.bodySmall,
    color: colors.textMuted,
  },
});
