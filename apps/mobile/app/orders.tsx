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
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { commerceApi } from '../src/api/commerce';
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

export default function OrdersScreen() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await commerceApi.orders());
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

  const cancel = (o: Order) => {
    Alert.alert('取消订单', '确定取消该订单吗？', [
      { text: '再想想', style: 'cancel' },
      {
        text: '取消订单',
        style: 'destructive',
        onPress: async () => {
          try {
            await commerceApi.updateOrder(o.id, 'cancelled');
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
        <Text style={styles.title}>我的订单</Text>
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
                <Text style={styles.orderTime}>
                  {new Date(item.createdAt).toLocaleString('zh-CN')}
                </Text>
                <Text style={[styles.status, { color: STATUS_COLOR[item.status] ?? '#999' }]}>
                  {STATUS_LABEL[item.status] ?? item.status}
                </Text>
              </View>
              {(item.items as any[]).map((it, i) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text style={styles.itemQty}>x{it.quantity}</Text>
                  <Text style={styles.itemPrice}>¥{(it.price * it.quantity).toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.cardBottom}>
                <Text style={styles.total}>
                  共 {item.items.length} 件 · 合计 ¥{item.totalAmount.toFixed(2)}
                </Text>
                {item.status === 'pending' ? (
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => cancel(item)}>
                    <Text style={styles.cancelText}>取消</Text>
                  </TouchableOpacity>
                ) : null}
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  orderTime: { fontSize: 12, color: '#999' },
  status: { fontSize: 13, fontWeight: 'bold' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  itemName: { flex: 1, fontSize: 14, color: '#111' },
  itemQty: { fontSize: 13, color: '#666', marginHorizontal: 10 },
  itemPrice: { fontSize: 14, color: '#111', fontWeight: '500' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  total: { fontSize: 14, fontWeight: 'bold', color: '#111' },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  cancelText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
});
