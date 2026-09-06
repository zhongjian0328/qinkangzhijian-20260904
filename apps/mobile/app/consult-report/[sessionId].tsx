import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ConsultSession, ConsultReport } from '@qinkang/types';
import { consultApi } from '../../src/api/consult';

function Section(props: { icon: keyof typeof Ionicons.glyphMap; label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.labelRow}>
        <Ionicons name={props.icon} size={16} color="#22C55E" />
        <Text style={styles.label}>{props.label}</Text>
      </View>
      {props.children}
    </View>
  );
}

export default function ConsultReportScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();

  const [session, setSession] = useState<ConsultSession | null>(null);
  const [report, setReport] = useState<ConsultReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await consultApi.get(sessionId);
      setSession(s);
      setReport((s.report as ConsultReport | null) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const r = await consultApi.generateReport(sessionId);
      setReport(r);
    } catch (e) {
      Alert.alert('生成失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  const diag = report?.diagnosis;

  // 把报告中的诊断结论组装成诊疗服务的「服务需求」预填文本
  const goToVetDesc = () => {
    if (!diag?.preliminaryDiagnosis) return '来自AI对话问诊转诊，请协助进一步诊断';
    const parts = [`初步诊断：${diag.preliminaryDiagnosis}`];
    if (typeof diag.confidence === 'number') parts.push(`置信度 ${(diag.confidence * 100).toFixed(0)}%`);
    if (diag.suggestions?.length) parts.push(`建议：${diag.suggestions.join('；')}`);
    if (diag.nextSteps) parts.push(`后续：${diag.nextSteps}`);
    return parts.join('\n');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ 返回</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" size="large" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !report ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>暂无诊断报告</Text>
          <Text style={styles.emptyDesc}>
            当前会话尚未生成诊断报告。若 AI 已给出初步诊断结论，可点击下方按钮生成。
          </Text>
          <TouchableOpacity
            style={[styles.primaryBtn, generating && styles.disabled]}
            onPress={generate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>📄 生成诊断报告</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headerCard}>
            <Text style={styles.reportTag}>AI 对话问诊 · 诊断报告</Text>
            <Text style={styles.reportTitle}>{report.title}</Text>
            <Text style={styles.reportMeta}>
              生成时间：{new Date(report.generatedAt).toLocaleString('zh-CN')}
            </Text>
          </View>

          {diag?.preliminaryDiagnosis ? (
            <Section icon="medkit" label="诊断结论">
              <Text style={styles.disease}>{diag.preliminaryDiagnosis}</Text>
              {typeof diag.confidence === 'number' ? (
                <Text style={styles.confidence}>
                  置信度 {(diag.confidence * 100).toFixed(0)}%
                </Text>
              ) : null}
            </Section>
          ) : null}

          {diag?.suggestions?.length ? (
            <Section icon="bandage" label="处置建议">
              {diag.suggestions.map((s, i) => (
                <Text key={i} style={styles.li}>
                  {i + 1}. {s}
                </Text>
              ))}
            </Section>
          ) : null}

          {diag?.nextSteps ? (
            <Section icon="calendar" label="后续建议">
              <Text style={styles.li}>{diag.nextSteps}</Text>
            </Section>
          ) : null}

          {report.relatedDiseases?.length ? (
            <Section icon="git-branch" label="关联疾病">
              <View style={styles.tagRow}>
                {report.relatedDiseases.map((d, i) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{d}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {report.conversationSummary ? (
            <Section icon="document-text" label="问诊摘要">
              <Text style={styles.li}>{report.conversationSummary}</Text>
            </Section>
          ) : null}

          <Text style={styles.disclaimer}>{report.disclaimer}</Text>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => router.push({ pathname: '/service', params: { desc: goToVetDesc() } })}
          >
            <Ionicons name="people" size={18} color="#22C55E" />
            <Text style={styles.ghostBtnText}>转人工兽医</Text>
          </TouchableOpacity>
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
  emptyWrap: { marginTop: 60, alignItems: 'center', paddingHorizontal: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  emptyDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 22, marginTop: 10 },
  primaryBtn: {
    marginTop: 24, padding: 14, borderRadius: 12, backgroundColor: '#22C55E',
    alignItems: 'center', minWidth: 200,
  },
  disabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  headerCard: {
    padding: 16, borderRadius: 14, backgroundColor: '#f0fdf4',
    borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 4,
  },
  reportTag: { fontSize: 12, color: '#15803d', fontWeight: 'bold' },
  reportTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginTop: 8 },
  reportMeta: { fontSize: 12, color: '#6b7280', marginTop: 6 },
  section: { marginTop: 18 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  disease: { fontSize: 22, fontWeight: 'bold', color: '#166534' },
  confidence: { fontSize: 14, color: '#22C55E', fontWeight: 'bold', marginTop: 6 },
  li: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6,
  },
  tagText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  disclaimer: { fontSize: 12, color: '#9ca3af', marginTop: 24, lineHeight: 18 },
  ghostBtn: {
    marginTop: 16, padding: 14, borderRadius: 12, borderWidth: 1,
    borderColor: '#22C55E', alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 6,
  },
  ghostBtnText: { color: '#22C55E', fontSize: 14, fontWeight: '600' },
});
