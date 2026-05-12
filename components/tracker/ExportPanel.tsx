import { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { LockedSection } from '@/components/LockedSection';
import { colors } from '@/lib/constants/colors';
import { STORAGE_KEYS } from '@/lib/constants/storage';
import { type as t } from '@/lib/constants/typography';
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess';
import { usePro } from '@/lib/hooks/usePro';
import { useQuiz } from '@/lib/hooks/useQuiz';
import { useTracker } from '@/lib/hooks/useTracker';
import { buildCheckInCsv, buildDoseLogCsv, buildGlowPepRecordExport } from '@/lib/utils/exportRecord';
import { showPaywallWithAlert } from '@/lib/utils/paywallAlerts';
import { storage } from '@/lib/utils/storage';

export function ExportPanel() {
  const access = useFeatureAccess('dataExport');
  const { showPaywall } = usePro();
  const { quizAnswers, savedStacks } = useQuiz();
  const { checkIns, doseLogs, schedules, vialRecipes } = useTracker();
  const [profileName, setProfileName] = useState('');

  useEffect(() => {
    let active = true;
    storage.getItem(STORAGE_KEYS.profileName).then((name) => {
      if (!active) return;
      setProfileName(name ?? '');
    });
    return () => {
      active = false;
    };
  }, []);

  async function shareJson() {
    const payload = JSON.stringify(
      buildGlowPepRecordExport({
        checkIns,
        doseLogs,
        profileName,
        quizAnswers,
        savedStacks,
        schedules,
        vialRecipes,
      }),
      null,
      2,
    );

    try {
      await Share.share({ message: payload, title: 'GlowPep Backup' });
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet. Your local data was not changed.');
    }
  }

  async function shareDoseCsv() {
    try {
      await Share.share({ message: buildDoseLogCsv(doseLogs), title: 'GlowPep Amount Log CSV' });
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet. Your local data was not changed.');
    }
  }

  async function shareCheckInCsv() {
    try {
      await Share.share({ message: buildCheckInCsv(checkIns), title: 'GlowPep Check-In CSV' });
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet. Your local data was not changed.');
    }
  }

  if (!access.allowed) {
    return (
      <View style={styles.panel}>
        <Text style={styles.kicker}>YOUR RECORD</Text>
        <Text style={styles.title}>Your data stays yours.</Text>
        <Text style={styles.copy}>
          Free keeps tracking private on this device. Pro adds full export of saved items, amount logs,
          check-ins, schedules, recipes, and saved AI context.
        </Text>
        <LockedSection
          copy={access.description}
          onPress={() => { void showPaywallWithAlert(showPaywall); }}
          title="Export is part of GlowPep Pro"
          variant="compact"
        />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>YOUR RECORD</Text>
      <Text style={styles.title}>Take your data with you.</Text>
      <Text style={styles.copy}>
        Export the full GlowPep record as JSON, or pull focused CSVs for amount logs and daily check-ins.
        Schema v2 is peptide-only: schedules, logs, check-ins, recipes, saved items, and guide context.
      </Text>
      <View style={styles.statRow}>
        <RecordStat label="Lists" value={savedStacks.length} />
        <RecordStat label="Trackers" value={schedules.length} />
        <RecordStat label="Logs" value={doseLogs.length + checkIns.length} />
      </View>
      <View style={styles.buttonStack}>
        <Pressable accessibilityLabel="Export full JSON" accessibilityRole="button" onPress={shareJson} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Export full JSON</Text>
        </Pressable>
        <View style={styles.row}>
          <Pressable accessibilityLabel="Export amount CSV" accessibilityRole="button" onPress={shareDoseCsv} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Amount CSV</Text>
          </Pressable>
          <Pressable accessibilityLabel="Export check-in CSV" accessibilityRole="button" onPress={shareCheckInCsv} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryText}>Check-in CSV</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function RecordStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCell}>
      <Text style={styles.statValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16, padding: 18 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 8 },
  title: { ...t.displaySmall, color: colors.text, fontSize: 23, lineHeight: 27, marginBottom: 6 },
  copy: { ...t.bodySmall, color: colors.textMuted, marginBottom: 16 },
  buttonStack: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  primaryButton: { backgroundColor: colors.accent, borderRadius: 13, minHeight: 44, paddingVertical: 14 },
  primaryText: { ...t.label, color: colors.accentInk, textAlign: 'center' },
  secondaryButton: { backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, flex: 1, minHeight: 44, paddingVertical: 14 },
  secondaryText: { ...t.label, color: colors.textMuted, textAlign: 'center' },
  statRow: { borderColor: colors.border, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', marginBottom: 14, overflow: 'hidden' },
  statCell: { flex: 1, paddingHorizontal: 12, paddingVertical: 12 },
  statValue: { ...t.data, color: colors.accent, marginBottom: 3 },
  statLabel: { ...t.dataSmall, color: colors.textDim },
  pressed: { opacity: 0.82 },
});
