import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { commerceApi } from '../src/api/commerce';
import { CommissionSummary } from '@qinkang/types';

export default function CommissionsScreen() {
  const router = useRouter();
  const [data, setData] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await commerceApi.commissions());
    } catch {
      setData(null);
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
        <Text style={styles.title}>我的佣金</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color="#22C55E" />
      ) : !data ? (
        <Text style={styles.empty}>暂无佣金数据</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>¥{data.totalCommission.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>累计佣金</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>¥{data.settledCommission.toFixed(2)}</Text>
              <Text style={styles.summaryLabel}>已结算</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>佣金明细</Text>
          {data.orders.length === 0 && <Text style={styles.empty}>暂无佣金记录</Text>}
          {data.orders.map((o) => (
            <View key={o.orderId} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.orderId}>订单 {o.orderId.slice(0, 8)}</Text>
                <Text style={styles.commission}>+¥{o.commissionAmount?.toFixed(2)}</Text>
              </View>
              <Text style={styles.meta}>
                成交 ¥{o.totalAmount.toFixed(2)} · {o.status} · {new Date(o.createdAt).toLocaleDateString('zh-CN')}
              </Text>
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
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#22C55E', borderRadius: 16, padding: 20, marginTop: 8 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  summaryLabel: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  divider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.4)' },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 18, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  orderId: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  commission: { fontSize: 17, fontWeight: 'bold', color: '#EF4444' },
  meta: { fontSize: 12, color: '#999' },
});
