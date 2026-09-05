import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { epidemicApi, EpidemicStatistics } from '../../src/api/epidemic';

const LEVEL_LABEL: Record<string, { text: string; color: string }> = {
  suspected: { text: '疑似', color: '#F59E0B' },
  confirmed: { text: '确诊', color: '#EF4444' },
  controlled: { text: '已控制', color: '#22C55E' },
};

function heatColor(affected: number): string {
  if (affected >= 5000) return '#B91C1C';
  if (affected >= 1000) return '#EF4444';
  if (affected >= 100) return '#F97316';
  if (affected >= 1) return '#FBBF24';
  return '#22C55E';
}

export default function MapTab() {
  const router = useRouter();
  const [stats, setStats] = useState<EpidemicStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStats(await epidemicApi.statistics());
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const regions = stats?.byRegion ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>疫情地图</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/epidemic/report')}>
          <Text style={styles.addButtonText}>+ 上报</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>全域疫情热力 · 区域分布 · 监测预警</Text>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : !stats ? (
        <Text style={styles.empty}>暂无疫情数据</Text>
      ) : (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{stats.total.count}</Text>
              <Text style={styles.statLabel}>上报总数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: '#EF4444' }]}>{stats.total.affected}</Text>
              <Text style={styles.statLabel}>发病（羽）</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNum, { color: '#B91C1C' }]}>{stats.total.death}</Text>
              <Text style={styles.statLabel}>死亡（羽）</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>疫情级别分布</Text>
            <View style={styles.levelRow}>
              {stats.byLevel.map((g) => {
                const lv = LEVEL_LABEL[g.level] ?? LEVEL_LABEL.suspected;
                return (
                  <View key={g.level} style={styles.levelCell}>
                    <Text style={[styles.levelCount, { color: lv.color }]}>{g.count}</Text>
                    <Text style={styles.levelLabel}>{lv.text}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>区域热力分布</Text>
              <TouchableOpacity onPress={() => router.push('/epidemic/statistics')}>
                <Text style={styles.link}>统计详情 ›</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.legend}>
              {[
                { c: '#22C55E', t: '无/低' },
                { c: '#FBBF24', t: '少量' },
                { c: '#F97316', t: '较多' },
                { c: '#EF4444', t: '严重' },
                { c: '#B91C1C', t: '极严重' },
              ].map((l) => (
                <View key={l.t} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: l.c }]} />
                  <Text style={styles.legendText}>{l.t}</Text>
                </View>
              ))}
            </View>

            {regions.length === 0 ? (
              <Text style={styles.emptySmall}>暂无区域数据</Text>
            ) : (
              <View style={styles.regionGrid}>
                {regions.map((r) => (
                  <View key={r.city ?? '未知'} style={[styles.regionCard, { borderLeftColor: heatColor(r.affected) }]}>
                    <Text style={styles.regionName}>{r.city ?? '未知地区'}</Text>
                    <Text style={styles.regionCount}>发病 {r.affected} · {r.count} 例</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>病种分布 TOP</Text>
            {(stats.byDisease.length === 0 ? [] : stats.byDisease.slice(0, 5)).map((d) => (
              <View key={d.disease} style={styles.diseaseRow}>
                <Text style={styles.diseaseName}>{d.disease}</Text>
                <Text style={styles.diseaseCount}>{d.count} 例 · 发病 {d.affected}</Text>
              </View>
            ))}
          </View>
        </>
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
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
  emptySmall: { color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 11, color: '#999', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 10 },
  link: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  levelRow: { flexDirection: 'row' },
  levelCell: { flex: 1, alignItems: 'center' },
  levelCount: { fontSize: 20, fontWeight: 'bold' },
  levelLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, color: '#666' },
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
  },
  regionName: { fontSize: 13, fontWeight: '600', color: '#111' },
  regionCount: { fontSize: 11, color: '#666', marginTop: 4 },
  diseaseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  diseaseName: { fontSize: 13, color: '#333' },
  diseaseCount: { fontSize: 12, color: '#999' },
});
