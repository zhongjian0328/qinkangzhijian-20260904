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
import { Customer, CustomerLevel } from '@qinkang/types';
import { customerApi, CustomerStats } from '../../src/api/customer';

const LEVEL_LABEL: Record<string, { text: string; color: string }> = {
  vip: { text: '重点', color: '#EF4444' },
  regular: { text: '普通', color: '#22C55E' },
  potential: { text: '潜在', color: '#F59E0B' },
};
const LEVELS: CustomerLevel[] = ['vip', 'regular', 'potential'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function CustomersTab() {
  const [stats, setStats] = useState<CustomerStats>({ total: 0, vip: 0, regular: 0, potential: 0, dueCount: 0 });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [farmName, setFarmName] = useState('');
  const [species, setSpecies] = useState('');
  const [scale, setScale] = useState('');
  const [address, setAddress] = useState('');
  const [level, setLevel] = useState<CustomerLevel>('regular');
  const [notes, setNotes] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([customerApi.stats(), customerApi.list()]);
      setStats(s);
      setCustomers(c);
    } catch {
      setCustomers([]);
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
    if (!name.trim()) return Alert.alert('提示', '请填写客户姓名');
    setSaving(true);
    try {
      await customerApi.create({
        name: name.trim(),
        phone: phone.trim() || undefined,
        farmName: farmName.trim() || undefined,
        species: species.trim() || undefined,
        scale: scale.trim() ? parseInt(scale, 10) : undefined,
        address: address.trim() || undefined,
        level,
        notes: notes.trim() || undefined,
        nextFollowUpAt: nextFollowUpAt.trim() || null,
      });
      setName('');
      setPhone('');
      setFarmName('');
      setSpecies('');
      setScale('');
      setAddress('');
      setLevel('regular');
      setNotes('');
      setNextFollowUpAt('');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('新增失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const changeLevel = async (c: Customer, next: CustomerLevel) => {
    try {
      await customerApi.update(c.id, { level: next });
      await load();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除客户', '确定删除该客户档案吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await customerApi.remove(id);
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
        <Text style={styles.title}>客户管理</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 新增客户'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>客户档案 · 分层管理 · 跟进提醒</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>客户总数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.vip}</Text>
          <Text style={styles.statLabel}>重点</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.regular}</Text>
          <Text style={styles.statLabel}>普通</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.dueCount}</Text>
          <Text style={styles.statLabel}>待跟进</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>客户姓名 *</Text>
          <TextInput style={styles.input} placeholder="如：张老板" value={name} onChangeText={setName} />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="联系电话" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="养殖场名称" value={farmName} onChangeText={setFarmName} />
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="禽种（如蛋鸡）" value={species} onChangeText={setSpecies} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="规模（羽）" keyboardType="number-pad" value={scale} onChangeText={setScale} />
          </View>
          <TextInput style={styles.input} placeholder="地址" value={address} onChangeText={setAddress} />
          <Text style={styles.fieldLabel}>客户分层</Text>
          <View style={styles.chipRow}>
            {LEVELS.map((l) => {
              const active = level === l;
              return (
                <TouchableOpacity key={l} style={[styles.chip, active && styles.chipActive]} onPress={() => setLevel(l)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{LEVEL_LABEL[l].text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.fieldLabel}>下次跟进日期（选填，YYYY-MM-DD）</Text>
          <TextInput style={styles.input} placeholder="如：2026-09-12" value={nextFollowUpAt} onChangeText={setNextFollowUpAt} />
          <Text style={styles.fieldLabel}>备注</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="客户偏好、合作记录……" multiline value={notes} onChangeText={setNotes} />
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>保存客户</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : customers.length === 0 ? (
        <Text style={styles.empty}>暂无客户，点击右上角新增</Text>
      ) : (
        customers.map((c) => {
          const lv = LEVEL_LABEL[c.level] ?? LEVEL_LABEL.regular;
          const open = expanded === c.id;
          const overdue = c.nextFollowUpAt && new Date(c.nextFollowUpAt).getTime() <= Date.now();
          return (
            <View key={c.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(open ? null : c.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.cardTitle}>{c.name}</Text>
                    {c.farmName ? <Text style={styles.farm}>{c.farmName}</Text> : null}
                  </View>
                  <Text style={[styles.badge, { color: lv.color }]}>{lv.text}</Text>
                </View>
                <View style={styles.metaRow}>
                  {c.phone ? <Text style={styles.meta}>{c.phone}</Text> : null}
                  {c.species ? <Text style={styles.meta}>{c.species}{c.scale ? ` · ${c.scale}羽` : ''}</Text> : null}
                </View>
                {c.nextFollowUpAt && (
                  <Text style={[styles.followup, overdue && styles.followupOverdue]}>
                    {overdue ? '🔔 待跟进 · ' : '下次跟进 · '}{formatDate(c.nextFollowUpAt)}
                  </Text>
                )}
              </TouchableOpacity>
              {open && (
                <View style={styles.detail}>
                  {c.address ? <Text style={styles.detailText}>地址：{c.address}</Text> : null}
                  {c.notes ? <Text style={styles.detailText}>备注：{c.notes}</Text> : null}
                  <View style={styles.actionRow}>
                    {LEVELS.filter((l) => l !== c.level).map((l) => (
                      <TouchableOpacity key={l} onPress={() => changeLevel(c, l)}>
                        <Text style={styles.actionText}>设为{LEVEL_LABEL[l].text}</Text>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity onPress={() => confirmDelete(c.id)}>
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
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  multiline: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
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
  nameWrap: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  farm: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { fontSize: 13, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  meta: { fontSize: 12, color: '#999' },
  followup: { fontSize: 12, color: '#666', marginTop: 4 },
  followupOverdue: { color: '#EF4444', fontWeight: '600' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  detailText: { fontSize: 13, color: '#333', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  actionText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});