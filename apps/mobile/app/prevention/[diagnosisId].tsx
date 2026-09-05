import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { PreventionPlan, PreventionPlanContent, FollowUp } from '@qinkang/types';
import { preventionApi } from '../../src/api/prevention';

const SECTIONS: { key: keyof PreventionPlanContent; title: string }[] = [
  { key: 'emergencyMeasures', title: '紧急处置' },
  { key: 'greenMedication', title: '绿色用药' },
  { key: 'immunization', title: '免疫建议' },
  { key: 'biosafety', title: '生物安全' },
  { key: 'monitoringPlan', title: '监测计划' },
];

const DAY_LABEL: Record<number, string> = { 3: '第 3 日回访', 7: '第 7 日回访' };

function FollowUpCard({
  followUp,
  onSave,
}: {
  followUp: FollowUp;
  onSave: (dayOffset: number, notes: string, completed: boolean) => Promise<void>;
}) {
  const [notes, setNotes] = useState(followUp.notes ?? '');
  const [saving, setSaving] = useState(false);
  const done = followUp.status === 'completed';

  const save = async (completed: boolean) => {
    setSaving(true);
    try {
      await onSave(followUp.dayOffset, notes.trim(), completed);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.followupCard}>
      <View style={styles.followupHeader}>
        <Text style={styles.followupTitle}>{DAY_LABEL[followUp.dayOffset] ?? `第 ${followUp.dayOffset} 日`}</Text>
        <View style={[styles.statusBadge, done ? styles.statusDone : styles.statusPending]}>
          <Text style={done ? styles.statusDoneText : styles.statusPendingText}>
            {done ? '已完成' : '待回访'}
          </Text>
        </View>
      </View>

      <TextInput
        style={[styles.input, done && styles.inputDisabled]}
        placeholder="记录回访情况：精神状态、采食饮水、死亡变化等"
        value={notes}
        onChangeText={setNotes}
        multiline
        editable={!done}
      />

      {!done ? (
        <TouchableOpacity
          style={[styles.followupButton, saving && styles.followupDisabled]}
          onPress={() => save(true)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.followupButtonText}>标记完成并保存</Text>
          )}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.reopenButton} onPress={() => save(false)} disabled={saving}>
          <Text style={styles.reopenText}>重新打开回访</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function PreventionDetailScreen() {
  const router = useRouter();
  const { diagnosisId } = useLocalSearchParams<{ diagnosisId: string }>();
  const id = Array.isArray(diagnosisId) ? diagnosisId[0] : diagnosisId;

  const [plan, setPlan] = useState<PreventionPlan | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const p = await preventionApi.getByDiagnosis(id);
      setPlan(p);
      setNotFound(false);
    } catch {
      setPlan(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const generate = async () => {
    if (!id) return;
    setGenerating(true);
    try {
      const p = await preventionApi.generate(id);
      setPlan(p);
      setNotFound(false);
    } catch (e) {
      Alert.alert('生成失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setGenerating(false);
    }
  };

  const saveFollowup = async (dayOffset: number, notes: string, completed: boolean) => {
    if (!plan) return;
    try {
      await preventionApi.addFollowup(plan.id, {
        dayOffset,
        status: completed ? 'completed' : 'pending',
        notes,
      });
      await load();
    } catch (e) {
      Alert.alert('保存失败', e instanceof Error ? e.message : '请重试');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>防控预案</Text>
      </View>

      {notFound ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>尚未为该诊断生成防控预案</Text>
          <TouchableOpacity
            style={[styles.primaryButton, generating && styles.disabled]}
            onPress={generate}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>生成防控预案</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : plan ? (
        <>
          {plan.content?.diagnosisSummary ? (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>诊断结论</Text>
              <Text style={styles.summaryText}>{plan.content.diagnosisSummary}</Text>
            </View>
          ) : null}

          {SECTIONS.map((s) => {
            const items = (plan.content?.[s.key] as string[]) ?? [];
            if (!items.length) return null;
            return (
              <View key={s.key} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{s.title}</Text>
                {items.map((item, i) => (
                  <Text key={i} style={styles.item}>
                    • {item}
                  </Text>
                ))}
              </View>
            );
          })}

          {plan.content?.followUpNotes ? (
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>回访要点</Text>
              <Text style={styles.body}>{plan.content.followUpNotes}</Text>
            </View>
          ) : null}

          <Text style={styles.followupSectionTitle}>回访记录</Text>
          {(plan.followUps ?? []).map((f) => (
            <FollowUpCard key={f.id} followUp={f} onSave={saveFollowup} />
          ))}
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { marginBottom: 16 },
  back: { fontSize: 15, color: '#22C55E', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  emptyBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 14, color: '#666', marginBottom: 16 },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    alignSelf: 'stretch',
  },
  disabled: { opacity: 0.7 },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  summaryCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#22C55E',
  },
  summaryLabel: { fontSize: 13, color: '#166534', fontWeight: 'bold', marginBottom: 6 },
  summaryText: { fontSize: 14, color: '#1f2937', lineHeight: 21 },
  sectionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  item: { fontSize: 14, color: '#4b5563', lineHeight: 21, marginBottom: 4 },
  body: { fontSize: 14, color: '#4b5563', lineHeight: 21 },
  followupSectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#111', marginTop: 4, marginBottom: 12 },
  followupCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  followupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  followupTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusDone: { backgroundColor: '#DCFCE7' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusDoneText: { color: '#166534', fontSize: 12, fontWeight: 'bold' },
  statusPendingText: { color: '#92400E', fontSize: 12, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputDisabled: { backgroundColor: '#f9fafb', color: '#999' },
  followupButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  followupDisabled: { opacity: 0.7 },
  followupButtonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  reopenButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  reopenText: { color: '#6b7280', fontSize: 13, fontWeight: '600' },
});
