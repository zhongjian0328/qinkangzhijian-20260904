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
import { useFocusEffect, useRouter } from 'expo-router';
import { Batch, ProductionDashboard } from '@qinkang/types';
import { productionApi } from '../../src/api/production';

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  active: { text: '进行中', color: '#22C55E' },
  completed: { text: '已出栏', color: '#3B82F6' },
  archived: { text: '已归档', color: '#999' },
};

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export default function ProductionScreen() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ProductionDashboard | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [batchNo, setBatchNo] = useState('');
  const [breed, setBreed] = useState('');
  const [quantity, setQuantity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, b] = await Promise.all([
        productionApi.dashboard(),
        productionApi.listBatches(),
      ]);
      setDashboard(d);
      setBatches(b);
    } catch {
      setDashboard(null);
      setBatches([]);
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
    if (!batchNo.trim()) {
      Alert.alert('提示', '请填写批次号');
      return;
    }
    if (!breed.trim()) {
      Alert.alert('提示', '请填写品种');
      return;
    }
    const qty = parseInt(quantity, 10);
    if (!quantity || Number.isNaN(qty) || qty <= 0) {
      Alert.alert('提示', '请填写正确的批次数量');
      return;
    }

    setSaving(true);
    try {
      await productionApi.createBatch({
        batchNo: batchNo.trim(),
        breed: breed.trim(),
        quantity: qty,
        startDate: startDate.trim() || new Date().toISOString(),
        notes: notes.trim() || null,
      });
      setBatchNo('');
      setBreed('');
      setQuantity('');
      setStartDate('');
      setNotes('');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('创建失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>生产管理</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm((v) => !v)}
        >
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 新建批次'}</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>新建批次</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="批次号（如 P202609）"
              value={batchNo}
              onChangeText={setBatchNo}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="品种（如 白羽肉鸡）"
              value={breed}
              onChangeText={setBreed}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="数量（只）"
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="开始日期（默认今天）"
              value={startDate}
              onChangeText={setStartDate}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="备注（选填）"
            value={notes}
            onChangeText={setNotes}
          />
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitDisabled]}
            onPress={submit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>保存批次</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : null}

      {dashboard ? (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{dashboard.activeBatches}</Text>
            <Text style={styles.statLabel}>活跃批次</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fmt(dashboard.totalQuantity)}</Text>
            <Text style={styles.statLabel}>存栏总数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, styles.statWarn]}>
              {dashboard.cumulativeDeaths + dashboard.cumulativeCulls}
            </Text>
            <Text style={styles.statLabel}>累计死淘</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{fmt(dashboard.cumulativeEggs)}</Text>
            <Text style={styles.statLabel}>累计产蛋</Text>
          </View>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>批次列表</Text>
      {batches.length === 0 ? (
        <Text style={styles.empty}>暂无批次，点击右上角新建</Text>
      ) : (
        batches.map((b) => {
          const status = STATUS_LABEL[b.status] ?? STATUS_LABEL.active;
          return (
            <TouchableOpacity
              key={b.id}
              style={styles.card}
              onPress={() => router.push(`/production/${b.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.batchNo}>{b.batchNo}</Text>
                <Text style={[styles.statusTag, { color: status.color }]}>{status.text}</Text>
              </View>
              <Text style={styles.meta}>
                {b.breed} · 数量 {b.quantity} 只 · 开始 {b.startDate.slice(0, 10)}
              </Text>
              <Text style={styles.enter}>查看每日记录 ›</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#22C55E' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#111' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    color: '#333',
  },
  row: { flexDirection: 'row', gap: 12 },
  rowInput: { flex: 1 },
  submitButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loading: { marginTop: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  statValue: { fontSize: 26, fontWeight: 'bold', color: '#22C55E' },
  statWarn: { color: '#F59E0B' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  empty: { color: '#999', textAlign: 'center', marginTop: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  batchNo: { fontSize: 16, fontWeight: 'bold', color: '#111', flex: 1 },
  statusTag: { fontSize: 13, fontWeight: 'bold', marginLeft: 8 },
  meta: { fontSize: 13, color: '#666' },
  enter: { fontSize: 13, color: '#22C55E', marginTop: 8, fontWeight: '600' },
});
