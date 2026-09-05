import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { merchantApi } from '../src/api/merchant';
import { MerchantDashboard } from '@qinkang/types';

export default function MerchantScreen() {
  const router = useRouter();
  const [data, setData] = useState<MerchantDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setData(await merchantApi.dashboard());
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

  const stats: { label: string; value: string | number; icon: any; color: string }[] = [
    { label: '商品数', value: data?.productCount ?? 0, icon: 'cube-outline', color: '#22C55E' },
    { label: '订单数', value: data?.orderCount ?? 0, icon: 'receipt-outline', color: '#3B82F6' },
    { label: '营业额', value: `¥${(data?.revenue ?? 0).toFixed(0)}`, icon: 'wallet-outline', color: '#F59E0B' },
    { label: '待发货', value: data?.pendingShipCount ?? 0, icon: 'cube-outline', color: '#EF4444' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>商家工作台</Text>
        <Text style={styles.subtitle}>兽药 / 设备商城运营</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.statGrid}>
          {stats.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Ionicons name={s.icon} size={22} color={s.color} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>商品运营</Text>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/merchant/products')}>
          <View style={styles.iconBox}><Ionicons name="cube-outline" size={24} color="#22C55E" /></View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>商品管理</Text>
            <Text style={styles.cardDesc}>上架 / 定价 / 库存 / 促销</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/merchant/orders')}>
          <View style={styles.iconBox}><Ionicons name="receipt-outline" size={24} color="#3B82F6" /></View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>订单管理</Text>
            <Text style={styles.cardDesc}>发货 / 物流 / 退款售后</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>B2B 大宗采购</Text>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/merchant/bulk')}>
          <View style={styles.iconBox}><Ionicons name="pricetags-outline" size={24} color="#F59E0B" /></View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>询价大厅</Text>
            <Text style={styles.cardDesc}>接收企业询价单并竞价报价（{data?.openBulkCount ?? 0} 个待报价）</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {loading && <ActivityIndicator style={styles.loading} color="#22C55E" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  loading: { position: 'absolute', top: '50%', alignSelf: 'center' },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 8 },
  statCard: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'flex-start',
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#999', marginTop: 2 },
  sectionTitle: { fontSize: 14, color: '#666', fontWeight: '600', marginTop: 16, marginBottom: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  cardDesc: { fontSize: 13, color: '#999', marginTop: 3 },
  arrow: { fontSize: 20, color: '#ccc', marginLeft: 8 },
});
