import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { EpidemicRecord } from '@qinkang/types';
import { epidemicApi } from '../../src/api/epidemic';

const LEVEL_LABEL: Record<string, { text: string; color: string }> = {
  suspected: { text: '疑似', color: '#F59E0B' },
  confirmed: { text: '确诊', color: '#EF4444' },
  controlled: { text: '已控制', color: '#22C55E' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EpidemicListScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<EpidemicRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await epidemicApi.list());
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const confirmDelete = (id: string) => {
    Alert.alert('删除上报', '确定删除该条上报记录吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await epidemicApi.remove(id);
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
        <View style={styles.titleRow}>
          <Text style={styles.title}>我的疫情上报</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/epidemic/report')}
          >
            <Text style={styles.addButtonText}>+ 上报</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.statEntry}
        onPress={() => router.push('/epidemic/statistics')}
      >
        <View>
          <Text style={styles.statTitle}>区域疫情统计</Text>
          <Text style={styles.statDesc}>查看各地疫情分布与趋势</Text>
        </View>
        <Text style={styles.statArrow}>›</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : records.length === 0 ? (
        <Text style={styles.empty}>暂无上报记录</Text>
      ) : (
        records.map((r) => {
          const level = LEVEL_LABEL[r.level] ?? LEVEL_LABEL.suspected;
          return (
            <View key={r.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.disease}>{r.disease}</Text>
                <Text style={[styles.levelBadge, { color: level.color }]}>{level.text}</Text>
              </View>
              <Text style={styles.location}>{r.location}</Text>
              <Text style={styles.meta}>
                发病 {r.affectedCount} 羽 · 死亡 {r.deathCount} 羽
              </Text>
              {r.symptoms ? <Text style={styles.symptoms}>症状：{r.symptoms}</Text> : null}
              <View style={styles.cardFooter}>
                <Text style={styles.time}>{formatDate(r.createdAt)}</Text>
                <TouchableOpacity onPress={() => confirmDelete(r.id)}>
                  <Text style={styles.deleteText}>删除</Text>
                </TouchableOpacity>
              </View>
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
  header: { marginBottom: 16 },
  back: { fontSize: 15, color: '#22C55E', marginBottom: 8 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#22C55E' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  statDesc: { fontSize: 12, color: '#999', marginTop: 4 },
  statArrow: { fontSize: 20, color: '#22C55E' },
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  disease: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  levelBadge: { fontSize: 13, fontWeight: 'bold' },
  location: { fontSize: 13, color: '#666', marginBottom: 4 },
  meta: { fontSize: 13, color: '#333', marginBottom: 4 },
  symptoms: { fontSize: 12, color: '#999', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  time: { fontSize: 12, color: '#999' },
  deleteText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});