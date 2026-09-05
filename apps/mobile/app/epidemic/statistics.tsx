import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { epidemicApi, EpidemicStatistics } from '../../src/api/epidemic';

const LEVEL_LABEL: Record<string, { text: string; color: string }> = {
  suspected: { text: '疑似', color: '#F59E0B' },
  confirmed: { text: '确诊', color: '#EF4444' },
  controlled: { text: '已控制', color: '#22C55E' },
};

export default function EpidemicStatisticsScreen() {
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>区域疫情统计</Text>
        <Text style={styles.sub}>各地上报疫情趋势（匿名聚合）</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : !stats ? (
        <Text style={styles.empty}>暂无统计数据</Text>
      ) : (
        <>
          <View style={styles.totalCard}>
            <View style={styles.totalItem}>
              <Text style={styles.totalNum}>{stats.total.count}</Text>
              <Text style={styles.totalLabel}>上报总数</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalNum}>{stats.total.affected}</Text>
              <Text style={styles.totalLabel}>累计发病（羽）</Text>
            </View>
            <View style={styles.totalItem}>
              <Text style={styles.totalNum}>{stats.total.death}</Text>
              <Text style={styles.totalLabel}>累计死亡（羽）</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>按疫情级别</Text>
          {stats.byLevel.length === 0 ? (
            <Text style={styles.emptySmall}>暂无数据</Text>
          ) : (
            stats.byLevel.map((g) => {
              const lv = LEVEL_LABEL[g.level] ?? { text: g.level, color: '#999' };
              return (
                <View key={g.level} style={styles.rowCard}>
                  <Text style={[styles.rowName, { color: lv.color }]}>{lv.text}</Text>
                  <Text style={styles.rowMeta}>上报 {g.count} 起 · 发病 {g.affected} · 死亡 {g.death}</Text>
                </View>
              );
            })
          )}

          <Text style={styles.sectionTitle}>按疾病分布</Text>
          {stats.byDisease.length === 0 ? (
            <Text style={styles.emptySmall}>暂无数据</Text>
          ) : (
            stats.byDisease.map((g) => (
              <View key={g.disease} style={styles.rowCard}>
                <Text style={styles.rowName}>{g.disease}</Text>
                <Text style={styles.rowMeta}>上报 {g.count} 起 · 发病 {g.affected} · 死亡 {g.death}</Text>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>按地区分布</Text>
          {stats.byRegion.length === 0 ? (
            <Text style={styles.emptySmall}>暂无数据</Text>
          ) : (
            stats.byRegion.map((g) => (
              <View key={g.city ?? 'unknown'} style={styles.rowCard}>
                <Text style={styles.rowName}>{g.city ?? '未知城市'}</Text>
                <Text style={styles.rowMeta}>上报 {g.count} 起 · 发病 {g.affected} · 死亡 {g.death}</Text>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 20 },
  back: { fontSize: 15, color: '#22C55E', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4 },
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
  emptySmall: { color: '#999', fontSize: 13, marginBottom: 8 },
  totalCard: {
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  totalItem: { flex: 1, alignItems: 'center' },
  totalNum: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  totalLabel: { fontSize: 11, color: '#e0ffe0', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 8, marginBottom: 10 },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  rowName: { fontSize: 14, fontWeight: '600', color: '#111', flex: 1 },
  rowMeta: { fontSize: 12, color: '#666' },
});