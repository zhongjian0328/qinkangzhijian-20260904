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
import { Consultation } from '@qinkang/types';

type Tab = 'new' | 'mine' | 'pool';

export default function ConsultScreen() {
  const router = useRouter();
  const { tab: initTab } = useLocalSearchParams<{ tab?: string }>();
  const user = useAuthStore((s) => s.user);
  const isVet = !!user && ['vet', 'technician', 'admin'].includes(user.role);

  const [tab, setTab] = useState<Tab>(() => (isVet && initTab === 'pool' ? 'pool' : 'new'));
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [mine, setMine] = useState<Consultation[]>([]);
  const [pool, setPool] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [m, p] = await Promise.all([
        commerceApi.consultations(),
        isVet ? commerceApi.consultationPool().catch(() => [] as Consultation[]) : Promise.resolve([] as Consultation[]),
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
    if (!subject.trim()) {
      Alert.alert('提示', '请填写咨询主题');
      return;
    }
    setSubmitting(true);
    try {
      const c = await commerceApi.createConsultation({
        subject: subject.trim(),
        initialMessage: message.trim() || undefined,
      });
      setSubject('');
      setMessage('');
      router.push(`/consult/${c.id}`);
    } catch (e) {
      Alert.alert('发起失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'new', label: '发起咨询' },
    { key: 'mine', label: '我的咨询' },
    ...(isVet ? [{ key: 'pool' as Tab, label: '咨询大厅' }] : []),
  ];

  const renderConsult = (c: Consultation) => {
    const last = c.messages[c.messages.length - 1];
    const preview = last ? (last.role === 'vet' ? '[兽医] ' : '') + last.content : '暂无消息';
    return (
      <TouchableOpacity
        key={c.id}
        style={styles.card}
        onPress={() => router.push(`/consult/${c.id}`)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={1}>{c.subject}</Text>
          <Text style={[styles.status, { color: c.status === 'active' ? '#22C55E' : '#9CA3AF' }]}>
            {c.status === 'active' ? '进行中' : '已关闭'}
          </Text>
        </View>
        <Text style={styles.preview} numberOfLines={2}>{preview}</Text>
        <Text style={styles.time}>{new Date(c.createdAt).toLocaleString('zh-CN')}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>专家咨询</Text>
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

      {tab === 'new' ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>咨询主题</Text>
          <TextInput
            style={styles.input}
            placeholder="如：蛋鸡产蛋率突然下降怎么办"
            value={subject}
            onChangeText={setSubject}
          />
          <Text style={styles.sectionTitle}>问题描述（可选）</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="详细描述症状、日龄、数量、发病情况…"
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            style={[styles.submit, submitting && styles.disabled]}
            onPress={submit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>发起咨询</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      ) : loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {(tab === 'mine' ? mine : pool).length === 0 ? (
            <Text style={styles.empty}>{tab === 'mine' ? '暂无咨询' : '暂无待回复的咨询'}</Text>
          ) : (
            (tab === 'mine' ? mine : pool).map(renderConsult)
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
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 10,
  },
  multiline: { minHeight: 100 },
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
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: 'bold', color: '#111', marginRight: 8 },
  status: { fontSize: 13, fontWeight: 'bold' },
  preview: { fontSize: 13, color: '#666', marginTop: 6, lineHeight: 19 },
  time: { fontSize: 12, color: '#bbb', marginTop: 6 },
});