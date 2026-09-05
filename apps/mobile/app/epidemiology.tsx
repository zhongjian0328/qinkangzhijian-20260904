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
import { Epidemiology, EpidemiologyStatus } from '@qinkang/types';
import { epidemiologyApi, EpidemiologyStats } from '../src/api/epidemiology';

const STATUS_LABEL: Record<EpidemiologyStatus, { text: string; color: string }> = {
  investigating: { text: '调查中', color: '#F59E0B' },
  processing: { text: '处置中', color: '#F97316' },
  completed: { text: '已结案', color: '#22C55E' },
};
const STATUSES: EpidemiologyStatus[] = ['investigating', 'processing', 'completed'];
const MEASURE_OPTIONS = ['扑杀', '封锁', '消毒', '紧急免疫', '无害化处理', '移动管制'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EpidemiologyScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<EpidemiologyStats>({ total: 0, investigating: 0, processing: 0, completed: 0 });
  const [list, setList] = useState<Epidemiology[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [disease, setDisease] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [source, setSource] = useState('');
  const [transmissionChain, setTransmissionChain] = useState('');
  const [measures, setMeasures] = useState<string[]>([]);
  const [conclusion, setConclusion] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([epidemiologyApi.stats(), epidemiologyApi.list()]);
      setStats(s);
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

  const toggleMeasure = (m: string) => {
    setMeasures((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));
  };

  const resetForm = () => {
    setTitle('');
    setDisease('');
    setProvince('');
    setCity('');
    setDistrict('');
    setSource('');
    setTransmissionChain('');
    setMeasures([]);
    setConclusion('');
  };

  const submit = async () => {
    if (!title.trim() || !disease.trim()) return Alert.alert('提示', '请填写标题和病种');
    setSaving(true);
    try {
      await epidemiologyApi.create({
        title: title.trim(),
        disease: disease.trim(),
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        source: source.trim() || undefined,
        transmissionChain: transmissionChain.trim() || undefined,
        measures,
        conclusion: conclusion.trim() || undefined,
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

  const changeStatus = async (item: Epidemiology, next: EpidemiologyStatus) => {
    try {
      await epidemiologyApi.update(item.id, { status: next });
      await load();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除流调记录', '确定删除该记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await epidemiologyApi.remove(id);
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
        <Text style={styles.title}>流调记录</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 新增'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>流行病学调查 · 传播链分析</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>总数</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.investigating}</Text>
          <Text style={styles.statLabel}>调查中</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F97316' }]}>{stats.processing}</Text>
          <Text style={styles.statLabel}>处置中</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.completed}</Text>
          <Text style={styles.statLabel}>已结案</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>流调标题 *</Text>
          <TextInput style={styles.input} placeholder="如：达川区某养殖场禽流感流调" value={title} onChangeText={setTitle} />
          <Text style={styles.fieldLabel}>病种 *</Text>
          <TextInput style={styles.input} placeholder="如：禽流感" value={disease} onChangeText={setDisease} />
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="省" value={province} onChangeText={setProvince} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="市" value={city} onChangeText={setCity} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="区县" value={district} onChangeText={setDistrict} />
          </View>
          <TextInput style={styles.input} placeholder="传染源（引种/人员/车辆/野鸟…）" value={source} onChangeText={setSource} />
          <TextInput style={[styles.input, styles.multiline]} placeholder="传播链描述（场间传播路径…）" multiline value={transmissionChain} onChangeText={setTransmissionChain} />
          <Text style={styles.fieldLabel}>处置措施（可多选）</Text>
          <View style={styles.chipRow}>
            {MEASURE_OPTIONS.map((m) => {
              const active = measures.includes(m);
              return (
                <TouchableOpacity key={m} style={[styles.chip, active && styles.chipActive]} onPress={() => toggleMeasure(m)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput style={[styles.input, styles.multiline]} placeholder="调查结论" multiline value={conclusion} onChangeText={setConclusion} />
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>保存记录</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>暂无流调记录，点击右上角新增</Text>
      ) : (
        list.map((item) => {
          const st = STATUS_LABEL[item.status] ?? STATUS_LABEL.investigating;
          const open = expanded === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(open ? null : item.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.farm}>{item.disease}</Text>
                  </View>
                  <Text style={[styles.badge, { color: st.color }]}>{st.text}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
                  {[item.province, item.city, item.district].filter(Boolean).length > 0 ? (
                    <Text style={styles.meta}>{[item.province, item.city, item.district].filter(Boolean).join(' ')}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
              {open && (
                <View style={styles.detail}>
                  {item.source ? <Text style={styles.detailText}>传染源：{item.source}</Text> : null}
                  {item.transmissionChain ? <Text style={styles.detailText}>传播链：{item.transmissionChain}</Text> : null}
                  {item.measures.length > 0 ? <Text style={styles.detailText}>措施：{item.measures.join('、')}</Text> : null}
                  {item.conclusion ? <Text style={styles.detailText}>结论：{item.conclusion}</Text> : null}
                  <View style={styles.actionRow}>
                    {STATUSES.filter((s) => s !== item.status).map((s) => (
                      <TouchableOpacity key={s} onPress={() => changeStatus(item, s)}>
                        <Text style={styles.actionText}>转{STATUS_LABEL[s].text}</Text>
                      </TouchableOpacity>
                    ))}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, backgroundColor: '#22C55E' },
  back: { color: '#fff', fontSize: 16, width: 64 },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  sub: { fontSize: 13, color: '#666', marginHorizontal: 16, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginTop: 16 },
  fieldLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8, color: '#333', backgroundColor: '#fff' },
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  multiline: { height: 70, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  submitButton: { padding: 14, borderRadius: 10, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 12 },
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
