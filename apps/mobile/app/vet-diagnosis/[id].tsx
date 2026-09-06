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
import { Ionicons } from '@expo/vector-icons';
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

export default function VetDiagnosisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [vc, setVc] = useState<VetCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'submitting' | 'done' | string>('idle');
  const [feedbackValue, setFeedbackValue] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await vetDiagnosisApi.get(id);
        if (cancelled) return;
        setVc(data);
        if (data.feedback) {
          setFeedbackState('done');
          setFeedbackValue(data.feedback);
        }
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
  const bi = vc?.basicInfo;

  const feedback = async (value: string) => {
    if (!vc || feedbackState === 'submitting' || feedbackState === 'done') return;
    setFeedbackState('submitting');
    setFeedbackValue(value);
    try {
      await vetDiagnosisApi.feedback(vc.id, value);
      setFeedbackState('done');
    } catch (e) {
      setFeedbackValue(null);
      setFeedbackState('idle');
      setError(e instanceof Error ? e.message : '反馈失败');
    }
  };

  // 组装转人工兽医的「服务需求」预填文本（含诊断结论 + 基本信息）
  const buildServiceDesc = () => {
    const parts: string[] = [];
    if (bi?.species) parts.push(`动物种类：${bi.species}`);
    if (bi?.breed) parts.push(`品种：${bi.breed}`);
    if (bi?.ageDays) parts.push(`日龄：${bi.ageDays}天`);
    if (report?.primary?.disease) parts.push(`AI诊断：${report.primary.disease}`);
    if (typeof report?.confidence === 'number') parts.push(`置信度 ${(report.confidence * 100).toFixed(0)}%`);
    if (report?.riskWarning) parts.push(`风险提示：${report.riskWarning}`);
    return parts.join('；') || '来自AI兽医诊断转诊，请协助进一步诊断';
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
          {/* 顶部：主要基本信息 */}
          <View style={styles.headerCard}>
            <Text style={styles.headerTitle}>
              {bi?.species ?? vc.species}
              {bi?.breed ? ` · ${bi.breed}` : ''}
              {bi?.ageDays ? ` · ${bi.ageDays}日龄` : ''}
            </Text>
            {bi?.stock ? (
              <Text style={styles.headerSub}>
                存栏 {bi.stock} 羽{bi?.sickCount ? ` · 发病 ${bi.sickCount}` : ''}{bi?.deathCount ? ` · 死亡 ${bi.deathCount}` : ''}
              </Text>
            ) : null}
            {bi?.feedingMode || bi?.productionStage ? (
              <Text style={styles.headerSub}>
                {bi?.feedingMode} · {bi?.productionStage}
              </Text>
            ) : null}
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

              <Section icon="medkit" label="诊断结论">
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
                        <Text style={styles.diffName}>• {s.disease}</Text>
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
                <Section icon="document-text" label="诊断依据">
                  {report.evidence.map((e, i) => (
                    <Text key={i} style={styles.li}>• {e}</Text>
                  ))}
                </Section>
              ) : null}

              {report.differentialTests?.length ? (
                <Section icon="flask" label="鉴别诊断建议">
                  {report.differentialTests.map((t, i) => (
                    <Text key={i} style={styles.li}>{i + 1}. {t}</Text>
                  ))}
                </Section>
              ) : null}

              <Section icon="bandage" label="防控方案">
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
                <Section icon="calendar" label="随访建议">
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
            <TouchableOpacity
              style={styles.actionBtnGhost}
              onPress={() => router.push({ pathname: '/service', params: { desc: buildServiceDesc() } })}
            >
              <Ionicons name="people" size={18} color="#22C55E" />
              <Text style={styles.actionBtnGhostText}>转人工兽医</Text>
            </TouchableOpacity>
          </View>

          {/* 反馈：点击后显示变化提示并消失 */}
          {feedbackState === 'done' ? (
            <View style={styles.feedbackDone}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.feedbackDoneText}>
                {feedbackValue === 'accurate' ? '感谢反馈：诊断准确' : '感谢反馈：已记录，我们会持续改进'}
              </Text>
            </View>
          ) : (
            <View style={styles.feedbackRow}>
              <Text style={styles.feedbackLabel}>诊断是否准确？</Text>
              <TouchableOpacity
                style={[styles.feedbackBtn, feedbackState === 'submitting' && styles.feedbackDisabled]}
                onPress={() => feedback('accurate')}
                disabled={feedbackState === 'submitting'}
              >
                <Text style={styles.feedbackBtnText}>✓ 准确</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackBtn, feedbackState === 'submitting' && styles.feedbackDisabled]}
                onPress={() => feedback('inaccurate')}
                disabled={feedbackState === 'submitting'}
              >
                <Text style={styles.feedbackBtnText}>✗ 不准确</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 底部：编号 / 状态 / AI引擎 等元信息 */}
          <View style={styles.footerMeta}>
            <Text style={styles.footerMetaText}>编号：{vc.caseNo}</Text>
            <Text style={styles.footerMetaText}>状态：{STATUS_LABEL[vc.status] ?? vc.status}</Text>
            <Text style={styles.footerMetaText}>AI引擎：{engineLabel}</Text>
            <Text style={styles.footerMetaText}>时间：{new Date(vc.createdAt).toLocaleString('zh-CN')}</Text>
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
    padding: 16, borderRadius: 14, backgroundColor: '#f0fdf4',
    borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 4,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#166534' },
  headerSub: { fontSize: 13, color: '#15803d', marginTop: 4 },
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
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#111' },
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
  actionBtnGhost: {
    padding: 13, borderRadius: 12, borderWidth: 1, borderColor: '#22C55E',
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
  },
  actionBtnGhostText: { color: '#22C55E', fontSize: 14, fontWeight: '600' },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  feedbackLabel: { fontSize: 13, color: '#666', marginRight: 4 },
  feedbackBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#f0f0f0' },
  feedbackBtnText: { fontSize: 13, color: '#374151' },
  feedbackDisabled: { opacity: 0.5 },
  feedbackDone: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20,
    padding: 12, borderRadius: 10, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
  },
  feedbackDoneText: { fontSize: 13, color: '#166534', fontWeight: '600' },
  footerMeta: {
    marginTop: 24, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb',
  },
  footerMetaText: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
});
