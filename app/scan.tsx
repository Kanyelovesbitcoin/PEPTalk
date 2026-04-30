import Ionicons from '@expo/vector-icons/Ionicons';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/constants/colors';
import { fonts, type as t } from '@/lib/constants/typography';
import { compoundById } from '@/lib/data/compounds';
import { getLatestSkinScan, saveSkinScan } from '@/lib/storage/skinScans';
import { analyzeFaceImages, looksROIFromScores, type SkinAnalysisResult } from '@/lib/utils/skinAnalysis';

type AngleKey = 'front' | 'left' | 'right';

type CapturedPhoto = {
  uri: string;
  base64: string;
};

const ANGLES: Array<{ key: AngleKey; label: string; shortLabel: string; instruction: string; guide: string }> = [
  {
    key: 'front',
    label: 'Front face',
    shortLabel: 'FRONT',
    instruction: 'Look straight into the camera. Keep your jaw relaxed and lighting even.',
    guide: 'CENTER FACE',
  },
  {
    key: 'left',
    label: 'Left profile',
    shortLabel: 'LEFT',
    instruction: 'Turn your face to the left. Keep your cheek, jaw, and under-eye visible.',
    guide: 'LEFT PROFILE',
  },
  {
    key: 'right',
    label: 'Right profile',
    shortLabel: 'RIGHT',
    instruction: 'Turn your face to the right. Match the same distance and lighting.',
    guide: 'RIGHT PROFILE',
  },
];

const LEGAL_RECOMMENDATION_IDS = ['ghk-cu', 'matrixyl', 'argireline'];

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestUri, setLatestUri] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [photos, setPhotos] = useState<Partial<Record<AngleKey, CapturedPhoto>>>({});
  const [result, setResult] = useState<SkinAnalysisResult | null>(null);
  const [selectedAngle, setSelectedAngle] = useState<AngleKey>('front');
  const cameraRef = useRef<CameraView>(null);
  const scanline = useRef(new Animated.Value(0)).current;

  const currentAngle = ANGLES[stepIndex];
  const allCaptured = ANGLES.every((angle) => photos[angle.key]);
  const glowScore = result ? looksROIFromScores(result) : null;
  const recommendations = result?.recommendedCompoundIds
    .map((id) => compoundById[id])
    .filter((compound) => compound && LEGAL_RECOMMENDATION_IDS.includes(compound.id)) ?? [];

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  function openSettings() {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  useEffect(() => {
    getLatestSkinScan().then((scan) => {
      const uri = scan?.frontUri ?? scan?.photoUri;
      if (uri) setLatestUri(uri);
    });
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(scanline, {
        toValue: 1,
        duration: 3400,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    ).start();
  }, [scanline]);

  const meta = useMemo(() => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    return `3-ANGLE SCAN · ${month}.${day}.${year}`;
  }, []);

  function savePhoto(angle: AngleKey, photo: CapturedPhoto) {
    setPhotos((current) => ({ ...current, [angle]: photo }));
    setLatestUri(photo.uri);
    const nextMissingIndex = ANGLES.findIndex((item) => item.key !== angle && !photos[item.key]);
    if (nextMissingIndex >= 0) {
      setStepIndex(nextMissingIndex);
    }
  }

  async function capture() {
    if (isCapturing || allCaptured || result) return;

    // If permission isn't granted yet, ask first instead of failing silently.
    if (!permission?.granted) {
      const next = await requestPermission();
      if (!next.granted) {
        Alert.alert(
          'Camera access needed',
          'GlowPep needs your camera to take three-angle face scans. Enable access in Settings to continue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ],
        );
      }
      return;
    }

    if (!cameraRef.current) {
      Alert.alert('Camera not ready', 'Give the camera a moment to warm up, then try again.');
      return;
    }

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.82 });
      if (photo?.uri && photo.base64) {
        savePhoto(currentAngle.key, { uri: photo.uri, base64: photo.base64 });
      } else {
        Alert.alert('Capture failed', 'No photo came back from the camera. Try again.');
      }
    } catch (err) {
      console.warn('[scan] capture failed', err);
      Alert.alert('Capture failed', 'Something went wrong taking the photo. Try again.');
    } finally {
      setIsCapturing(false);
    }
  }

  async function pickFromLibrary() {
    if (allCaptured || result) return;
    try {
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!lib.granted) {
        Alert.alert(
          'Photo access needed',
          'GlowPep needs photo access to import existing pictures. Enable access in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: openSettings },
          ],
        );
        return;
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        base64: true,
        quality: 0.82,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });
      if (!picked.canceled && picked.assets[0]?.uri && picked.assets[0].base64) {
        savePhoto(currentAngle.key, { uri: picked.assets[0].uri, base64: picked.assets[0].base64 });
      }
    } catch (err) {
      console.warn('[scan] picker failed', err);
      Alert.alert('Picker failed', 'Could not open the photo library. Try again.');
    }
  }

  function retake(angle: AngleKey) {
    setResult(null);
    setPhotos((current) => {
      const next = { ...current };
      delete next[angle];
      return next;
    });
    setStepIndex(ANGLES.findIndex((item) => item.key === angle));
  }

  async function analyze() {
    const front = photos.front;
    const left = photos.left;
    const right = photos.right;
    if (!front || !left || !right || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeFaceImages({ front: front.base64, left: left.base64, right: right.base64, mimeType: 'image/jpeg' });
      setResult(analysis);
      await saveSkinScan({
        angleInsights: analysis.angleInsights,
        analysisSource: analysis.source,
        collagen: analysis.collagen,
        feedbackSummary: analysis.feedbackSummary,
        frontUri: front.uri,
        improvements: analysis.improvements,
        leftUri: left.uri,
        luminosity: analysis.luminosity,
        photoUri: front.uri,
        recommendedCompoundIds: analysis.recommendedCompoundIds,
        rightUri: right.uri,
        texture: analysis.texture,
      });
    } finally {
      setIsAnalyzing(false);
    }
  }

  function resetScan() {
    setPhotos({});
    setResult(null);
    setStepIndex(0);
  }

  const scanY = scanline.interpolate({ inputRange: [0, 1], outputRange: [-180, 180] });

  if (result) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.resultSafe}>
        <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.topBarSolid}>
            <Pressable onPress={() => router.back()} style={styles.iconBtnSolid}>
              <Ionicons color={colors.text} name="close" size={18} />
            </Pressable>
            <Text style={styles.eyebrow}><Text style={styles.eyebrowDot}>● </Text>FACE FEEDBACK</Text>
            <Pressable onPress={resetScan} style={styles.iconBtnSolid}>
              <Ionicons color={colors.text} name="refresh" size={18} />
            </Pressable>
          </View>

          {result.source === 'fallback' && (
            <View style={styles.offlineBanner}>
              <Ionicons name="cloud-offline-outline" size={16} color={colors.textDim} />
              <Text style={styles.offlineBannerText}>Preview Mode: Offline Estimate</Text>
            </View>
          )}

          <View style={styles.scoreCard}>
            <Text style={styles.resultKicker}>{result.source === 'ai' ? 'AI THREE-ANGLE READ' : 'OFFLINE ESTIMATE'}</Text>
            <View style={styles.scoreHead}>
              <View>
                <Text style={styles.resultTitle}>Honest baseline</Text>
                <Text style={styles.resultCopy}>{result.feedbackSummary}</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreValue}>{glowScore}</Text>
                <Text style={styles.scoreLabel}>GLOW SCORE</Text>
              </View>
            </View>
            <Metric label="Youthful Bounce" value={result.collagen} />
            <Metric label="Smooth Canvas" value={result.texture} />
            <Metric label="Glow Factor" value={result.luminosity} />
          </View>

          <View style={styles.photoStrip}>
            {ANGLES.map((angle) => {
              const photo = photos[angle.key];
              const isSelected = selectedAngle === angle.key;
              return photo ? (
                <Pressable
                  key={angle.key}
                  onPress={() => setSelectedAngle(angle.key)}
                  style={[styles.reviewThumbWrap, isSelected && styles.reviewThumbWrapSelected]}>
                  <Image source={{ uri: photo.uri }} style={[styles.reviewThumb, result.source === 'fallback' && styles.offlineImage]} />
                </Pressable>
              ) : null;
            })}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Perspective Insight</Text>
            {(() => {
              const angle = ANGLES.find((a) => a.key === selectedAngle)!;
              const photo = photos[angle.key];
              return (
                <View style={styles.angleInsightRow}>
                  {photo ? <Image source={{ uri: photo.uri }} style={[styles.angleInsightThumb, result.source === 'fallback' && styles.offlineImage]} /> : null}
                  <View style={styles.angleInsightCopy}>
                    <Text style={styles.angleInsightLabel}>{angle.label}</Text>
                    <Text style={styles.angleInsightText}>{result.angleInsights[angle.key]}</Text>
                  </View>
                </View>
              );
            })()}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>What to improve</Text>
            {result.improvements.map((item, index) => (
              <View key={`${item}-${index}`} style={styles.feedbackRow}>
                <Text style={styles.feedbackNum}>{String(index + 1).padStart(2, '0')}</Text>
                <Text style={styles.feedbackText}>{item}</Text>
              </View>
            ))}
          </View>

          {recommendations.length > 0 ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Legal peptide links</Text>
              {recommendations.map((compound) => (
                <Pressable key={compound.id} onPress={() => router.push(`/compound/${compound.id}`)} style={styles.recoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recoName}>{compound.name}</Text>
                    <Text style={styles.recoCopy}>{compound.summary}</Text>
                  </View>
                  <Ionicons color={colors.accent} name="arrow-forward" size={16} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.resultFoot}>Cosmetic education only. Not diagnosis, treatment, or medical advice. Photos stay on device as local URIs; scan metadata syncs through your private iCloud storage on iOS.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        {permission?.granted ? (
          <CameraView ref={cameraRef} facing={facing} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.fallback]} />
        )}
        <View style={styles.vignette} />
      </View>

      {permission && !permission.granted ? (
        <View style={styles.permGate} pointerEvents="box-none">
          <View style={styles.permCard}>
            <Ionicons color={colors.accent} name="camera-outline" size={28} />
            <Text style={styles.permTitle}>Camera access needed</Text>
            <Text style={styles.permCopy}>
              GlowPep takes three angles — front, left, right — and combines them into one read.
              Grant camera access to start.
            </Text>
            <Pressable
              onPress={async () => {
                const next = await requestPermission();
                if (!next.granted && !next.canAskAgain) openSettings();
              }}
              style={styles.permButton}>
              <Text style={styles.permButtonText}>
                {permission.canAskAgain ? 'Grant access' : 'Open Settings'}
              </Text>
              <Ionicons color={colors.accentInk} name="arrow-forward" size={15} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <SafeAreaView edges={['top', 'bottom']} style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons color={colors.text} name="close" size={18} />
          </Pressable>
          <Text style={styles.eyebrow}><Text style={styles.eyebrowDot}>● </Text>{meta}</Text>
          <Pressable onPress={() => setFacing((f) => (f === 'front' ? 'back' : 'front'))} style={styles.iconBtn}>
            <Ionicons color={colors.text} name="sync" size={18} />
          </Pressable>
        </View>

        <View style={styles.stepRow}>
          {ANGLES.map((angle, index) => {
            const done = Boolean(photos[angle.key]);
            const active = index === stepIndex && !done;
            return (
              <Pressable key={angle.key} onPress={() => setStepIndex(index)} style={[styles.stepPill, done && styles.stepPillDone, active && styles.stepPillActive]}>
                <Text style={[styles.stepPillText, (done || active) && styles.stepPillTextOn]}>{angle.shortLabel}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.frame}>
          <View style={[styles.bracket, styles.bracketTL]} />
          <View style={[styles.bracket, styles.bracketTR]} />
          <View style={[styles.bracket, styles.bracketBL]} />
          <View style={[styles.bracket, styles.bracketBR]} />
          <Animated.View style={[styles.scanline, { transform: [{ translateY: scanY }] }]} />
          <View style={styles.tickRow}>{Array.from({ length: 21 }).map((_, i) => <View key={i} style={[styles.tick, i === 10 && styles.tickOn]} />)}</View>
          <Text style={[styles.eyebrow, { marginTop: 14, color: colors.textMuted }]}>{allCaptured ? 'READY TO ANALYZE' : currentAngle.guide}</Text>
          <Text style={styles.angleInstruction}>{allCaptured ? 'Review all three angles, then run one combined read.' : currentAngle.instruction}</Text>
        </View>

        <View style={styles.bottom}>
          <View style={styles.reviewRow}>
            {ANGLES.map((angle) => {
              const photo = photos[angle.key];
              return (
                <Pressable key={angle.key} onPress={() => (photo ? retake(angle.key) : setStepIndex(ANGLES.findIndex((item) => item.key === angle.key)))} style={styles.angleThumbWrap}>
                  {photo ? <Image source={{ uri: photo.uri }} style={styles.angleThumb} /> : <Text style={styles.angleEmpty}>{angle.shortLabel}</Text>}
                </Pressable>
              );
            })}
          </View>

          {allCaptured ? (
            <Pressable disabled={isAnalyzing} onPress={analyze} style={[styles.analyzeButton, isAnalyzing && { opacity: 0.65 }]}>
              {isAnalyzing ? <ActivityIndicator color={colors.accentInk} size="small" /> : <Text style={styles.analyzeButtonText}>Analyze all angles</Text>}
              {!isAnalyzing ? <Ionicons color={colors.accentInk} name="sparkles" size={17} /> : null}
            </Pressable>
          ) : (
            <View style={styles.captureRow}>
              <Pressable onPress={pickFromLibrary} style={styles.sideBtn}>
                {latestUri ? <Image source={{ uri: latestUri }} style={styles.thumb} /> : <Ionicons color={colors.textMuted} name="images-outline" size={18} />}
              </Pressable>
              <Pressable onPress={capture} style={[styles.captureOuter, isCapturing && { opacity: 0.6 }]}>
                <View style={styles.captureInner} />
              </Pressable>
              <View style={styles.sideBtn}><Text style={styles.timerText}>{stepIndex + 1}/3</Text></View>
            </View>
          )}

          <Text style={styles.foot}>FRONT · LEFT · RIGHT — COSMETIC FEEDBACK ONLY</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHead}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{safeValue} / 100</Text>
      </View>
      <View style={styles.metricTrack}><View style={[styles.metricFill, { width: `${safeValue}%` }]} /></View>
    </View>
  );
}

const FRAME_W = 250;
const FRAME_H = 320;
const BR = 18;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#040301' },
  fallback: { backgroundColor: '#1a140a' },
  vignette: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  safe: { flex: 1, justifyContent: 'space-between' },
  topBar: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 8 },
  topBarSolid: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  iconBtn: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 },
  iconBtnSolid: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, height: 40, justifyContent: 'center', width: 40 },
  eyebrow: { ...t.eyebrow, color: colors.text, fontFamily: fonts.mono, fontSize: 10, letterSpacing: 1.4 },
  eyebrowDot: { color: colors.accent },
  stepRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 28 },
  stepPill: { borderColor: colors.borderStrong, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth, flex: 1, paddingVertical: 9 },
  stepPillActive: { borderColor: colors.accent, backgroundColor: 'rgba(212,168,75,0.12)' },
  stepPillDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  stepPillText: { color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1, textAlign: 'center' },
  stepPillTextOn: { color: colors.accentInk },
  frame: { alignItems: 'center', alignSelf: 'center', height: FRAME_H, justifyContent: 'flex-end', paddingBottom: 34, position: 'relative', width: FRAME_W },
  bracket: { borderColor: colors.accent, height: BR, position: 'absolute', width: BR },
  bracketTL: { borderLeftWidth: 1, borderTopWidth: 1, left: 0, top: 0 },
  bracketTR: { borderRightWidth: 1, borderTopWidth: 1, right: 0, top: 0 },
  bracketBL: { borderBottomWidth: 1, borderLeftWidth: 1, bottom: 0, left: 0 },
  bracketBR: { borderBottomWidth: 1, borderRightWidth: 1, bottom: 0, right: 0 },
  scanline: { backgroundColor: colors.accent, height: 1, left: 12, opacity: 0.7, position: 'absolute', right: 12, top: '50%' },
  tickRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  tick: { backgroundColor: colors.textFaint, height: 8, width: 1 },
  tickOn: { backgroundColor: colors.accent, height: 12 },
  angleInstruction: { color: colors.textMuted, fontFamily: fonts.sansMedium, fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 250, textAlign: 'center' },
  bottom: { paddingBottom: 24, paddingHorizontal: 28 },
  reviewRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  angleThumbWrap: { alignItems: 'center', backgroundColor: 'rgba(10,9,7,0.72)', borderColor: colors.borderStrong, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, flex: 1, height: 58, justifyContent: 'center', overflow: 'hidden' },
  angleThumb: { height: '100%', width: '100%' },
  angleEmpty: { color: colors.textDim, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1 },
  captureRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sideBtn: { alignItems: 'center', borderColor: colors.borderStrong, borderWidth: StyleSheet.hairlineWidth, height: 44, justifyContent: 'center', width: 44 },
  thumb: { height: 44, width: 44 },
  timerText: { color: colors.textMuted, fontFamily: fonts.mono, fontSize: 11 },
  captureOuter: { alignItems: 'center', borderColor: colors.accent, borderRadius: 999, borderWidth: 1, height: 78, justifyContent: 'center', width: 78 },
  captureInner: { backgroundColor: colors.accent, borderRadius: 999, height: 62, width: 62 },
  analyzeButton: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 18, flexDirection: 'row', gap: 8, justifyContent: 'center', minHeight: 58 },
  analyzeButtonText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 15 },
  foot: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 9, letterSpacing: 1.4, marginTop: 18, textAlign: 'center' },
  resultSafe: { backgroundColor: colors.background, flex: 1 },
  resultScroll: { paddingBottom: 40, paddingHorizontal: 20, paddingTop: 12 },
  scoreCard: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  resultKicker: { ...t.eyebrow, color: colors.accent, marginBottom: 12 },
  scoreHead: { alignItems: 'flex-start', flexDirection: 'row', gap: 14, justifyContent: 'space-between', marginBottom: 18 },
  resultTitle: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 30, letterSpacing: -0.8, lineHeight: 32 },
  resultCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, marginTop: 8, maxWidth: 220 },
  scoreBadge: { alignItems: 'center', borderColor: colors.borderStrong, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, minWidth: 76, paddingHorizontal: 10, paddingVertical: 8 },
  scoreValue: { color: colors.accentSoft, fontFamily: fonts.serifLight, fontSize: 28, lineHeight: 30 },
  scoreLabel: { color: colors.textDim, fontFamily: fonts.mono, fontSize: 8, letterSpacing: 0.8, marginTop: 2 },
  metricRow: { gap: 8, marginBottom: 14 },
  metricHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: colors.textMuted, fontFamily: fonts.sansMedium, fontSize: 13 },
  metricValue: { color: colors.accentSoft, fontFamily: fonts.monoMedium, fontSize: 12 },
  metricTrack: { backgroundColor: colors.backgroundAlt, borderRadius: 999, height: 5, overflow: 'hidden' },
  metricFill: { backgroundColor: colors.accentSoft, borderRadius: 999, height: 5 },
  offlineBanner: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.borderStrong, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 8, justifyContent: 'center', marginBottom: 16, paddingVertical: 10 },
  offlineBannerText: { color: colors.textMuted, fontFamily: fonts.monoMedium, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  offlineImage: { opacity: 0.65 },
  photoStrip: { flexDirection: 'row', gap: 10, marginTop: 14 },
  reviewThumbWrap: { flex: 1, borderRadius: 14, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  reviewThumbWrapSelected: { borderColor: colors.accent },
  reviewThumb: { backgroundColor: colors.surface, height: 86, width: '100%' },
  panel: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, marginTop: 16, padding: 18 },
  panelTitle: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 18, marginBottom: 14 },
  angleInsightRow: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 10 },
  angleInsightThumb: { backgroundColor: colors.backgroundAlt, borderRadius: 12, height: 58, width: 58 },
  angleInsightCopy: { flex: 1 },
  angleInsightLabel: { color: colors.accent, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1, marginBottom: 4, textTransform: 'uppercase' },
  angleInsightText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  feedbackRow: { alignItems: 'flex-start', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 12 },
  feedbackNum: { color: colors.accent, fontFamily: fonts.monoMedium, fontSize: 10, letterSpacing: 1.1, paddingTop: 3 },
  feedbackText: { color: colors.textMuted, flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  recoRow: { alignItems: 'center', borderBottomColor: colors.border, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 12, paddingVertical: 13 },
  recoName: { color: colors.text, fontFamily: fonts.sansMedium, fontSize: 15 },
  recoCopy: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 4 },
  resultFoot: { color: colors.textDim, fontFamily: fonts.sans, fontSize: 12, lineHeight: 18, marginTop: 18, textAlign: 'center' },

  permGate: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    zIndex: 10,
  },
  permCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
    padding: 24,
  },
  permTitle: { color: colors.text, fontFamily: fonts.serifLight, fontSize: 22, letterSpacing: -0.5, textAlign: 'center' },
  permCopy: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  permButton: {
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  permButtonText: { color: colors.accentInk, fontFamily: fonts.sansMedium, fontSize: 14 },
});
