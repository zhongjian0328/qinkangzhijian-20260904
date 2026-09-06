import { useCallback, useEffect, useState } from 'react';
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
import { useAuthStore } from '../src/store/auth';
import { commerceApi } from '../src/api/commerce';
import { ServiceOrder, ServiceType } from '@qinkang/types';

type Tab = 'book' | 'mine' | 'pool';

const SERVICE_TYPES: { key: ServiceType; label: string; desc: string }[] = [
  { key: 'on_site', label: '现场服务', desc: '兽医上门诊疗' },
  { key: 'online', label: '在线诊疗', desc: '远程图文/视频诊断' },
  { key: 'lab_test', label: '实验室检测', desc: '送检病料实验室检测' },
];

const STATUS_LABEL: Record<string, string> = {
  pending: '待接单',
  accepted: '已接单',
  in_progress: '服务中',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#F59E0B',
  accepted: '#3B82F6',
  in_progress: '#8B5CF6',
  completed: '#22C55E',
  cancelled: '#9CA3AF',
};

export default function ServiceScreen() {
  const router = useRouter();
  const { tab: initTab, desc: initDesc, address: initAddress } = useLocalSearchParams<{ tab?: string; desc?: string; address?: string }>();
  const user = useAuthStore((s) => s.user);
  const isVet = !!user && ['vet', 'technician', 'admin'].includes(user.role);

  const [tab, setTab] = useState<Tab>(() => (isVet && initTab === 'pool' ? 'pool' : 'book'));
  const [serviceType, setServiceType] = useState<ServiceType>('online');
  const [description, setDescription] = useState(initDesc ?? '');
  const [address, setAddress] = useState(initAddress ?? '');
  const [submitting, setSubmitting] = useState(false);

  const [mine, setMine] = useState<ServiceOrder[]>([]);
  const [pool, setPool] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        commerceApi.serviceOrders(),
        isVet ? commerceApi.serviceOrderPool().catch(() => [] as ServiceOrder[]) : Promise.resolve([] as ServiceOrder[]),
      ]);
      setMine(m);
      setPool(p);
    } catch {
      setMine([]);
      setPool([]);
    } finally {
      setLoading(false);
    }
  }, [isVet]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!description.trim()) {
      Alert.alert('提示', '请填写服务需求描述');
      return;
    }
    setSubmitting(true);
    try {
      await commerceApi.createServiceOrder({
        serviceType,
        description: description.trim(),
        address: address.trim() || null,
      });
      Alert.alert('已提交', '诊疗服务单已创建，等待兽医接单', [
        { text: '好的', onPress: () => { setTab('mine'); load(); } },
      ]);
      setDescription('');
      setAddress('');
    } catch (e) {
      Alert.alert('提交失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const accept = (o: ServiceOrder) => {
    Alert.alert('接单', `接取「${SERVICE_TYPES.find((t) => t.key === o.serviceType)?.label}」服务单？`, [
      { text: '再想想', style: 'cancel' },
      {
        text: '接单',
        onPress: async () => {
          try {
            await commerceApi.updateServiceOrder(o.id, { action: 'accept' });
            load();
          } catch (e) {
            Alert.alert('接单失败', e instanceof Error ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const advance = (o: ServiceOrder, status: string) => {
    Alert.alert('更新状态', `将服务单标记为「${STATUS_LABEL[status]}」？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: async () => {
          try {
            await commerceApi.updateServiceOrder(o.id, { status });
            load();
          } catch (e) {
            Alert.alert('操作失败', e instanceof Error ? e.message : '请稍后重试');
          }
        },
      },
    ]);
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'book', label: '发起服务' },
    { key: 'mine', label: '我的服务单' },
    ...(isVet ? [{ key: 'pool' as Tab, label: '接单大厅' }] : []),
  ];

  const renderOrder = (o: ServiceOrder, isPool: boolean) => {
    const typeLabel = SERVICE_TYPES.find((t) => t.key === o.serviceType)?.label ?? o.serviceType;
    return (
      <View key={o.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardType}>{typeLabel}</Text>
          <Text style={[styles.status, { color: STATUS_COLOR[o.status] ?? '#999' }]}>
            {STATUS_LABEL[o.status] ?? o.status}
          </Text>
        </View>
        {o.description ? (
          <Text style={styles.desc} numberOfLines={3}>{o.description}</Text>
        ) : null}
        {o.address ? <Text style={styles.meta}>地址：{o.address}</Text> : null}
        {o.price ? <Text style={styles.meta}>报价：¥{o.price.toFixed(2)}</Text> : null}
        <Text style={styles.meta}>提交时间：{new Date(o.createdAt).toLocaleString('zh-CN')}</Text>

        {isPool ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => accept(o)}>
            <Text style={styles.actionText}>立即接单</Text>
          </TouchableOpacity>
        ) : isVet && o.vetId === user?.id && o.status === 'accepted' ? (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => advance(o, 'in_progress')}>
              <Text style={styles.actionText}>开始服务</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => advance(o, 'completed')}>
              <Text style={styles.actionText}>完成服务</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>诊疗服务</Text>
      </View>

      <View style={styles.tabRow}>
        {tabs.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setTab(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === 'book' ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>选择服务类型</Text>
          <View style={styles.typeWrap}>
            {SERVICE_TYPES.map((t) => {
              const active = serviceType === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeCard, active && styles.typeCardActive]}
                  onPress={() => setServiceType(t.key)}
                >
                  <Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{t.label}</Text>
                  <Text style={styles.typeDesc}>{t.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionTitle}>服务需求</Text>
          <TextInput
            style={styles.input}
            placeholder="描述病情/服务需求，如：3000 只蛋鸡出现呼吸道症状…"
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            style={styles.input}
            placeholder="服务地址（现场服务需填写）"
            value={address}
            onChangeText={setAddress}
          />

          <TouchableOpacity
            style={[styles.submit, submitting && styles.disabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>提交服务单</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {(tab === 'mine' ? mine : pool).length === 0 ? (
            <Text style={styles.empty}>{tab === 'mine' ? '暂无服务单' : '暂无待接单的服务单'}</Text>
          ) : (
            (tab === 'mine' ? mine : pool).map((o) => renderOrder(o, tab === 'pool'))
          )}
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#22C55E' },
  tabText: { color: '#555', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 14, color: '#666', fontWeight: '600', marginTop: 8, marginBottom: 10 },
  typeWrap: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  typeCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 14,
    backgroundColor: '#fff',
  },
  typeCardActive: { borderColor: '#22C55E', backgroundColor: '#ECFDF5' },
  typeLabel: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  typeLabelActive: { color: '#22C55E' },
  typeDesc: { fontSize: 12, color: '#999', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 10,
    minHeight: 48,
  },
  submit: {
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  disabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loading: { marginTop: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardType: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  status: { fontSize: 13, fontWeight: 'bold' },
  desc: { fontSize: 13, color: '#4b5563', lineHeight: 19, marginBottom: 6 },
  meta: { fontSize: 12, color: '#999', marginTop: 2 },
  actionBtn: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
