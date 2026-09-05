import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { bulkPurchaseApi } from '../src/api/bulk-purchase';
import { BulkPurchase } from '@qinkang/types';

const STATUS_LABEL: Record<string, string> = {
  open: '报价中',
  awarded: '已定标',
  completed: '已完成',
  cancelled: '已取消',
};
const STATUS_COLOR: Record<string, string> = {
  open: '#F59E0B',
  awarded: '#22C55E',
  completed: '#3B82F6',
  cancelled: '#9CA3AF',
};

export default function BulkPurchaseScreen() {
  const router = useRouter();
  const [list, setList] = useState<BulkPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await bulkPurchaseApi.list());
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>大宗采购</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/bulk-purchase/new')}>
            <Text style={styles.addText}>+ 发布询价</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>暂无询价单，点击右上角发布</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/bulk-purchase/${item.id}`)}>
              <View style={styles.cardTop}>
                <Text style={styles.bpTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? '#999' }]}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Text>
              </View>
              {(item.items as any[]).map((it, i) => (
                <Text key={i} style={styles.itemLine}>{it.name} · {it.quantity} {it.spec ?? ''}</Text>
              ))}
              <Text style={styles.bidCount}>收到 {item.bids?.length ?? 0} 份报价</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  back: { fontSize: 16, color: '#22C55E', fontWeight: '600', marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  addBtn: { backgroundColor: '#22C55E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  loading: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bpTitle: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#111', marginRight: 8 },
  status: { fontSize: 13, fontWeight: 'bold' },
  itemLine: { fontSize: 13, color: '#666', paddingVertical: 2 },
  bidCount: { fontSize: 12, color: '#22C55E', marginTop: 8, fontWeight: '600' },
});
