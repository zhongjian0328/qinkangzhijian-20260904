import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ProductionDashboard, PoultryHouse } from '@qinkang/types';
import { productionApi } from '../../src/api/production';
import { houseApi } from '../../src/api/house';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function DataTab() {
  const router = useRouter();
  const [dash, setDash] = useState<ProductionDashboard | null>(null);
  const [houses, setHouses] = useState<PoultryHouse[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, h] = await Promise.all([productionApi.dashboard(), houseApi.list()]);
      setDash(d);
      setHouses(h);
    } catch {
      setDash(null);
      setHouses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const houseCurrent = houses.reduce((s, h) => s + (h.currentCount ?? 0), 0);
  const houseCapacity = houses.reduce((s, h) => s + h.capacity, 0);
  const deaths = dash ? dash.cumulativeDeaths + dash.cumulativeCulls : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>数据看板</Text>
      <Text style={styles.sub}>多场数据聚合 · 生产 · 经营分析</Text>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{dash?.totalQuantity ?? 0}</Text>
              <Text style={styles.statLabel}>存栏总量（羽）</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{dash?.activeBatches ?? 0}</Text>
              <Text style={styles.statLabel}>在养批次</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{dash?.cumulativeEggs ?? 0}</Text>
              <Text style={styles.statLabel}>累计产蛋（枚）</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: '#EF4444' }]}>{deaths}</Text>
              <Text style={styles.statLabel}>累计死淘（羽）</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>禽舍概览</Text>
              <TouchableOpacity onPress={() => router.push('/houses')}>
                <Text style={styles.link}>管理 ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.houseRow}>
              <View style={styles.houseCell}>
                <Text style={styles.houseNum}>{houses.length}</Text>
                <Text style={styles.houseLabel}>禽舍数</Text>
              </View>
              <View style={styles.houseCell}>
                <Text style={styles.houseNum}>{houseCurrent}</Text>
                <Text style={styles.houseLabel}>当前存栏</Text>
              </View>
              <View style={styles.houseCell}>
                <Text style={styles.houseNum}>{houseCapacity}</Text>
                <Text style={styles.houseLabel}>总容量</Text>
              </View>
              <View style={styles.houseCell}>
                <Text style={styles.houseNum}>
                  {houseCapacity > 0 ? Math.round((houseCurrent / houseCapacity) * 100) : 0}%
                </Text>
                <Text style={styles.houseLabel}>存栏率</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最近生产记录</Text>
              <TouchableOpacity onPress={() => router.push('/production')}>
                <Text style={styles.link}>生产管理 ›</Text>
              </TouchableOpacity>
            </View>
            {(dash?.latestRecords?.length ?? 0) === 0 ? (
              <Text style={styles.empty}>暂无生产记录，去「生产管理」录入</Text>
            ) : (
              dash!.latestRecords.map(({ batchNo, record }) => (
                <View key={record.id} style={styles.recordRow}>
                  <View style={styles.recordLeft}>
                    <Text style={styles.recordBatch}>{batchNo}</Text>
                    <Text style={styles.recordDate}>{formatDate(record.recordDate)}</Text>
                  </View>
                  <View style={styles.recordMetrics}>
                    <Text style={styles.recordMetric}>产蛋 {record.eggCount}</Text>
                    <Text style={styles.recordMetric}>死淘 {record.deathCount + record.cullCount}</Text>
                    <Text style={styles.recordMetric}>耗料 {record.feedAmount}kg</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <TouchableOpacity style={styles.entryBtn} onPress={() => router.push('/production')}>
            <Text style={styles.entryText}>进入生产管理（批次 / 日报）</Text>
            <Text style={styles.entryArrow}>›</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  loading: { marginTop: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  statNum: { fontSize: 26, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  link: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  houseRow: { flexDirection: 'row' },
  houseCell: { flex: 1, alignItems: 'center' },
  houseNum: { fontSize: 20, fontWeight: 'bold', color: '#111' },
  houseLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  empty: { color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  recordLeft: { flex: 1 },
  recordBatch: { fontSize: 14, fontWeight: '600', color: '#111' },
  recordDate: { fontSize: 12, color: '#999', marginTop: 2 },
  recordMetrics: { alignItems: 'flex-end', gap: 2 },
  recordMetric: { fontSize: 12, color: '#666' },
  entryBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 16,
    marginTop: 4,
  },
  entryText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  entryArrow: { color: '#fff', fontSize: 20 },
});
