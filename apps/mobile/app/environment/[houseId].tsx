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
import { EnvironmentTest, EnvironmentCategory } from '@qinkang/types';
import { environmentApi, CategorySpec } from '../../src/api/environment';

const CATEGORY_KEYS: EnvironmentCategory[] = ['air', 'water', 'feed', 'surface'];

const RESULT_LABEL: Record<string, { text: string; color: string }> = {
  normal: { text: '正常', color: '#22C55E' },
  warning: { text: '预警', color: '#F59E0B' },
  abnormal: { text: '异常', color: '#EF4444' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EnvironmentScreen() {
  const router = useRouter();
  const { houseId } = useLocalSearchParams<{ houseId: string }>();
  const hid = Array.isArray(houseId) ? houseId[0] : houseId;

  const [categories, setCategories] = useState<Record<string, CategorySpec>>({});
  const [category, setCategory] = useState<EnvironmentCategory>('air');
  const [records, setRecords] = useState<EnvironmentTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');

  const spec = categories[category];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, recs] = await Promise.all([
        environmentApi.categories(),
        environmentApi.list({ houseId: hid, category }),
      ]);
      setCategories(cats);
      setRecords(recs);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [hid, category]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submit = async () => {
    if (!spec) return;
    const metrics: Record<string, number | boolean> = {};
    for (const m of spec.metrics) {
      const raw = formValues[m.key];
      if (raw == null || raw === '') continue;
      if (m.type === 'boolean') {
        metrics[m.key] = raw === 'true';
      } else {
        const n = parseFloat(raw);
        if (Number.isNaN(n)) {
          Alert.alert('提示', `${m.label}数值不合法`);
          return;
        }
        metrics[m.key] = n;
      }
    }
    if (Object.keys(metrics).length === 0) {
      Alert.alert('提示', '请至少填写一项检测指标');
      return;
    }

    setSaving(true);
    try {
      const res = await environmentApi.create({
        houseId: hid ?? null,
        category,
        metrics,
        note: note.trim() || null,
      });
      setFormValues({});
      setNote('');
      setShowForm(false);
      await load();
      if (res.flagged?.length) {
        Alert.alert('录入成功', `检测结果：${RESULT_LABEL[res.test.result]?.text ?? res.test.result}，${res.flagged.length} 项指标超标。`);
      } else {
        Alert.alert('录入成功', '检测结果正常');
      }
    } catch (e) {
      Alert.alert('录入失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = (id: string) => {
    Alert.alert('删除记录', '确定删除该条检测记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await environmentApi.remove(id);
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>环境检测</Text>
        <Text style={styles.sub}>空气 · 水样 · 饲料 · 环境表面 四类检测</Text>
      </View>

      <View style={styles.categoryRow}>
        {CATEGORY_KEYS.map((k) => {
          const active = category === k;
          return (
            <TouchableOpacity
              key={k}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
              onPress={() => setCategory(k)}
            >
              <Text style={[styles.categoryText, active && styles.categoryTextActive]}>
                {categories[k]?.label ?? ({ air: '空气', water: '水样', feed: '饲料', surface: '表面' }[k])}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {spec ? <Text style={styles.specDesc}>{spec.description}</Text> : null}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>检测记录</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm((v) => !v)}
        >
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 录入检测'}</Text>
        </TouchableOpacity>
      </View>

      {showForm && spec ? (
        <View style={styles.formCard}>
          {spec.metrics.map((m) => (
            <View key={m.key} style={styles.metricRow}>
              <Text style={styles.metricLabel}>
                {m.label}
                {m.unit ? ` (${m.unit})` : ''}
                <Text style={styles.metricNormal}>  正常 {m.normalDesc}</Text>
              </Text>
              {m.type === 'boolean' ? (
                <View style={styles.boolRow}>
                  {[
                    { v: 'false', l: '正常/未检出' },
                    { v: 'true', l: '异常/检出' },
                  ].map((o) => {
                    const active = formValues[m.key] === o.v;
                    return (
                      <TouchableOpacity
                        key={o.v}
                        style={[styles.boolChip, active && styles.boolChipActive]}
                        onPress={() => setFormValues((p) => ({ ...p, [m.key]: o.v }))}
                      >
                        <Text style={[styles.boolText, active && styles.boolTextActive]}>{o.l}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <TextInput
                  style={styles.input}
                  placeholder={`${m.label}（${m.normalDesc}）`}
                  keyboardType="numeric"
                  value={formValues[m.key] ?? ''}
                  onChangeText={(t) => setFormValues((p) => ({ ...p, [m.key]: t }))}
                />
              )}
            </View>
          ))}
          <TextInput
            style={styles.input}
            placeholder="备注（选填）"
            value={note}
            onChangeText={setNote}
          />
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitDisabled]}
            onPress={submit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>保存检测结果</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : records.length === 0 ? (
        <Text style={styles.empty}>暂无检测记录</Text>
      ) : (
        records.map((r) => {
          const badges = RESULT_LABEL[r.result] ?? RESULT_LABEL.normal;
          const metricText = Object.entries(r.metrics ?? {})
            .map(([k, v]) => {
              const m = spec?.metrics.find((x) => x.key === k);
              return `${m?.label ?? k}: ${v}${m?.unit ?? ''}`;
            })
            .join(' · ');
          return (
            <View key={r.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={[styles.resultBadge, { color: badges.color }]}>{badges.text}</Text>
                <Text style={styles.recordTime}>{formatDate(r.createdAt)}</Text>
              </View>
              <Text style={styles.recordMetrics}>{metricText || '—'}</Text>
              {r.note ? <Text style={styles.recordNote}>备注：{r.note}</Text> : null}
              <TouchableOpacity style={styles.deleteBtn} onPress={() => removeRecord(r.id)}>
                <Text style={styles.deleteText}>删除</Text>
              </TouchableOpacity>
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
  header: { marginBottom: 16 },
  back: { fontSize: 15, color: '#22C55E', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  categoryChipActive: { backgroundColor: '#22C55E' },
  categoryText: { color: '#555', fontSize: 14 },
  categoryTextActive: { color: '#fff', fontWeight: 'bold' },
  specDesc: { fontSize: 12, color: '#999', marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#22C55E' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  metricRow: { marginBottom: 14 },
  metricLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 6 },
  metricNormal: { fontSize: 11, color: '#999', fontWeight: 'normal' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 4,
    color: '#333',
  },
  boolRow: { flexDirection: 'row', gap: 8 },
  boolChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  boolChipActive: { backgroundColor: '#EF4444' },
  boolText: { color: '#555', fontSize: 13 },
  boolTextActive: { color: '#fff', fontWeight: 'bold' },
  submitButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 8,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resultBadge: { fontSize: 14, fontWeight: 'bold' },
  recordTime: { fontSize: 12, color: '#999' },
  recordMetrics: { fontSize: 13, color: '#333', lineHeight: 20 },
  recordNote: { fontSize: 12, color: '#999', marginTop: 6 },
  deleteBtn: { alignSelf: 'flex-end', marginTop: 8, paddingVertical: 6, paddingHorizontal: 12 },
  deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});