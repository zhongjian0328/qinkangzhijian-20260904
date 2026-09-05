import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { InternLog } from '@qinkang/types';
import { learningApi } from '../../src/api/learning';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function TeachingTab() {
  const router = useRouter();
  const [logs, setLogs] = useState<InternLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await learningApi.internLogs());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pending = logs.filter((l) => l.status === 'submitted');
  const reviewed = logs.filter((l) => l.status === 'reviewed');

  const submitReview = async (id: string) => {
    if (!comment.trim()) return Alert.alert('提示', '请输入批注内容');
    setSaving(true);
    try {
      await learningApi.reviewInternLog(id, comment.trim());
      setComment('');
      setExpanded(null);
      await load();
    } catch (e) {
      Alert.alert('批注失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>教学管理</Text>
      <Text style={styles.sub}>实习日志批改 · 题库组卷 · 师生协同</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{pending.length}</Text>
          <Text style={styles.statLabel}>待批改</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{reviewed.length}</Text>
          <Text style={styles.statLabel}>已批改</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>待批改实习日志</Text>
          <TouchableOpacity onPress={() => router.push('/intern')}>
            <Text style={styles.link}>全部 ›</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loading} color="#22C55E" />
        ) : pending.length === 0 ? (
          <Text style={styles.empty}>暂无待批改日志</Text>
        ) : (
          pending.map((l) => {
            const open = expanded === l.id;
            return (
              <View key={l.id} style={styles.logCard}>
                <TouchableOpacity onPress={() => setExpanded(open ? null : l.id)}>
                  <Text style={styles.logTitle}>{l.title}</Text>
                  <Text style={styles.logDate}>{formatDate(l.logDate)}</Text>
                  {l.studentDiagnosis ? (
                    <Text style={styles.logDiag}>学生诊断：{l.studentDiagnosis}</Text>
                  ) : null}
                </TouchableOpacity>
                {open && (
                  <View style={styles.detail}>
                    <Text style={styles.logContent}>{l.content}</Text>
                    <TextInput
                      style={[styles.input, styles.multiline]}
                      placeholder="输入批注意见……"
                      multiline
                      value={comment}
                      onChangeText={setComment}
                    />
                    <TouchableOpacity
                      style={[styles.submitBtn, saving && { opacity: 0.7 }]}
                      onPress={() => submitReview(l.id)}
                      disabled={saving}
                    >
                      <Text style={styles.submitText}>提交批注</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>教学工具</Text>
        <Entry label="题库测验" desc="题库练习与考试判分" href="/quiz" />
        <Entry label="实习日志" desc="全部学生日志查看" href="/intern" />
        <Entry label="疾病知识库" desc="62 种禽病查询" href="/knowledge" />
      </View>
    </ScrollView>
  );
}

function Entry({ label, desc, href }: { label: string; desc: string; href: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.entry} onPress={() => router.push(href as any)}>
      <View>
        <Text style={styles.entryLabel}>{label}</Text>
        <Text style={styles.entryDesc}>{desc}</Text>
      </View>
      <Text style={styles.entryArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 26, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  link: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  loading: { marginTop: 20 },
  empty: { color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  logCard: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee', paddingVertical: 12 },
  logTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  logDate: { fontSize: 12, color: '#999', marginTop: 2, marginBottom: 4 },
  logDiag: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  detail: { marginTop: 8 },
  logContent: { fontSize: 13, color: '#333', lineHeight: 20, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    backgroundColor: '#fff',
  },
  multiline: { height: 70, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: '#22C55E', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  entryLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  entryDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  entryArrow: { fontSize: 20, color: '#22C55E' },
});
