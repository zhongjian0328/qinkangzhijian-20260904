import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { merchantApi } from '../../src/api/merchant';
import { Order } from '@qinkang/types';

const STATUS_LABEL: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
};
const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  paid: '#22C55E',
  shipped: '#3B82F6',
  completed: '#22C55E',
  cancelled: '#9CA3AF',
};

export default function MerchantOrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await merchantApi.orders());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const ship = (o: Order) => {
    Alert.alert('发货', '确认发货？将更新物流状态。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认发货',
        onPress: async () => {
          try {
            await merchantApi.shipOrder(o.id, { logisticsCompany: '平台冷链', trackingNo: `YK${Date.now()}` });
            load();
          } catch (e) {
            Alert.alert('操作失败', e instanceof Error ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const refund = (o: Order) => {
    Alert.alert('退款/售后', '确认退款？订单将取消。', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认退款',
        style: 'destructive',
        onPress: async () => {
          try {
            await merchantApi.refundOrder(o.id, '商家主动退款');
            load();
          } catch (e) {
            Alert.alert('操作失败', e instanceof Error ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>订单管理</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>暂无订单</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.time}>{new Date(item.createdAt).toLocaleString('zh-CN')}</Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? '#999' }]}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Text>
              </View>
              {(item.items as any[]).map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>{it.name}</Text>
                  <Text style={styles.itemQty}>x{it.quantity}</Text>
                </View>
              ))}
              <Text style={styles.total}>合计 ¥{item.totalAmount.toFixed(2)}</Text>
              <View style={styles.actions}>
                {['pending', 'paid'].includes(item.status) && (
                  <>
                    <TouchableOpacity style={styles.shipBtn} onPress={() => ship(item)}>
                      <Text style={styles.shipText}>发货</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.refundBtn} onPress={() => refund(item)}>
                      <Text style={styles.refundText}>退款</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
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
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  loading: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  time: { fontSize: 12, color: '#999' },
  status: { fontSize: 13, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemName: { flex: 1, fontSize: 14, color: '#111' },
  itemQty: { fontSize: 13, color: '#666' },
  total: { fontSize: 14, fontWeight: 'bold', color: '#111', marginTop: 8, textAlign: 'right' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  shipBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, backgroundColor: '#22C55E' },
  shipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  refundBtn: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
  refundText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },
});
