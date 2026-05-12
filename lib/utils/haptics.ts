import * as Haptics from 'expo-haptics';

export function hapticLight() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
}

export function hapticSelection() {
  void Haptics.selectionAsync().catch(() => undefined);
}

export function hapticSuccess() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
}
