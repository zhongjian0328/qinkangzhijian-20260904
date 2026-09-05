import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { merchantApi } from '../../src/api/merchant';
import { BulkPurchase } from '@qinkang/types';

export default function MerchantBulkScreen() {
  const router = useRouter();
  const [list, setList] = useState<BulkPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidding, setBidding] = useState<BulkPurchase | null>(null);
  const [price, setPrice] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setList(await merchantApi.bulkPurchases());
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

  const openBid = (bp: BulkPurchase) => {
    setBidding(bp);
    setPrice('');
    setPaymentTerms('');
    setDeliveryTime('');
  };

  const submitBid = async () => {
    if (!bidding) return;
    if (!price || Number(price) <= 0) {
      Alert.alert('提示', '请输入有效报价');
      return;
    }
    try {
      await merchantApi.createBid(bidding.id, {
        price: Number(price),
        paymentTerms: paymentTerms || null,
        deliveryTime: deliveryTime || null,
      });
      setBidding(null);
      Alert.alert('报价成功', '已提交报价，等待买方比价定标');
      load();
    } catch (e) {
      Alert.alert('报价失败', e instanceof Error ? e.message : '请稍后重试');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>询价大厅</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>暂无待报价的询价单</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.bpTitle}>{item.title}</Text>
              {(item.items as any[]).map((it, i) => (
                <Text key={i} style={styles.itemLine}>
                  {it.name} · {it.quantity} {it.spec ?? ''}
                </Text>
              ))}
              <View style={styles.cardBottom}>
                <Text style={styles.deadline}>
                  {item.deadline ? `截止 ${new Date(item.deadline).toLocaleDateString('zh-CN')}` : '长期有效'}
                </Text>
                <TouchableOpacity style={styles.bidBtn} onPress={() => openBid(item)}>
                  <Text style={styles.bidText}>立即报价</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={!!bidding} animationType="slide" transparent onRequestClose={() => setBidding(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>报价 - {bidding?.title}</Text>
            <TextInput
              style={styles.input}
              placeholder="报价金额（元）"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholderTextColor="#bbb"
            />
            <TextInput
              style={styles.input}
              placeholder="账期（如 月结30天，可选）"
              value={paymentTerms}
              onChangeText={setPaymentTerms}
              placeholderTextColor="#bbb"
            />
            <TextInput
              style={styles.input}
              placeholder="配送时间（如 3日内送达，可选）"
              value={deliveryTime}
              onChangeText={setDeliveryTime}
              placeholderTextColor="#bbb"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setBidding(null)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={submitBid}>
                <Text style={styles.saveText}>提交报价</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  bpTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  itemLine: { fontSize: 13, color: '#666', paddingVertical: 2 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  deadline: { fontSize: 12, color: '#999' },
  bidBtn: { backgroundColor: '#F59E0B', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 8 },
  bidText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', marginBottom: 10, backgroundColor: '#fafafa' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#666' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#22C55E', alignItems: 'center' },
  saveText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
