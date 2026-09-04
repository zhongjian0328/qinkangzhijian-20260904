import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import { Diagnosis, Species } from '@qinkang/types';
import { diagnosisApi } from '../../src/api/diagnosis';
import { useAuthStore } from '../../src/store/auth';

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: 'chicken', label: '鸡' },
  { value: 'duck', label: '鸭' },
  { value: 'goose', label: '鹅' },
  { value: 'turkey', label: '火鸡' },
  { value: 'other', label: '其他' },
];

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: '#22C55E' },
  medium: { label: '中风险', color: '#F59E0B' },
  high: { label: '高风险', color: '#F97316' },
  critical: { label: '危重', color: '#EF4444' },
};

function getMime(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

async function uriToDataUri(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${getMime(uri)};base64,${base64}`;
}

function parseSymptoms(text: string): string[] {
  return text
    .split(/[,，、;；\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function DiagnoseScreen() {
  const token = useAuthStore((s) => s.token);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species>('chicken');
  const [symptomsText, setSymptomsText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相册以选择禽类照片');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!picked.canceled) {
      setImageUri(picked.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许使用相机拍摄禽类照片');
      return;
    }

    const picked = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!picked.canceled) {
      setImageUri(picked.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const pollUntilDone = async (id: string): Promise<Diagnosis> => {
    for (let i = 0; i < 30; i++) {
      await delay(2000);
      const latest = await diagnosisApi.get(id);
      if (latest.status === 'completed' || latest.status === 'failed') {
        return latest;
      }
    }
    throw new Error('诊断超时，请稍后在诊断记录中查看结果');
  };

  const submit = async () => {
    if (!imageUri) {
      setError('请先选择或拍摄一张禽类照片');
      return;
    }
    if (!token) {
      Alert.alert('未登录', '请先登录后再进行 AI 诊断', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => router.push('/login') },
      ]);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageUrl = await uriToDataUri(imageUri);
      const created = await diagnosisApi.create({
        imageUrl,
        species,
        symptoms: parseSymptoms(symptomsText),
      });
      const final = await pollUntilDone(created.id);
      setResult(final);
    } catch (e) {
      setError(e instanceof Error ? e.message : '诊断失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const severity = result?.aiResult?.severity
    ? SEVERITY_META[result.aiResult.severity] ?? SEVERITY_META.low
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>AI 诊断</Text>
      <Text style={styles.subtitle}>选择或拍摄禽类照片进行分析</Text>

      {imageUri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
          <TouchableOpacity style={styles.changeImage} onPress={pickImage}>
            <Text style={styles.changeImageText}>更换图片</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderIcon}>🐔</Text>
          <Text style={styles.placeholderText}>点击下方按钮选择图片</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={pickImage}>
          <Text style={styles.buttonText}>📁 从相册选择</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={takePhoto}>
          <Text style={[styles.buttonText, styles.secondaryText]}>📷 拍照</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>禽种</Text>
        <View style={styles.speciesRow}>
          {SPECIES_OPTIONS.map((opt) => {
            const active = species === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setSpecies(opt.value)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>症状描述（选填）</Text>
        <TextInput
          style={styles.input}
          placeholder="例如：精神萎靡、拉稀、食欲下降"
          placeholderTextColor="#aaa"
          value={symptomsText}
          onChangeText={setSymptomsText}
          multiline
        />
      </View>

      <TouchableOpacity
        style={[styles.submit, loading && styles.submitDisabled]}
        onPress={submit}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.submitInner}>
            <ActivityIndicator color="#fff" />
            <Text style={styles.submitText}>诊断中，请稍候…</Text>
          </View>
        ) : (
          <Text style={styles.submitText}>开始诊断</Text>
        )}
      </TouchableOpacity>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {result && result.status === 'completed' && result.aiResult ? (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultDisease}>{result.aiResult.disease}</Text>
            <Text style={styles.confidence}>
              置信度 {(result.confidence * 100).toFixed(1)}%
            </Text>
          </View>

          {severity ? (
            <View style={[styles.severityBadge, { backgroundColor: severity.color }]}>
              <Text style={styles.severityText}>{severity.label}</Text>
            </View>
          ) : null}

          {result.aiResult.description ? (
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>疾病描述</Text>
              <Text style={styles.resultBody}>{result.aiResult.description}</Text>
            </View>
          ) : null}

          {result.aiResult.recommendations?.length ? (
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>治疗与预防建议</Text>
              {result.aiResult.recommendations.map((rec, i) => (
                <Text key={i} style={styles.recommendation}>
                  • {rec}
                </Text>
              ))}
            </View>
          ) : null}

          {result.aiResult.differentialDiagnoses?.length ? (
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>鉴别诊断</Text>
              {result.aiResult.differentialDiagnoses.map((d, i) => (
                <View key={i} style={styles.diffRow}>
                  <Text style={styles.diffName}>{d.disease}</Text>
                  <Text style={styles.diffProb}>{(d.probability * 100).toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  placeholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
  },
  placeholderIcon: { fontSize: 48, marginBottom: 8 },
  placeholderText: { color: '#999' },
  previewWrap: { marginVertical: 20 },
  preview: { width: '100%', height: 220, borderRadius: 16, backgroundColor: '#f5f5f5' },
  changeImage: { alignSelf: 'center', marginTop: 10 },
  changeImageText: { color: '#22C55E', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12 },
  button: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: '#22C55E' },
  secondaryButton: { backgroundColor: '#e8f5e9' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  secondaryText: { color: '#22C55E' },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 12,
    minHeight: 72,
    fontSize: 14,
    textAlignVertical: 'top',
    color: '#333',
  },
  submit: {
    marginTop: 28,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  errorBox: { marginTop: 16, padding: 14, backgroundColor: '#fef2f2', borderRadius: 12 },
  errorText: { color: '#EF4444' },
  resultCard: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultDisease: { fontSize: 20, fontWeight: 'bold', color: '#111', flexShrink: 1 },
  confidence: { fontSize: 14, color: '#22C55E', fontWeight: 'bold', marginLeft: 8 },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginTop: 8,
  },
  severityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  resultSection: { marginTop: 16 },
  resultLabel: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  resultBody: { fontSize: 14, color: '#4b5563', lineHeight: 21 },
  recommendation: { fontSize: 14, color: '#4b5563', lineHeight: 21, marginBottom: 2 },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  diffName: { fontSize: 14, color: '#4b5563' },
  diffProb: { fontSize: 14, color: '#6b7280' },
});
