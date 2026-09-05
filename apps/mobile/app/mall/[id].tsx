import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { commerceApi } from '../../src/api/commerce';
import { Product } from '@qinkang/types';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setProduct(await commerceApi.product(id));
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      }
    })();
  }, [id]);

  const submit = async () => {
    if (!product) return;
    setSubmitting(true);
    try {
      await commerceApi.createOrder({
        items: [
          { productId: product.id, name: product.name, price: product.price, quantity },
        ],
        address: address || null,
        phone: phone || null,
      });
      Alert.alert('下单成功', '订单已创建，可在「我的订单」中查看', [
        { text: '查看订单', onPress: () => router.replace('/orders') },
        { text: '继续逛逛', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('下单失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const total = product ? product.price * quantity : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ 返回</Text>
      </TouchableOpacity>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !product ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" size="large" />
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.name}>{product.name}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.tag}>{product.category}</Text>
              <Text style={styles.stock}>库存 {product.stock}{product.unit}</Text>
            </View>
            <Text style={styles.price}>¥{product.price.toFixed(2)} / {product.unit}</Text>
            {product.manufacturer ? (
              <Text style={styles.manufacturer}>生产厂家：{product.manufacturer}</Text>
            ) : null}
            {product.description ? (
              <Text style={styles.desc}>{product.description}</Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>购买数量</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Text style={styles.stepText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{quantity}</Text>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setQuantity((q) => Math.min(product.stock, q + 1))}
              >
                <Text style={styles.stepText}>＋</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>收货信息</Text>
            <TextInput
              style={styles.input}
              placeholder="收货地址"
              value={address}
              onChangeText={setAddress}
            />
            <TextInput
              style={styles.input}
              placeholder="联系电话"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <TouchableOpacity
            style={[styles.submit, submitting && styles.disabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>立即下单 · ¥{total.toFixed(2)}</Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 12 },
  backText: { fontSize: 16, color: '#22C55E', fontWeight: '600' },
  loading: { marginTop: 60 },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 18, marginBottom: 14 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#111', lineHeight: 28 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  tag: {
    fontSize: 12,
    color: '#22C55E',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stock: { fontSize: 12, color: '#999' },
  price: { fontSize: 22, fontWeight: 'bold', color: '#EF4444', marginTop: 12 },
  manufacturer: { fontSize: 13, color: '#666', marginTop: 8 },
  desc: { fontSize: 14, color: '#4b5563', lineHeight: 21, marginTop: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 20, color: '#22C55E', fontWeight: 'bold' },
  qty: { fontSize: 18, fontWeight: 'bold', color: '#111', minWidth: 30, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fafafa',
    color: '#333',
    marginBottom: 10,
  },
  submit: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  disabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
