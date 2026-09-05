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
  ScrollView,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { merchantApi } from '../../src/api/merchant';
import { Product } from '@qinkang/types';

export default function MerchantProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: '', category: '', price: '', promoPrice: '', stock: '', unit: '件', description: '', manufacturer: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await merchantApi.products());
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', category: '', price: '', promoPrice: '', stock: '', unit: '件', description: '', manufacturer: '' });
    setModalVisible(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category: p.category,
      price: String(p.price),
      promoPrice: p.promoPrice != null ? String(p.promoPrice) : '',
      stock: String(p.stock),
      unit: p.unit,
      description: p.description ?? '',
      manufacturer: p.manufacturer ?? '',
    });
    setModalVisible(true);
  };

  const save = async () => {
    if (!form.name.trim() || !form.category.trim() || !form.price) {
      Alert.alert('提示', '请填写名称、分类和价格');
      return;
    }
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        price: Number(form.price),
        promoPrice: form.promoPrice ? Number(form.promoPrice) : null,
        stock: Number(form.stock || 0),
        unit: form.unit || '件',
        description: form.description || null,
        manufacturer: form.manufacturer || null,
      };
      if (editing) {
        await merchantApi.updateProduct(editing.id, payload);
      } else {
        await merchantApi.createProduct(payload);
      }
      setModalVisible(false);
      load();
    } catch (e) {
      Alert.alert('保存失败', e instanceof Error ? e.message : '请稍后重试');
    }
  };

  const remove = (p: Product) => {
    Alert.alert('删除商品', `确定删除「${p.name}」吗？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await merchantApi.deleteProduct(p.id);
            load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const field = (key: keyof typeof form, placeholder: string, keyboardType: any = 'default') => (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={form[key]}
      onChangeText={(t) => setForm((f) => ({ ...f, [key]: t }))}
      keyboardType={keyboardType}
      placeholderTextColor="#bbb"
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <View style={styles.headerRow}>
          <Text style={styles.title}>商品管理</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
            <Text style={styles.addText}>+ 上架商品</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.empty}>暂无商品，点击右上角上架</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.price}>¥{item.price.toFixed(2)}</Text>
              </View>
              <Text style={styles.meta}>{item.category} · 库存 {item.stock}{item.unit} · 销量 {item.sales}</Text>
              {item.promoPrice != null && (
                <Text style={styles.promo}>促销价 ¥{item.promoPrice.toFixed(2)}</Text>
              )}
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.editText}>编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => remove(item)}>
                  <Text style={styles.delText}>删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? '编辑商品' : '上架商品'}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              {field('name', '商品名称')}
              {field('category', '分类（如 抗生素/疫苗/饲料）')}
              <View style={styles.row}>
                <View style={{ flex: 1 }}>{field('price', '价格', 'numeric')}</View>
                <View style={{ flex: 1, marginLeft: 8 }}>{field('promoPrice', '促销价(可选)', 'numeric')}</View>
              </View>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>{field('stock', '库存', 'numeric')}</View>
                <View style={{ flex: 1, marginLeft: 8 }}>{field('unit', '单位(袋/瓶/盒)')}</View>
              </View>
              {field('manufacturer', '生产厂家(可选)')}
              {field('description', '商品描述(可选)')}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveText}>保存</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  addBtn: { backgroundColor: '#22C55E', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  loading: { marginTop: 40 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#111', marginRight: 8 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
  meta: { fontSize: 13, color: '#666', marginTop: 6 },
  promo: { fontSize: 13, color: '#F59E0B', marginTop: 4, fontWeight: '600' },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  editBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#22C55E' },
  editText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  delBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#EF4444' },
  delText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', marginBottom: 10, backgroundColor: '#fafafa' },
  row: { flexDirection: 'row' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', alignItems: 'center' },
  cancelText: { fontSize: 15, color: '#666' },
  saveBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#22C55E', alignItems: 'center' },
  saveText: { fontSize: 15, color: '#fff', fontWeight: '600' },
});
