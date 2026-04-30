import { Alert, Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/lib/constants/colors';
import { type as t } from '@/lib/constants/typography';
import { useTracker } from '@/lib/hooks/useTracker';

function csvEscape(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

export function ExportPanel() {
  const { checkIns, doseLogs, schedules, vialRecipes } = useTracker();

  async function shareJson() {
    const payload = JSON.stringify(
      {
        checkIns,
        doseLogs,
        exportedAt: new Date().toISOString(),
        product: 'GlowPep',
        schedules,
        vialRecipes,
        version: 1,
      },
      null,
      2,
    );

    try {
      await Share.share({ message: payload, title: 'GlowPep Backup' });
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet.');
    }
  }

  async function shareCsv() {
    const header = ['compoundId', 'scheduledAt', 'takenAt', 'amount', 'unit', 'status', 'injectionSite', 'notes'];
    const rows = doseLogs.map((log) =>
      [log.compoundId, log.scheduledAt, log.takenAt ?? '', log.amount, log.unit, log.status, log.injectionSite ?? '', log.notes ?? '']
        .map(csvEscape)
        .join(','),
    );
    const csv = [header.join(','), ...rows].join('\n');

    try {
      await Share.share({ message: csv, title: 'GlowPep Dose Log CSV' });
    } catch {
      Alert.alert('Export failed', 'Could not open the share sheet.');
    }
  }

  return (
    <View style={styles.panel}>
      <Text style={styles.kicker}>DATA OWNERSHIP</Text>
      <Text style={styles.title}>Take your data with you.</Text>
      <Text style={styles.copy}>Export dose logs as CSV, or export everything as JSON for a local-first backup story.</Text>
      <View style={styles.row}>
        <Pressable onPress={shareCsv} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryText}>Share CSV</Text>
        </Pressable>
        <Pressable onPress={shareJson} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
          <Text style={styles.primaryText}>Backup JSON</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16, padding: 18 },
  kicker: { ...t.eyebrow, color: colors.accent, marginBottom: 8 },
  title: { ...t.displaySmall, color: colors.text, fontSize: 23, lineHeight: 27, marginBottom: 6 },
  copy: { ...t.bodySmall, color: colors.textMuted, marginBottom: 16 },
  row: { flexDirection: 'row', gap: 10 },
  primaryButton: { backgroundColor: colors.accent, borderRadius: 13, flex: 1, paddingVertical: 14 },
  primaryText: { ...t.label, color: colors.accentInk, textAlign: 'center' },
  secondaryButton: { backgroundColor: colors.backgroundAlt, borderColor: colors.borderStrong, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, flex: 1, paddingVertical: 14 },
  secondaryText: { ...t.label, color: colors.textMuted, textAlign: 'center' },
  pressed: { opacity: 0.82 },
});
