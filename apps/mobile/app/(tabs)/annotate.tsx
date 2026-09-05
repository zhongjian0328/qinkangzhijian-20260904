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
import { useFocusEffect } from 'expo-router';
import { Annotation, AnnotationStatus } from '@qinkang/types';
import { annotationApi, AnnotationStats } from '../../src/api/annotation';

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: '待标注', color: '#F59E0B' },
  verified: { text: '已标注', color: '#22C55E' },
  special: { text: '特殊', color: '#8B5CF6' },
};
const STATUS_OPTIONS: AnnotationStatus[] = ['pending', 'verified', 'special'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AnnotateTab() {
  const [stats, setStats] = useState<AnnotationStats>({ total: 0, pending: 0, verified: 0, special: 0 });
  const [list, setList] = useState<Annotation[]>([]);
  const [pool, setPool] = useState<Annotation[]>([]);
  const [tab, setTab] = useState<'pool' | 'mine'>('pool');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [disease, setDisease] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [labels, setLabels] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<AnnotationStatus>('pending');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, m, p] = await Promise.all([annotationApi.stats(), annotationApi.list(), annotationApi.pool()]);
      setStats(s);
      setList(m);
      setPool(p);
    } catch {
      /* 无权限时静默 */
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submit = async () => {
    if (!title.trim()) return Alert.alert('提示', '请填写病例标题');
    if (!disease.trim()) return Alert.alert('提示', '请填写疾病分类');
    setSaving(true);
    try {
      await annotationApi.create({
        title: title.trim(),
        disease: disease.trim(),
        symptoms: symptoms.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
        labels: labels.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
        note: note.trim() || null,
        status,
      });
      setTitle('');
      setDisease('');
      setSymptoms('');
      setLabels('');
      setNote('');
      setStatus('pending');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('创建失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (a: Annotation, next: AnnotationStatus) => {
    try {
      await annotationApi.update(a.id, { status: next });
      await load();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除标注', '确定删除该标注吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await annotationApi.remove(id);
            await load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  const data = tab === 'pool' ? pool : list;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>数据标注</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 新建标注'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>病例图片标注 · 症状标签 · 疾病分类</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.pending}</Text>
          <Text style={styles.statLabel}>待标注</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.verified}</Text>
          <Text style={styles.statLabel}>已标注</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.special}</Text>
          <Text style={styles.statLabel}>特殊</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>总数</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>病例标题 *</Text>
          <TextInput style={styles.input} placeholder="如：疑似新城疫病例 #1203" value={title} onChangeText={setTitle} />
          <Text style={styles.fieldLabel}>疾病分类 *</Text>
          <TextInput style={styles.input} placeholder="如：新城疫、禽流感" value={disease} onChangeText={setDisease} />
          <Text style={styles.fieldLabel}>症状（逗号分隔）</Text>
          <TextInput style={styles.input} placeholder="如：精神萎靡,呼吸困难,绿便" value={symptoms} onChangeText={setSymptoms} />
          <Text style={styles.fieldLabel}>标签（逗号分隔）</Text>
          <TextInput style={styles.input} placeholder="如：呼吸道,消化道,急性" value={labels} onChangeText={setLabels} />
          <Text style={styles.fieldLabel}>标注状态</Text>
          <View style={styles.chipRow}>
            {STATUS_OPTIONS.map((s) => {
              const active = status === s;
              return (
                <TouchableOpacity key={s} style={[styles.chip, active && styles.chipActive]} onPress={() => setStatus(s)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{STATUS_LABEL[s].text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>标注说明</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="鉴别诊断要点、标注依据……" multiline value={note} onChangeText={setNote} />
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>提交标注</Text>}
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.toggleRow}>
        {(['pool', 'mine'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleBtn, tab === t && styles.toggleBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.toggleText, tab === t && styles.toggleTextActive]}>
              {t === 'pool' ? '标注池' : '我的标注'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : data.length === 0 ? (
        <Text style={styles.empty}>暂无标注数据</Text>
      ) : (
        data.map((a) => {
          const st = STATUS_LABEL[a.status] ?? STATUS_LABEL.pending;
          const open = expanded === a.id;
          return (
            <View key={a.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(open ? null : a.id)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={[styles.badge, { color: st.color }]}>{st.text}</Text>
                </View>
                <Text style={styles.disease}>{a.disease}</Text>
                {a.labels.length > 0 && (
                  <View style={styles.tagRow}>
                    {a.labels.map((l, i) => (
                      <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{l}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.meta}>{formatDate(a.createdAt)}</Text>
              </TouchableOpacity>
              {open && (
                <View style={styles.detail}>
                  {a.symptoms.length > 0 && (
                    <Text style={styles.detailText}>症状：{a.symptoms.join('、')}</Text>
                  )}
                  {a.note ? <Text style={styles.detailText}>说明：{a.note}</Text> : null}
                  <View style={styles.statusRow}>
                    {STATUS_OPTIONS.filter((s) => s !== a.status).map((s) => (
                      <TouchableOpacity key={s} onPress={() => changeStatus(a, s)}>
                        <Text style={styles.actionText}>标记为{STATUS_LABEL[s].text}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => confirmDelete(a.id)}>
                      <Text style={[styles.actionText, { color: '#EF4444' }]}>删除</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#22C55E' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 6, marginTop: 8 },
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
  multiline: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  submitButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 12,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center' },
  toggleBtnActive: { backgroundColor: '#22C55E' },
  toggleText: { color: '#555', fontSize: 14, fontWeight: '600' },
  toggleTextActive: { color: '#fff' },
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 8 },
  badge: { fontSize: 13, fontWeight: 'bold' },
  disease: { fontSize: 13, color: '#22C55E', fontWeight: '600', marginBottom: 6 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  tag: { backgroundColor: '#f0fdf4', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagText: { fontSize: 11, color: '#166534' },
  meta: { fontSize: 12, color: '#999' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  detailText: { fontSize: 13, color: '#333', lineHeight: 20, marginBottom: 4 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 8 },
  actionText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});
