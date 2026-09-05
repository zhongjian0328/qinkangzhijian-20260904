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
import { PoultryHouse, Alert as AlertItem, EnvironmentRecord } from '@qinkang/types';
import { houseApi } from '../../src/api/house';

const VENTILATION_OPTIONS: { value: string; label: string }[] = [
  { value: 'good', label: '良好' },
  { value: 'moderate', label: '一般' },
  { value: 'poor', label: '差' },
];

const VENTILATION_LABEL: Record<string, string> = {
  good: '良好',
  moderate: '一般',
  poor: '差',
};

const ALERT_TYPE_LABEL: Record<string, string> = {
  temperature: '温度',
  humidity: '湿度',
  ammonia: '氨气',
  co2: '二氧化碳',
  disease: '疾病',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HouseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const houseId = Array.isArray(id) ? id[0] : id;

  const [house, setHouse] = useState<PoultryHouse | null>(null);
  const [records, setRecords] = useState<EnvironmentRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [temperature, setTemperature] = useState('');
  const [humidity, setHumidity] = useState('');
  const [ammonia, setAmmonia] = useState('');
  const [co2, setCo2] = useState('');
  const [ventilation, setVentilation] = useState('good');

  const load = useCallback(async () => {
    if (!houseId) return;
    setLoading(true);
    try {
      const [h, env, als] = await Promise.all([
        houseApi.get(houseId),
        houseApi.getEnvironment(houseId),
        houseApi.getAlerts(houseId),
      ]);
      setHouse(h);
      setRecords(env);
      setAlerts(als);
    } catch {
      setHouse(null);
    } finally {
      setLoading(false);
    }
  }, [houseId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submitEnvironment = async () => {
    const temp = parseFloat(temperature);
    const hum = parseFloat(humidity);
    if (Number.isNaN(temp) || Number.isNaN(hum)) {
      Alert.alert('提示', '请填写温度和湿度');
      return;
    }
    const am = ammonia.trim() ? parseFloat(ammonia) : null;
    const c2 = co2.trim() ? parseFloat(co2) : null;

    setSaving(true);
    try {
      const res = await houseApi.addEnvironment(houseId!, {
        temperature: temp,
        humidity: hum,
        ammonia: am,
        co2: c2,
        ventilation,
      });
      setTemperature('');
      setHumidity('');
      setAmmonia('');
      setCo2('');
      setVentilation('good');
      setShowForm(false);
      await load();
      if (res.alerts?.length) {
        Alert.alert('录入成功', `已生成 ${res.alerts.length} 条环境告警，请查看告警列表。`);
      } else {
        Alert.alert('录入成功', '环境数据已保存');
      }
    } catch (e) {
      Alert.alert('录入失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const acknowledge = async (alertId: string) => {
    try {
      await houseApi.acknowledgeAlert(alertId);
      await load();
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }

  if (!house) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>禽舍不存在或已删除</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{house.name}</Text>
        <Text style={styles.sub}>
          存栏 {house.currentCount} / {house.capacity} 只 · 日龄 {house.age} 天
        </Text>
      </View>

      <TouchableOpacity
        style={styles.envTestEntry}
        onPress={() => router.push(`/environment/${houseId}`)}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.envTestTitle}>四类环境检测</Text>
          <Text style={styles.envTestDesc}>空气 · 水样 · 饲料 · 环境表面 检测录入与超标判定</Text>
        </View>
        <Text style={styles.envTestArrow}>›</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>环境数据</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm((v) => !v)}
        >
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 录入'}</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <View style={styles.formCard}>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="温度 ℃"
              keyboardType="numeric"
              value={temperature}
              onChangeText={setTemperature}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="湿度 %"
              keyboardType="numeric"
              value={humidity}
              onChangeText={setHumidity}
            />
          </View>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="氨气 mg/m³（选填）"
              keyboardType="numeric"
              value={ammonia}
              onChangeText={setAmmonia}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="CO₂ ppm（选填）"
              keyboardType="numeric"
              value={co2}
              onChangeText={setCo2}
            />
          </View>
          <Text style={styles.fieldLabel}>通风状态</Text>
          <View style={styles.speciesRow}>
            {VENTILATION_OPTIONS.map((opt) => {
              const active = ventilation === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setVentilation(opt.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitDisabled]}
            onPress={submitEnvironment}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>保存环境数据</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {records.length === 0 ? (
        <Text style={styles.empty}>暂无环境数据记录</Text>
      ) : (
        records.slice(0, 20).map((r) => (
          <View key={r.id} style={styles.recordRow}>
            <View>
              <Text style={styles.recordTemp}>
                {r.temperature}℃ · {r.humidity}%
              </Text>
              {r.ammonia != null || r.co2 != null ? (
                <Text style={styles.recordExtra}>
                  氨气 {r.ammonia ?? '—'} · CO₂ {r.co2 ?? '—'}
                </Text>
              ) : null}
            </View>
            <View style={styles.recordRight}>
              <Text style={styles.recordVent}>{VENTILATION_LABEL[r.ventilation] ?? r.ventilation}</Text>
              <Text style={styles.recordTime}>{formatDate(r.timestamp)}</Text>
            </View>
          </View>
        ))
      )}

      <Text style={styles.sectionTitle}>告警</Text>
      {alerts.length === 0 ? (
        <Text style={styles.empty}>暂无告警</Text>
      ) : (
        alerts.map((a) => (
          <View key={a.id} style={styles.alertCard}>
            <View style={styles.alertMain}>
              <Text style={styles.alertType}>
                {ALERT_TYPE_LABEL[a.type] ?? a.type} ·{' '}
                <Text style={{ color: a.severity === 'critical' ? '#EF4444' : '#F59E0B' }}>
                  {a.severity === 'critical' ? '危急' : '预警'}
                </Text>
              </Text>
              <Text style={styles.alertMsg}>{a.message}</Text>
              <Text style={styles.alertTime}>{formatDate(a.createdAt)}</Text>
            </View>
            {!a.acknowledged ? (
              <TouchableOpacity style={styles.ackBtn} onPress={() => acknowledge(a.id)}>
                <Text style={styles.ackText}>确认</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.acked}>已处理</Text>
            )}
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
  header: { marginBottom: 20 },
  back: { fontSize: 15, color: '#22C55E', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 14, color: '#666', marginTop: 4 },
  envTestEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  envTestTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  envTestDesc: { fontSize: 12, color: '#999', marginTop: 4 },
  envTestArrow: { fontSize: 20, color: '#22C55E', marginLeft: 8 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 12 },
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
  fieldLabel: { fontSize: 13, color: '#666', marginBottom: 8 },
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
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
  empty: { color: '#999', textAlign: 'center', marginTop: 20, marginBottom: 8 },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  recordTemp: { fontSize: 15, fontWeight: '600', color: '#111' },
  recordExtra: { fontSize: 12, color: '#999', marginTop: 4 },
  recordRight: { alignItems: 'flex-end' },
  recordVent: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  recordTime: { fontSize: 12, color: '#999', marginTop: 4 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  alertMain: { flex: 1, marginRight: 12 },
  alertType: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  alertMsg: { fontSize: 13, color: '#555', marginTop: 4 },
  alertTime: { fontSize: 12, color: '#999', marginTop: 4 },
  ackBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#22C55E',
  },
  ackText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  acked: { fontSize: 13, color: '#999' },
});