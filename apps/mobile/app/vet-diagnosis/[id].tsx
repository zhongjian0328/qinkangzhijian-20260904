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
import type { VetCase, VetDiagnosisResult } from '@qinkang/types';
import { vetDiagnosisApi } from '../../src/api/vet-diagnosis';
import { assetUrl } from '../../src/api/client';

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: '#22C55E' },
  medium: { label: '中风险', color: '#F59E0B' },
  high: { label: '高风险', color: '#F97316' },
  critical: { label: '危重', color: '#EF4444' },
};

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  submitted: '已提交',
  analyzing: '分析中',
  completed: '已完成',
  failed: '失败',
  offline: '离线诊断',
};

const isTerminal = (s: string) => s === 'completed' || s === 'failed' || s === 'offline';

function Section(props: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>{props.label}</Text>
      {props.children}
    </View>
  );
}

export default function VetDiagnosisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vc, setVc] = useState<VetCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await vetDiagnosisApi.get(id);
        if (cancelled) return;
        setVc(data);
        if (isTerminal(data.status) && timerRef.current) clearInterval(timerRef.current);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      }
    };
    load();
    timerRef.current = setInterval(load, 3000);
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [id]);

  const report: VetDiagnosisResult | null = vc?.diagnosisResult ?? null;
  const severity = report?.severity ? SEVERITY_META[report.severity] : null;
  const engineLabel = vc?.diagnosisEngine === 'offline_rule' ? '规则引擎（离线）' : '豆包大模型';

  const feedback = async (value: string) => {
    if (!vc) return;
    try {
      await vetDiagnosisApi.feedback(vc.id, value);
    } catch (e) {
      setError(e instanceof Error ? e.message : '反馈失败');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ 返回</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !vc ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" size="large" />
      ) : (
        <>
          <View style={styles.headerCard}>
            <Text style={styles.caseNo}>{vc.caseNo}</Text>
            <Text style={styles.status}>{STATUS_LABEL[vc.status] ?? vc.status}</Text>
            <Text style={styles.engine}>AI引擎：{engineLabel}</Text>
          </View>

          {vc.imageUrls?.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow} contentContainerStyle={styles.imageRowContent}>
              {vc.imageUrls.map((uri, i) => (
                <Image key={i} source={{ uri: assetUrl(uri) }} style={styles.image} resizeMode="cover" />
              ))}
            </ScrollView>
          ) : null}

          {vc.status === 'analyzing' || vc.status === 'submitted' ? (
            <View style={styles.analyzingBox}>
              <ActivityIndicator color="#22C55E" />
              <Text style={styles.analyzingText}>AI 正在深度分析 9 维病例信息，请稍候…</Text>
            </View>
          ) : vc.status === 'failed' && !report ? (
            <Text style={styles.failedText}>诊断失败，可点击底部「重试」</Text>
          ) : report ? (
            <View style={styles.report}>
              {report.riskWarning ? (
                <View style={styles.riskBox}>
                  <Text style={styles.riskText}>⚠️ {report.riskWarning}</Text>
                </View>
              ) : null}

              <Section label="🎯 诊断结论">
                <View style={styles.conclusionRow}>
                  <Text style={styles.disease}>{report.primary?.disease ?? report.disease}</Text>
                  {severity ? (
                    <View style={[styles.severityBadge, { backgroundColor: severity.color }]}>
                      <Text style={styles.severityText}>{severity.label}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.confidence}>
                  首要诊断置信度 {(report.primary?.confidence ?? report.confidence) * 100}%
                </Text>
                {report.secondaries?.length ? (
                  <View style={styles.diffList}>
                    {report.secondaries.map((s, i) => (
                      <View key={i} style={styles.diffRow}>
                        <Text style={styles.diffName}>🟡 {s.disease}</Text>
                        <Text style={styles.diffProb}>{(s.confidence * 100).toFixed(0)}%</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {report.excluded?.length ? (
                  <Text style={styles.excluded}>已排除：{report.excluded.join('；')}</Text>
                ) : null}
              </Section>

              {report.evidence?.length ? (
                <Section label="📋 诊断依据">
                  {report.evidence.map((e, i) => (
                    <Text key={i} style={styles.li}>• {e}</Text>
                  ))}
                </Section>
              ) : null}

              {report.differentialTests?.length ? (
                <Section label="🔬 鉴别诊断建议">
                  {report.differentialTests.map((t, i) => (
                    <Text key={i} style={styles.li}>{i + 1}. {t}</Text>
                  ))}
                </Section>
              ) : null}

              <Section label="💊 防控方案">
                {report.treatment?.emergency?.length ? (
                  <Text style={styles.subLabel}>【紧急处理】</Text>
                ) : null}
                {report.treatment?.emergency?.map((t, i) => (
                  <Text key={i} style={styles.li}>{i + 1}. {t}</Text>
                ))}
                {report.treatment?.medication?.length ? (
                  <Text style={styles.subLabel}>【用药方案】</Text>
                ) : null}
                {report.treatment?.medication?.map((t, i) => (
                  <Text key={i} style={styles.li}>{i + 1}. {t}</Text>
                ))}
                {report.treatment?.immunization?.length ? (
                  <Text style={styles.subLabel}>【免疫建议】</Text>
                ) : null}
                {report.treatment?.immunization?.map((t, i) => (
                  <Text key={i} style={styles.li}>{i + 1}. {t}</Text>
                ))}
                {report.treatment?.disinfection?.length ? (
                  <Text style={styles.subLabel}>【消毒管理】</Text>
                ) : null}
                {report.treatment?.disinfection?.map((t, i) => (
                  <Text key={i} style={styles.li}>{i + 1}. {t}</Text>
                ))}
                {report.treatment?.management?.length ? (
                  <Text style={styles.subLabel}>【管理调整】</Text>
                ) : null}
                {report.treatment?.management?.map((t, i) => (
                  <Text key={i} style={styles.li}>{i + 1}. {t}</Text>
                ))}
              </Section>

              {report.followup?.length ? (
                <Section label="📅 随访建议">
                  {report.followup.map((f, i) => (
                    <Text key={i} style={styles.li}>{i + 1}. {f}</Text>
                  ))}
                </Section>
              ) : null}

              <Text style={styles.disclaimer}>{report.disclaimer || '本报告由AI生成，仅供参考，不能替代执业兽医诊断。'}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            {vc.status === 'failed' ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => vetDiagnosisApi.retry(vc.id)}>
                <Text style={styles.actionBtnText}>🔄 重试诊断</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.actionBtnGhost} onPress={() => router.push('/service')}>
              <Text style={styles.actionBtnGhostText}>📞 联系兽医 / 下单诊疗服务</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.feedbackRow}>
            <Text style={styles.feedbackLabel}>诊断是否准确？</Text>
            <TouchableOpacity style={styles.feedbackBtn} onPress={() => feedback('accurate')}>
              <Text style={styles.feedbackBtnText}>✓ 准确</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedbackBtn} onPress={() => feedback('inaccurate')}>
              <Text style={styles.feedbackBtnText}>✗ 不准确</Text>
            </TouchableOpacity>
          </View>
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
  headerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 12, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb',
  },
  caseNo: { fontSize: 13, color: '#374151', fontWeight: '600', flexShrink: 1 },
  status: { fontSize: 13, color: '#22C55E', fontWeight: 'bold' },
  engine: { fontSize: 12, color: '#888', marginLeft: 8 },
  imageRow: { marginTop: 12 },
  imageRowContent: { gap: 8 },
  image: { width: 240, height: 180, borderRadius: 12, backgroundColor: '#f5f5f5' },
  analyzingBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 40, justifyContent: 'center' },
  analyzingText: { color: '#666' },
  failedText: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  report: { marginTop: 16 },
  riskBox: { backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#EF4444' },
  riskText: { color: '#b91c1c', fontSize: 14, fontWeight: '600' },
  section: { marginTop: 18 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  conclusionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  disease: { fontSize: 22, fontWeight: 'bold', color: '#111', flexShrink: 1 },
  severityBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginLeft: 8 },
  severityText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  confidence: { fontSize: 14, color: '#22C55E', fontWeight: 'bold', marginTop: 6 },
  diffList: { marginTop: 10 },
  diffRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
  diffName: { fontSize: 14, color: '#4b5563', flexShrink: 1 },
  diffProb: { fontSize: 14, color: '#6b7280' },
  excluded: { fontSize: 13, color: '#9ca3af', marginTop: 8 },
  li: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 3 },
  subLabel: { fontSize: 13, fontWeight: 'bold', color: '#374151', marginTop: 8, marginBottom: 4 },
  disclaimer: { fontSize: 12, color: '#9ca3af', marginTop: 20, lineHeight: 18 },
  actionRow: { marginTop: 20, gap: 10 },
  actionBtn: { padding: 14, borderRadius: 12, backgroundColor: '#22C55E', alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  actionBtnGhost: { padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#22C55E', alignItems: 'center' },
  actionBtnGhostText: { color: '#22C55E', fontSize: 14, fontWeight: '600' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  feedbackLabel: { fontSize: 13, color: '#666', marginRight: 4 },
  feedbackBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f0f0' },
  feedbackBtnText: { fontSize: 13, color: '#374151' },
});