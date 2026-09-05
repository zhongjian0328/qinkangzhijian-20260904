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
import { Batch, DailyRecord } from '@qinkang/types';
import { productionApi } from '../../src/api/production';

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function BatchDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const batchId = Array.isArray(id) ? id[0] : id;

  const [batch, setBatch] = useState<Batch | null>(null);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [recordDate, setRecordDate] = useState('');
  const [deathCount, setDeathCount] = useState('');
  const [cullCount, setCullCount] = useState('');
  const [feedAmount, setFeedAmount] = useState('');
  const [waterAmount, setWaterAmount] = useState('');
  const [eggCount, setEggCount] = useState('');
  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const b = await productionApi.getBatch(batchId);
      setBatch(b);
      setRecords(b.dailyRecords ?? []);
    } catch {
      setBatch(null);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const numOr = (v: string, fallback = 0) => {
    if (!v.trim()) return fallback;
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  const submit = async () => {
    if (!batchId) return;
    setSaving(true);
    try {
      await productionApi.addRecord(batchId, {
        recordDate: recordDate.trim() || new Date().toISOString(),
        deathCount: numOr(deathCount),
        cullCount: numOr(cullCount),
        feedAmount: numOr(feedAmount),
        waterAmount: numOr(waterAmount),
        eggCount: numOr(eggCount),
        temperature: temperature.trim() ? numOr(temperature) : null,
        humidity: humidity.trim() ? numOr(humidity) : null,
        notes: notes.trim() || null,
      });
      setRecordDate('');
      setDeathCount('');
      setCullCount('');
      setFeedAmount('');
      setWaterAmount('');
      setEggCount('');
      setTemperature('');
      setHumidity('');
      setNotes('');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('录入失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const removeRecord = (r: DailyRecord) => {
    Alert.alert('删除记录', `确定删除 ${formatDate(r.recordDate)} 的记录吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await productionApi.removeRecord(r.id);
            await load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }

  if (!batch) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>批次不存在或已删除</Text>
      </View>
    );
  }

  const totalDeaths = records.reduce((s, r) => s + r.deathCount + r.cullCount, 0);
  const totalFeed = records.reduce((s, r) => s + r.feedAmount, 0);
  const totalEggs = records.reduce((s, r) => s + r.eggCount, 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{batch.batchNo}</Text>
        <Text style={styles.sub}>
          {batch.breed} · 数量 {batch.quantity} 只 · 开始 {batch.startDate.slice(0, 10)}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalDeaths}</Text>
          <Text style={styles.statLabel}>累计死淘</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{fmt(totalFeed)}</Text>
          <Text style={styles.statLabel}>累计耗料(kg)</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{totalEggs}</Text>
          <Text style={styles.statLabel}>累计产蛋</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>每日记录</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm((v) => !v)}
        >
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 录入'}</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="记录日期（默认今天）"
            value={recordDate}
            onChangeText={setRecordDate}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="死亡数"
              keyboardType="number-pad"
              value={deathCount}
              onChangeText={setDeathCount}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="淘汰数"
              keyboardType="number-pad"
              value={cullCount}
              onChangeText={setCullCount}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="耗料 kg"
              keyboardType="decimal-pad"
              value={feedAmount}
              onChangeText={setFeedAmount}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="饮水 L"
              keyboardType="decimal-pad"
              value={waterAmount}
              onChangeText={setWaterAmount}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="产蛋数"
              keyboardType="number-pad"
              value={eggCount}
              onChangeText={setEggCount}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="温度 ℃（选填）"
              keyboardType="numeric"
              value={temperature}
              onChangeText={setTemperature}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="湿度 %（选填）"
            keyboardType="numeric"
            value={humidity}
            onChangeText={setHumidity}
          />
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
              <Text style={styles.submitText}>保存记录</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {records.length === 0 ? (
        <Text style={styles.empty}>暂无每日记录，点击右上角录入</Text>
      ) : (
        records.map((r) => (
          <View key={r.id} style={styles.recordCard}>
            <View style={styles.recordMain}>
              <Text style={styles.recordDate}>{formatDate(r.recordDate)}</Text>
              <Text style={styles.recordLine}>
                死 {r.deathCount} · 淘 {r.cullCount} · 料 {fmt(r.feedAmount)}kg · 蛋 {r.eggCount}
              </Text>
              {r.waterAmount > 0 || r.temperature != null || r.humidity != null ? (
                <Text style={styles.recordExtra}>
                  水 {fmt(r.waterAmount)}L
                  {r.temperature != null ? ` · ${r.temperature}℃` : ''}
                  {r.humidity != null ? ` · ${r.humidity}%` : ''}
                </Text>
              ) : null}
              {r.notes ? <Text style={styles.recordNotes}>{r.notes}</Text> : null}
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => removeRecord(r)}>
              <Text style={styles.deleteText}>删除</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
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
  sub: { fontSize: 14, color: '#666', marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4 },
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
  empty: { color: '#999', textAlign: 'center', marginTop: 20 },
  recordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  recordMain: { flex: 1, marginRight: 12 },
  recordDate: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  recordLine: { fontSize: 13, color: '#555', marginTop: 4 },
  recordExtra: { fontSize: 12, color: '#999', marginTop: 2 },
  recordNotes: { fontSize: 12, color: '#666', marginTop: 4 },
  deleteBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FEE2E2' },
  deleteText: { color: '#EF4444', fontWeight: 'bold', fontSize: 13 },
});
