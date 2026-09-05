import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { commerceApi } from '../../src/api/commerce';
import { Order } from '@qinkang/types';

const STATUS_LABEL: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};

export default function LogisticsScreen() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setOrder(await commerceApi.orders().then((list) => list.find((o) => o.id === orderId) ?? null));
    } catch {
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const logistics = order?.logistics ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>物流跟踪</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#22C55E" />
      ) : !order ? (
        <Text style={styles.empty}>订单不存在</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>{STATUS_LABEL[order.status] ?? order.status}</Text>
            <Text style={styles.statusDesc}>订单号 {order.id.slice(0, 8)}</Text>
          </View>

          <Text style={styles.sectionTitle}>物流轨迹</Text>
          {logistics.length === 0 ? (
            <Text style={styles.noLog}>暂无物流信息</Text>
          ) : (
            <View style={styles.timeline}>
              {logistics.map((ev, i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={[styles.dot, i === logistics.length - 1 && styles.dotActive]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>{ev.status}</Text>
                    <Text style={styles.timelineDesc}>{ev.desc}</Text>
                    <Text style={styles.timelineTime}>{new Date(ev.time).toLocaleString('zh-CN')}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>商品信息</Text>
          {(order.items as any[]).map((it, i) => (
            <View key={i} style={styles.goodsRow}>
              <Text style={styles.goodsName} numberOfLines={1}>{it.name}</Text>
              <Text style={styles.goodsQty}>x{it.quantity}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  back: { fontSize: 16, color: '#22C55E', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  statusCard: { backgroundColor: '#22C55E', borderRadius: 16, padding: 20, marginTop: 8 },
  statusTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statusDesc: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 18, marginBottom: 10 },
  noLog: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 16 },
  timeline: { backgroundColor: '#fff', borderRadius: 14, padding: 18 },
  timelineItem: { flexDirection: 'row', paddingBottom: 18 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#ddd', marginTop: 2, marginRight: 12 },
  dotActive: { backgroundColor: '#22C55E' },
  timelineContent: { flex: 1 },
  timelineTitle: { fontSize: 14, fontWeight: '600', color: '#111' },
  timelineDesc: { fontSize: 12, color: '#666', marginTop: 3 },
  timelineTime: { fontSize: 11, color: '#999', marginTop: 3 },
  goodsRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  goodsName: { flex: 1, fontSize: 14, color: '#111' },
  goodsQty: { fontSize: 14, color: '#666', fontWeight: '600' },
});
