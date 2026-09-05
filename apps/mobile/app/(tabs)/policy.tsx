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
import { Policy, PolicyCategory } from '@qinkang/types';
import { policyApi } from '../../src/api/policy';
import { useAuthStore } from '../../src/store/auth';

const CATEGORIES: { value: PolicyCategory; label: string }[] = [
  { value: 'prevention_plan', label: '防控方案' },
  { value: 'immunization', label: '免疫计划' },
  { value: 'medication', label: '用药规范' },
  { value: 'notice', label: '通知公告' },
  { value: 'other', label: '其他' },
];
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
);
const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  draft: { text: '草稿', color: '#9CA3AF' },
  published: { text: '已发布', color: '#22C55E' },
  archived: { text: '已归档', color: '#6B7280' },
};
const AUDIENCE_OPTIONS = ['farmer', 'vet', 'technician', 'merchant', 'institution', 'student'];
const AUDIENCE_LABEL: Record<string, string> = {
  farmer: '养殖户',
  vet: '兽医',
  technician: '技术员',
  merchant: '商家',
  institution: '机构',
  student: '学生',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PolicyTab() {
  const user = useAuthStore((s) => s.user);
  const isInstitution = user?.role === 'institution' || user?.role === 'admin';

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<PolicyCategory>('notice');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPolicies(await policyApi.list());
    } catch {
      setPolicies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const toggleAudience = (r: string) => {
    setAudience((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const submit = async () => {
    if (!title.trim()) return Alert.alert('提示', '请填写政策标题');
    if (!content.trim()) return Alert.alert('提示', '请填写政策内容');
    setSaving(true);
    try {
      await policyApi.create({ title: title.trim(), category, content: content.trim(), audience });
      setTitle('');
      setContent('');
      setAudience([]);
      setCategory('notice');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('发布失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (p: Policy) => {
    setExpanded(expanded === p.id ? null : p.id);
    if (!isInstitution && !p.read) {
      try {
        await policyApi.markRead(p.id);
        await load();
      } catch {
        /* 忽略 */
      }
    }
  };

  const toggleStatus = async (p: Policy) => {
    const next = p.status === 'published' ? 'archived' : 'published';
    try {
      await policyApi.update(p.id, { status: next });
      await load();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除政策', '确定删除该政策吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await policyApi.remove(id);
            await load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{isInstitution ? '政策下发' : '政策通知'}</Text>
        {isInstitution && (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
            <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 发布政策'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.sub}>
        {isInstitution ? '发布防控方案 / 免疫计划 / 用药规范，跟踪已读情况' : '定向推送给您的政策文件'}
      </Text>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>政策标题 *</Text>
          <TextInput style={styles.input} placeholder="如：2026 年秋季禽流感防控方案" value={title} onChangeText={setTitle} />

          <Text style={styles.fieldLabel}>政策类别</Text>
          <View style={styles.chipRow}>
            {CATEGORIES.map((c) => {
              const active = category === c.value;
              return (
                <TouchableOpacity
                  key={c.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setCategory(c.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>定向推送角色（不选 = 全体）</Text>
          <View style={styles.chipRow}>
            {AUDIENCE_OPTIONS.map((r) => {
              const active = audience.includes(r);
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleAudience(r)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{AUDIENCE_LABEL[r]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>政策内容 *</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="政策正文、防控要求、执行要点……"
            multiline
            value={content}
            onChangeText={setContent}
          />

          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>发布</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : policies.length === 0 ? (
        <Text style={styles.empty}>{isInstitution ? '尚未发布政策' : '暂无收到的政策'}</Text>
      ) : (
        policies.map((p) => {
          const status = STATUS_LABEL[p.status] ?? STATUS_LABEL.published;
          const open = expanded === p.id;
          return (
            <View key={p.id} style={styles.card}>
              <TouchableOpacity onPress={() => openDetail(p)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>{p.title}</Text>
                  <Text style={[styles.badge, { color: status.color }]}>{status.text}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{CATEGORY_LABEL[p.category] ?? p.category}</Text>
                  <Text style={styles.meta}>{formatDate(p.createdAt)}</Text>
                </View>
                {isInstitution ? (
                  <Text style={styles.readCount}>已读 {p.readCount ?? 0} 人</Text>
                ) : (
                  <Text style={styles.readCount}>{p.read ? '已读' : '未读'}</Text>
                )}
              </TouchableOpacity>

              {open && (
                <View style={styles.detail}>
                  <Text style={styles.detailText}>{p.content}</Text>
                  {Array.isArray(p.audience) && p.audience.length > 0 && (
                    <Text style={styles.detailMeta}>
                      推送角色：{p.audience.map((r) => AUDIENCE_LABEL[r] ?? r).join('、')}
                    </Text>
                  )}
                  {isInstitution && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => toggleStatus(p)}>
                        <Text style={styles.actionText}>
                          {p.status === 'published' ? '归档' : '重新发布'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => confirmDelete(p.id)}>
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>删除</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  multiline: { height: 100, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
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
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', flex: 1, marginRight: 8 },
  badge: { fontSize: 13, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  meta: { fontSize: 12, color: '#999' },
  readCount: { fontSize: 12, color: '#666', marginTop: 4 },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  detailText: { fontSize: 13, color: '#333', lineHeight: 20 },
  detailMeta: { fontSize: 12, color: '#999', marginTop: 8 },
  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20, marginTop: 10 },
  actionText: { fontSize: 14, color: '#22C55E', fontWeight: '600' },
});
