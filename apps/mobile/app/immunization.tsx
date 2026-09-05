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
import { useRouter, useFocusEffect } from 'expo-router';
import { Immunization, ImmunizationMethod, ImmunizationStatus } from '@qinkang/types';
import { immunizationApi } from '../src/api/immunization';

const METHOD_LABEL: Record<string, string> = {
  injection: '注射',
  water: '饮水',
  drop_eye: '点眼',
  drop_nose: '滴鼻',
  spray: '喷雾',
  other: '其他',
};
const METHODS: ImmunizationMethod[] = ['injection', 'water', 'drop_eye', 'drop_nose', 'spray', 'other'];

const STATUS_LABEL: Record<ImmunizationStatus, { text: string; color: string }> = {
  planned: { text: '计划中', color: '#F59E0B' },
  completed: { text: '已完成', color: '#22C55E' },
  overdue: { text: '已逾期', color: '#EF4444' },
};

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ImmunizationScreen() {
  const router = useRouter();
  const [stats, setStats] = useState({ total: 0, planned: 0, completed: 0, overdue: 0, dueSoon: 0 });
  const [reminders, setReminders] = useState<{ overdue: Immunization[]; dueSoon: Immunization[] }>({
    overdue: [],
    dueSoon: [],
  });
  const [list, setList] = useState<Immunization[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [vaccineName, setVaccineName] = useState('');
  const [disease, setDisease] = useState('');
  const [method, setMethod] = useState<ImmunizationMethod>('injection');
  const [dosage, setDosage] = useState('');
  const [immunizedCount, setImmunizedCount] = useState('');
  const [administeredAt, setAdministeredAt] = useState('');
  const [nextDueAt, setNextDueAt] = useState('');
  const [operator, setOperator] = useState('');
  const [vaccineBatch, setVaccineBatch] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, r, l] = await Promise.all([
        immunizationApi.stats(),
        immunizationApi.reminders(),
        immunizationApi.list(),
      ]);
      setStats(s);
      setReminders(r);
      setList(l);
    } catch {
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const resetForm = () => {
    setVaccineName('');
    setDisease('');
    setMethod('injection');
    setDosage('');
    setImmunizedCount('');
    setAdministeredAt('');
    setNextDueAt('');
    setOperator('');
    setVaccineBatch('');
    setManufacturer('');
    setNotes('');
  };

  const submit = async () => {
    if (!vaccineName.trim()) return Alert.alert('提示', '请填写疫苗名称');
    setSaving(true);
    try {
      await immunizationApi.create({
        vaccineName: vaccineName.trim(),
        disease: disease.trim() || undefined,
        method,
        dosage: dosage.trim() || undefined,
        immunizedCount: immunizedCount.trim() ? parseInt(immunizedCount, 10) : 0,
        administeredAt: administeredAt.trim() || null,
        nextDueAt: nextDueAt.trim() || null,
        operator: operator.trim() || undefined,
        vaccineBatch: vaccineBatch.trim() || undefined,
        manufacturer: manufacturer.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      resetForm();
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('新增失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (item: Immunization, next: ImmunizationStatus) => {
    try {
      await immunizationApi.update(item.id, { status: next, administeredAt: next === 'completed' ? new Date().toISOString() : item.administeredAt });
      await load();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除免疫记录', '确定删除该记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await immunizationApi.remove(id);
            await load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  const renderReminder = (item: Immunization, overdue: boolean) => (
    <View key={item.id} style={[styles.reminderCard, overdue && styles.reminderOverdue]}>
      <Text style={styles.reminderTitle}>{item.vaccineName}</Text>
      <Text style={styles.reminderMeta}>
        {item.disease ? `${item.disease} · ` : ''}
        {overdue ? '已逾期' : '即将到期'} · {formatDate(item.nextDueAt)}
      </Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>免疫记录</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 新增'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>疫苗接种记录 · 到期自动提醒</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>总记录</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.planned}</Text>
          <Text style={styles.statLabel}>计划中</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.completed}</Text>
          <Text style={styles.statLabel}>已完成</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.overdue + stats.dueSoon}</Text>
          <Text style={styles.statLabel}>待免疫</Text>
        </View>
      </View>

      {(reminders.overdue.length > 0 || reminders.dueSoon.length > 0) && (
        <View style={styles.reminderSection}>
          <Text style={styles.sectionTitle}>🔔 免疫提醒</Text>
          {reminders.overdue.map((r) => renderReminder(r, true))}
          {reminders.dueSoon.map((r) => renderReminder(r, false))}
        </View>
      )}

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>疫苗名称 *</Text>
          <TextInput style={styles.input} placeholder="如：新城疫活疫苗（LaSota株）" value={vaccineName} onChangeText={setVaccineName} />
          <TextInput style={styles.input} placeholder="预防疾病（如：新城疫）" value={disease} onChangeText={setDisease} />
          <Text style={styles.fieldLabel}>免疫方式</Text>
          <View style={styles.chipRow}>
            {METHODS.map((m) => {
              const active = method === m;
              return (
                <TouchableOpacity key={m} style={[styles.chip, active && styles.chipActive]} onPress={() => setMethod(m)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{METHOD_LABEL[m]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="剂量（如：1羽份）" value={dosage} onChangeText={setDosage} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="免疫数量（羽）" keyboardType="number-pad" value={immunizedCount} onChangeText={setImmunizedCount} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="免疫日期 YYYY-MM-DD" value={administeredAt} onChangeText={setAdministeredAt} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="下次免疫 YYYY-MM-DD" value={nextDueAt} onChangeText={setNextDueAt} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="操作人/兽医" value={operator} onChangeText={setOperator} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="疫苗批号" value={vaccineBatch} onChangeText={setVaccineBatch} />
          </View>
          <TextInput style={styles.input} placeholder="生产厂家" value={manufacturer} onChangeText={setManufacturer} />
          <TextInput style={[styles.input, styles.multiline]} placeholder="备注" multiline value={notes} onChangeText={setNotes} />
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>保存记录</Text>}
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>全部记录</Text>
      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>暂无免疫记录，点击右上角新增</Text>
      ) : (
        list.map((item) => {
          const st = STATUS_LABEL[item.status] ?? STATUS_LABEL.planned;
          const open = expanded === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(open ? null : item.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.cardTitle}>{item.vaccineName}</Text>
                    {item.disease ? <Text style={styles.farm}>{item.disease}</Text> : null}
                  </View>
                  <Text style={[styles.badge, { color: st.color }]}>{st.text}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{METHOD_LABEL[item.method] ?? '其他'}</Text>
                  {item.immunizedCount > 0 ? <Text style={styles.meta}>{item.immunizedCount}羽</Text> : null}
                  {item.nextDueAt ? <Text style={styles.meta}>下次 {formatDate(item.nextDueAt)}</Text> : null}
                </View>
              </TouchableOpacity>
              {open && (
                <View style={styles.detail}>
                  {item.administeredAt ? <Text style={styles.detailText}>免疫日期：{formatDate(item.administeredAt)}</Text> : null}
                  {item.dosage ? <Text style={styles.detailText}>剂量：{item.dosage}</Text> : null}
                  {item.operator ? <Text style={styles.detailText}>操作人：{item.operator}</Text> : null}
                  {item.vaccineBatch ? <Text style={styles.detailText}>疫苗批号：{item.vaccineBatch}</Text> : null}
                  {item.manufacturer ? <Text style={styles.detailText}>厂家：{item.manufacturer}</Text> : null}
                  {item.notes ? <Text style={styles.detailText}>备注：{item.notes}</Text> : null}
                  <View style={styles.actionRow}>
                    {item.status !== 'completed' && (
                      <TouchableOpacity onPress={() => changeStatus(item, 'completed')}>
                        <Text style={styles.actionText}>标记完成</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'planned' && (
                      <TouchableOpacity onPress={() => changeStatus(item, 'overdue')}>
                        <Text style={[styles.actionText, { color: '#F59E0B' }]}>标记逾期</Text>
                      </TouchableOpacity>
                    )}
                    {item.status === 'overdue' && (
                      <TouchableOpacity onPress={() => changeStatus(item, 'planned')}>
                        <Text style={[styles.actionText, { color: '#F59E0B' }]}>恢复计划</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => confirmDelete(item.id)}>
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
  content: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 14,
    backgroundColor: '#22C55E',
  },
  back: { color: '#fff', fontSize: 16, width: 64 },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  sub: { fontSize: 13, color: '#666', marginHorizontal: 16, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  reminderSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, marginTop: 4 },
  reminderCard: { backgroundColor: '#FFF7ED', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 4, borderLeftColor: '#F59E0B' },
  reminderOverdue: { backgroundColor: '#FEF2F2', borderLeftColor: '#EF4444' },
  reminderTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  reminderMeta: { fontSize: 12, color: '#666', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginTop: 16 },
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
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  multiline: { height: 70, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f0f0f0' },
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
  empty: { color: '#999', textAlign: 'center', marginTop: 20, paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, marginHorizontal: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nameWrap: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  farm: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { fontSize: 13, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  meta: { fontSize: 12, color: '#999' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  detailText: { fontSize: 13, color: '#333', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 8, flexWrap: 'wrap' },
  actionText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});
