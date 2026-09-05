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
import { EpidemicAlert, EpidemicAlertLevel } from '@qinkang/types';
import { epidemicAlertApi, EpidemicAlertStats } from '../src/api/epidemic-alert';

const LEVEL_LABEL: Record<EpidemicAlertLevel, { text: string; color: string }> = {
  general: { text: '一般', color: '#22C55E' },
  major: { text: '较大', color: '#F59E0B' },
  severe: { text: '重大', color: '#EF4444' },
};
const LEVELS: EpidemicAlertLevel[] = ['general', 'major', 'severe'];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function EpidemicAlertScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<EpidemicAlertStats>({ total: 0, active: 0, resolved: 0, severe: 0, major: 0, general: 0 });
  const [list, setList] = useState<EpidemicAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [disease, setDisease] = useState('');
  const [level, setLevel] = useState<EpidemicAlertLevel>('general');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([epidemicAlertApi.stats(), epidemicAlertApi.list()]);
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

  const resetForm = () => {
    setTitle('');
    setDisease('');
    setLevel('general');
    setProvince('');
    setCity('');
    setDistrict('');
    setContent('');
    setAudience('');
  };

  const submit = async () => {
    if (!title.trim() || !disease.trim() || !content.trim()) {
      return Alert.alert('提示', '请填写标题、病种和内容');
    }
    setSaving(true);
    try {
      await epidemicAlertApi.create({
        title: title.trim(),
        disease: disease.trim(),
        level,
        province: province.trim() || undefined,
        city: city.trim() || undefined,
        district: district.trim() || undefined,
        content: content.trim(),
        audience: audience.trim() ? audience.split(/[,，\s]+/).filter(Boolean) : [],
      });
      resetForm();
      setShowForm(false);
      await load();
      Alert.alert('发布成功', '已定向推送预警通知给相关角色');
    } catch (e) {
      Alert.alert('发布失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const resolve = async (item: EpidemicAlert) => {
    try {
      await epidemicAlertApi.update(item.id, { status: item.status === 'active' ? 'resolved' : 'active' });
      await load();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除预警', '确定删除该预警吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await epidemicAlertApi.remove(id);
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
        <Text style={styles.title}>预警发布</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 发布'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>疫情分级预警 · 定向推送</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>总预警</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#F59E0B' }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>生效中</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.severe}</Text>
          <Text style={styles.statLabel}>重大</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats.resolved}</Text>
          <Text style={styles.statLabel}>已解除</Text>
        </View>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>预警标题 *</Text>
          <TextInput style={styles.input} placeholder="如：达川区新城疫疫情预警" value={title} onChangeText={setTitle} />
          <Text style={styles.fieldLabel}>病种 *</Text>
          <TextInput style={styles.input} placeholder="如：新城疫" value={disease} onChangeText={setDisease} />
          <Text style={styles.fieldLabel}>预警分级</Text>
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
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="省" value={province} onChangeText={setProvince} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="市" value={city} onChangeText={setCity} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="区县" value={district} onChangeText={setDistrict} />
          </View>
          <TextInput style={[styles.input, styles.multiline]} placeholder="预警内容（风险说明、防控要求…）*" multiline value={content} onChangeText={setContent} />
          <Text style={styles.fieldLabel}>推送角色（逗号分隔，留空=全体）</Text>
          <TextInput style={styles.input} placeholder="如：farmer,vet（留空推全体）" value={audience} onChangeText={setAudience} />
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>发布预警</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : list.length === 0 ? (
        <Text style={styles.empty}>暂无预警记录</Text>
      ) : (
        list.map((item) => {
          const lv = LEVEL_LABEL[item.level] ?? LEVEL_LABEL.general;
          const open = expanded === item.id;
          return (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(open ? null : item.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.farm}>{item.disease}</Text>
                  </View>
                  <Text style={[styles.badge, { color: lv.color }]}>{lv.text}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{formatDate(item.createdAt)}</Text>
                  <Text style={[styles.meta, { color: item.status === 'active' ? '#F59E0B' : '#22C55E' }]}>
                    {item.status === 'active' ? '生效中' : '已解除'}
                  </Text>
                </View>
              </TouchableOpacity>
              {open && (
                <View style={styles.detail}>
                  {[item.province, item.city, item.district].filter(Boolean).length > 0 ? (
                    <Text style={styles.detailText}>区域：{[item.province, item.city, item.district].filter(Boolean).join(' ')}</Text>
                  ) : null}
                  <Text style={styles.detailText}>内容：{item.content}</Text>
                  <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => resolve(item)}>
                      <Text style={[styles.actionText, { color: '#F59E0B' }]}>
                        {item.status === 'active' ? '解除预警' : '重新生效'}
                      </Text>
                    </TouchableOpacity>
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
  multiline: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
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
  metaRow: { flexDirection: 'row', gap: 12 },
  meta: { fontSize: 12, color: '#999' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  detailText: { fontSize: 13, color: '#333', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  actionText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});
