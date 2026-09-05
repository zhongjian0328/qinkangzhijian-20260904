import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { bulkPurchaseApi } from '../../src/api/bulk-purchase';
import { BulkPurchaseItem } from '@qinkang/types';

export default function BulkPurchaseNewScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [items, setItems] = useState<BulkPurchaseItem[]>([{ name: '', spec: '', quantity: 1, requirement: '' }]);
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const updateItem = (i: number, patch: Partial<BulkPurchaseItem>) => {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { name: '', spec: '', quantity: 1, requirement: '' }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请填写询价标题');
      return;
    }
    const valid = items.filter((it) => it.name.trim());
    if (valid.length === 0) {
      Alert.alert('提示', '请至少填写一个采购品种');
      return;
    }
    setSaving(true);
    try {
      await bulkPurchaseApi.create({
        title: title.trim(),
        items: valid.map((it) => ({ ...it, quantity: Number(it.quantity) || 1 })),
        deadline: deadline || null,
      });
      router.back();
    } catch (e) {
      Alert.alert('发布失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>发布询价单</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.label}>询价标题</Text>
        <TextInput style={styles.input} placeholder="如：采购 5000 只蛋鸡疫苗" value={title} onChangeText={setTitle} placeholderTextColor="#bbb" />

        <Text style={styles.label}>采购品种</Text>
        {items.map((it, i) => (
          <View key={i} style={styles.itemBox}>
            <View style={styles.itemRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="品种名称" value={it.name} onChangeText={(t) => updateItem(i, { name: t })} placeholderTextColor="#bbb" />
              <TextInput style={[styles.input, { flex: 1, marginLeft: 8 }]} placeholder="规格(可选)" value={it.spec ?? ''} onChangeText={(t) => updateItem(i, { spec: t })} placeholderTextColor="#bbb" />
            </View>
            <View style={styles.itemRow}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="数量" value={String(it.quantity)} keyboardType="numeric" onChangeText={(t) => updateItem(i, { quantity: Number(t) || 1 })} placeholderTextColor="#bbb" />
              <TextInput style={[styles.input, { flex: 2, marginLeft: 8 }]} placeholder="要求(可选)" value={it.requirement ?? ''} onChangeText={(t) => updateItem(i, { requirement: t })} placeholderTextColor="#bbb" />
            </View>
            {items.length > 1 && (
              <TouchableOpacity onPress={() => removeItem(i)}>
                <Text style={styles.removeText}>移除该品种</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        <TouchableOpacity style={styles.addItemBtn} onPress={addItem}>
          <Text style={styles.addItemText}>+ 添加品种</Text>
        </TouchableOpacity>

        <Text style={styles.label}>报价截止日期（可选，YYYY-MM-DD）</Text>
        <TextInput style={styles.input} placeholder="2026-09-20" value={deadline} onChangeText={setDeadline} placeholderTextColor="#bbb" />

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>发布询价单</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  back: { fontSize: 16, color: '#22C55E', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 14, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 14, color: '#333', backgroundColor: '#fff' },
  itemBox: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10 },
  itemRow: { flexDirection: 'row', marginBottom: 8 },
  removeText: { color: '#EF4444', fontSize: 12, marginTop: 4 },
  addItemBtn: { paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#22C55E', alignItems: 'center', marginTop: 4 },
  addItemText: { color: '#22C55E', fontSize: 14, fontWeight: '600' },
  submitBtn: { backgroundColor: '#22C55E', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
