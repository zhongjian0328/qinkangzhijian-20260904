import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { bulkPurchaseApi } from '../../src/api/bulk-purchase';
import { BulkPurchase, Bid } from '@qinkang/types';
import { useAuthStore } from '../../src/store/auth';

const STATUS_LABEL: Record<string, string> = {
  open: '报价中',
  awarded: '已定标',
  completed: '已完成',
  cancelled: '已取消',
};

export default function BulkPurchaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const [bp, setBp] = useState<BulkPurchase | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setBp(await bulkPurchaseApi.detail(id));
    } catch {
      setBp(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isOwner = !!user && bp?.userId === user.id;

  const award = (bid: Bid) => {
    Alert.alert('比价定标', `确定选择 ${bid.merchant?.username ?? '该供应商'} 的报价 ¥${bid.price.toFixed(2)} 吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确认定标',
        onPress: async () => {
          try {
            await bulkPurchaseApi.award(bp!.id, bid.id);
            load();
          } catch (e) {
            Alert.alert('定标失败', e instanceof Error ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const cancel = () => {
    Alert.alert('取消询价单', '确定取消吗？', [
      { text: '再想想', style: 'cancel' },
      {
        text: '取消询价',
        style: 'destructive',
        onPress: async () => {
          try {
            await bulkPurchaseApi.cancel(bp!.id);
            load();
          } catch (e) {
            Alert.alert('操作失败', e instanceof Error ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} color="#22C55E" />
      </View>
    );
  }

  if (!bp) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ 返回</Text></TouchableOpacity>
        </View>
        <Text style={styles.empty}>询价单不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>‹ 返回</Text></TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{bp.title}</Text>
          <Text style={styles.status}>{STATUS_LABEL[bp.status] ?? bp.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>采购清单</Text>
        {(bp.items as any[]).map((it, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={styles.itemName}>{it.name} {it.spec ? `(${it.spec})` : ''}</Text>
            <Text style={styles.itemQty}>x{it.quantity}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>报价（{bp.bids?.length ?? 0} 份，按价格升序）</Text>
        {(bp.bids?.length ?? 0) === 0 && <Text style={styles.noBid}>暂无报价</Text>}
        {(bp.bids ?? []).map((bid) => (
          <View key={bid.id} style={[styles.bidCard, bp.winnerBidId === bid.id && styles.bidWon]}>
            <View style={styles.bidTop}>
              <Text style={styles.bidMerchant}>{bid.merchant?.username ?? '供应商'}</Text>
              <Text style={styles.bidPrice}>¥{bid.price.toFixed(2)}</Text>
            </View>
            {bid.paymentTerms && <Text style={styles.bidMeta}>账期：{bid.paymentTerms}</Text>}
            {bid.deliveryTime && <Text style={styles.bidMeta}>配送：{bid.deliveryTime}</Text>}
            {bp.winnerBidId === bid.id && <Text style={styles.wonTag}>已定标</Text>}
            {isOwner && bp.status === 'open' && (
              <TouchableOpacity style={styles.awardBtn} onPress={() => award(bid)}>
                <Text style={styles.awardText}>选此报价</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {isOwner && ['open', 'awarded'].includes(bp.status) && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancel}>
            <Text style={styles.cancelText}>取消询价单</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  back: { fontSize: 16, color: '#22C55E', fontWeight: '600', marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#111', marginRight: 8 },
  status: { fontSize: 14, fontWeight: 'bold', color: '#F59E0B' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333', marginTop: 18, marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8 },
  itemName: { fontSize: 14, color: '#111', flex: 1 },
  itemQty: { fontSize: 14, color: '#666', fontWeight: '600' },
  noBid: { fontSize: 13, color: '#999', textAlign: 'center', paddingVertical: 16 },
  bidCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  bidWon: { borderColor: '#22C55E', backgroundColor: '#F0FDF4' },
  bidTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidMerchant: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  bidPrice: { fontSize: 17, fontWeight: 'bold', color: '#EF4444' },
  bidMeta: { fontSize: 12, color: '#666', marginTop: 4 },
  wonTag: { fontSize: 12, color: '#22C55E', fontWeight: 'bold', marginTop: 8 },
  awardBtn: { backgroundColor: '#22C55E', borderRadius: 8, paddingVertical: 8, alignItems: 'center', marginTop: 10 },
  awardText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  cancelBtn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#EF4444', alignItems: 'center', marginTop: 16 },
  cancelText: { color: '#EF4444', fontSize: 14, fontWeight: '600' },
});
