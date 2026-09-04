import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Diagnosis } from '@qinkang/types';
import { diagnosisApi } from '../../src/api/diagnosis';
import { assetUrl } from '../../src/api/client';

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: '#22C55E' },
  medium: { label: '中风险', color: '#F59E0B' },
  high: { label: '高风险', color: '#F97316' },
  critical: { label: '危重', color: '#EF4444' },
};

const STATUS_LABEL: Record<string, string> = {
  pending: '排队中',
  analyzing: '分析中',
  completed: '已完成',
  failed: '失败',
};

const isTerminal = (s: string) => s === 'completed' || s === 'failed';

export default function DiagnosisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await diagnosisApi.get(id);
        if (cancelled) return;
        setDiagnosis(data);
        if (isTerminal(data.status)) {
          if (timerRef.current) clearInterval(timerRef.current);
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : '加载失败');
      }
    };

    load();
    timerRef.current = setInterval(() => {
      setDiagnosis((prev) => {
        if (prev && isTerminal(prev.status)) {
          if (timerRef.current) clearInterval(timerRef.current);
          return prev;
        }
        return prev;
      });
      load();
    }, 3000);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const ai = diagnosis?.aiResult;
  const severity = ai?.severity ? SEVERITY_META[ai.severity] : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ 返回</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !diagnosis ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" size="large" />
      ) : (
        <>
          {diagnosis.imageUrls?.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageRow}
              contentContainerStyle={styles.imageRowContent}
            >
              {diagnosis.imageUrls.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri: assetUrl(uri) }}
                  style={styles.image}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.statusRow}>
            <Text style={styles.statusBadge}>{STATUS_LABEL[diagnosis.status] ?? diagnosis.status}</Text>
            {diagnosis.status === 'completed' && ai?.disease ? (
              <Text style={styles.confidence}>置信度 {(diagnosis.confidence * 100).toFixed(1)}%</Text>
            ) : null}
          </View>

          {diagnosis.status === 'pending' || diagnosis.status === 'analyzing' ? (
            <View style={styles.analyzingBox}>
              <ActivityIndicator color="#22C55E" />
              <Text style={styles.analyzingText}>AI 正在分析中，请稍候…</Text>
            </View>
          ) : diagnosis.status === 'failed' ? (
            <Text style={styles.failedText}>诊断失败，请重新拍摄或稍后重试</Text>
          ) : ai ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <Text style={styles.disease}>{ai.disease}</Text>
                {severity ? (
                  <View style={[styles.severityBadge, { backgroundColor: severity.color }]}>
                    <Text style={styles.severityText}>{severity.label}</Text>
                  </View>
                ) : null}
              </View>

              {ai.description ? (
                <View style={styles.section}>
                  <Text style={styles.label}>疾病描述</Text>
                  <Text style={styles.body}>{ai.description}</Text>
                </View>
              ) : null}

              {ai.recommendations?.length ? (
                <View style={styles.section}>
                  <Text style={styles.label}>治疗与预防建议</Text>
                  {ai.recommendations.map((rec, i) => (
                    <Text key={i} style={styles.rec}>
                      • {rec}
                    </Text>
                  ))}
                </View>
              ) : null}

              {ai.differentialDiagnoses?.length ? (
                <View style={styles.section}>
                  <Text style={styles.label}>鉴别诊断</Text>
                  {ai.differentialDiagnoses.map((d, i) => (
                    <View key={i} style={styles.diffRow}>
                      <Text style={styles.diffName}>{d.disease}</Text>
                      <Text style={styles.diffProb}>{(d.probability * 100).toFixed(1)}%</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 12 },
  backText: { fontSize: 16, color: '#22C55E', fontWeight: '600' },
  loading: { marginTop: 60 },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  imageRow: { marginTop: 4 },
  imageRowContent: { gap: 8 },
  image: { width: 260, height: 200, borderRadius: 16, backgroundColor: '#f5f5f5' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  statusBadge: { fontSize: 14, color: '#666', fontWeight: 'bold' },
  confidence: { fontSize: 14, color: '#22C55E', fontWeight: 'bold' },
  analyzingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40, justifyContent: 'center' },
  analyzingText: { color: '#666' },
  failedText: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  resultCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  disease: { fontSize: 20, fontWeight: 'bold', color: '#111', flexShrink: 1 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginLeft: 8 },
  severityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  section: { marginTop: 16 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#374151', marginBottom: 6 },
  body: { fontSize: 14, color: '#4b5563', lineHeight: 21 },
  rec: { fontSize: 14, color: '#4b5563', lineHeight: 21, marginBottom: 2 },
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