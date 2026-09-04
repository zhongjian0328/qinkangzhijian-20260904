import { useCallback, useState } from 'react';
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
import { useFocusEffect, useRouter } from 'expo-router';
import { PoultryHouse, Species } from '@qinkang/types';
import { houseApi, CreateHouseInput } from '../../src/api/house';

const SPECIES_OPTIONS: { value: Species; label: string }[] = [
  { value: 'chicken', label: '鸡' },
  { value: 'duck', label: '鸭' },
  { value: 'goose', label: '鹅' },
  { value: 'turkey', label: '火鸡' },
  { value: 'other', label: '其他' },
];

const SPECIES_LABEL: Record<string, string> = {
  chicken: '鸡',
  duck: '鸭',
  goose: '鹅',
  turkey: '火鸡',
  other: '其他',
};

export default function HousesScreen() {
  const router = useRouter();
  const [houses, setHouses] = useState<PoultryHouse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [currentCount, setCurrentCount] = useState('');
  const [age, setAge] = useState('');
  const [species, setSpecies] = useState<Species>('chicken');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHouses(await houseApi.list());
    } catch {
      setHouses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const resetForm = () => {
    setName('');
    setCapacity('');
    setCurrentCount('');
    setAge('');
    setSpecies('chicken');
    setEditingId(null);
  };

  const startEdit = (house: PoultryHouse) => {
    setName(house.name);
    setCapacity(String(house.capacity));
    setCurrentCount(String(house.currentCount));
    setAge(String(house.age));
    setSpecies(house.species);
    setEditingId(house.id);
    setShowForm(true);
  };

  const submit = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请填写禽舍名称');
      return;
    }
    const cap = parseInt(capacity, 10);
    const count = currentCount ? parseInt(currentCount, 10) : 0;
    const ageDays = parseInt(age, 10);
    if (!capacity || Number.isNaN(cap) || cap <= 0) {
      Alert.alert('提示', '请填写正确的容量');
      return;
    }
    if (Number.isNaN(ageDays) || ageDays < 0) {
      Alert.alert('提示', '请填写正确的日龄');
      return;
    }
    if (Number.isNaN(count) || count < 0) {
      Alert.alert('提示', '请填写正确的存栏数');
      return;
    }

    const data: CreateHouseInput = {
      name: name.trim(),
      capacity: cap,
      currentCount: count,
      species,
      age: ageDays,
    };

    setSaving(true);
    try {
      if (editingId) {
        await houseApi.update(editingId, data);
      } else {
        await houseApi.create(data);
      }
      resetForm();
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert(editingId ? '更新失败' : '创建失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (house: PoultryHouse) => {
    Alert.alert('删除禽舍', `确定要删除「${house.name}」吗？其环境数据与告警也会一并删除。`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await houseApi.remove(house.id);
            await load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>禽舍管理</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setShowForm((v) => !v);
          }}
        >
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 添加禽舍'}</Text>
        </TouchableOpacity>
      </View>

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{editingId ? '编辑禽舍' : '新建禽舍'}</Text>
          <TextInput
            style={styles.input}
            placeholder="禽舍名称（如：1号鸡舍）"
            value={name}
            onChangeText={setName}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="容量（只）"
              keyboardType="number-pad"
              value={capacity}
              onChangeText={setCapacity}
            />
            <TextInput
              style={[styles.input, styles.rowInput]}
              placeholder="存栏数（只）"
              keyboardType="number-pad"
              value={currentCount}
              onChangeText={setCurrentCount}
            />
          </View>
          <TextInput
            style={styles.input}
            placeholder="日龄（天）"
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
          />
          <View style={styles.speciesRow}>
            {SPECIES_OPTIONS.map((opt) => {
              const active = species === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSpecies(opt.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitDisabled]}
            onPress={submit}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{editingId ? '保存修改' : '保存'}</Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : houses.length === 0 ? (
        <Text style={styles.empty}>暂无禽舍，请点击右上角添加</Text>
      ) : (
        houses.map((house) => (
          <View key={house.id} style={styles.card}>
            <TouchableOpacity
              style={styles.cardMain}
              onPress={() => router.push(`/house/${house.id}`)}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.houseName}>{house.name}</Text>
                <Text style={styles.speciesTag}>{SPECIES_LABEL[house.species] ?? house.species}</Text>
              </View>
              <Text style={styles.meta}>
                存栏 {house.currentCount} / {house.capacity} 只 · 日龄 {house.age} 天
              </Text>
              {house.alerts?.length ? (
                <Text style={styles.alertHint}>
                  ⚠️ {house.alerts.length} 条未处理告警，点击查看
                </Text>
              ) : (
                <Text style={styles.envHint}>查看环境数据与告警 ›</Text>
              )}
            </TouchableOpacity>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => startEdit(house)}>
                <Text style={styles.actionEdit}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(house)}>
                <Text style={styles.actionDelete}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#22C55E' },
  addButtonText: { color: '#fff', fontWeight: 'bold' },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  formTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#111' },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
    color: '#333',
  },
  row: { flexDirection: 'row', gap: 12 },
  rowInput: { flex: 1 },
  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  submitButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  cardMain: { padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  houseName: { fontSize: 16, fontWeight: 'bold', color: '#111', flex: 1 },
  speciesTag: { fontSize: 12, color: '#22C55E', fontWeight: 'bold', marginLeft: 8 },
  meta: { fontSize: 13, color: '#666' },
  alertHint: { fontSize: 13, color: '#F59E0B', marginTop: 8, fontWeight: '600' },
  envHint: { fontSize: 13, color: '#22C55E', marginTop: 8 },
  cardActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: '#eee',
  },
  actionEdit: { color: '#22C55E', fontWeight: '600', fontSize: 14 },
  actionDelete: { color: '#EF4444', fontWeight: '600', fontSize: 14 },
});