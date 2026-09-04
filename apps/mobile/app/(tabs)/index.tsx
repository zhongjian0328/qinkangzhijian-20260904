import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Diagnosis } from '@qinkang/types';
import { diagnosisApi } from '../../src/api/diagnosis';
import { assetUrl } from '../../src/api/client';
import { useAuthStore } from '../../src/store/auth';

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  pending: { text: '排队中', color: '#F59E0B' },
  analyzing: { text: '分析中', color: '#F59E0B' },
  completed: { text: '已完成', color: '#22C55E' },
  failed: { text: '失败', color: '#EF4444' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDiagnoses = useCallback(async () => {
    setLoading(true);
    try {
      const list = await diagnosisApi.list();
      setDiagnoses(list);
    } catch {
      // 拉取失败静默处理，首页仍可用
      setDiagnoses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDiagnoses();
    }, [loadDiagnoses]),
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>欢迎使用禽康智检{user?.username ? `，${user.username}` : ''}</Text>
        <Text style={styles.subGreeting}>AI辅助禽类疾病诊断</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionCard, styles.primaryAction]}
          onPress={() => router.push('/diagnose')}
        >
          <Text style={styles.actionTitle}>📷 开始诊断</Text>
          <Text style={styles.actionDesc}>拍照或上传图片进行AI诊断</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/houses')}>
          <Text style={[styles.actionTitle, styles.secondaryActionTitle]}>🏠 禽舍管理</Text>
          <Text style={[styles.actionDesc, styles.secondaryActionDesc]}>管理禽舍与环境数据</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>最近诊断</Text>
          {diagnoses.length > 0 ? (
            <TouchableOpacity onPress={() => router.push('/diagnosis/history')}>
              <Text style={styles.viewAll}>查看全部</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {loading ? (
          <ActivityIndicator style={styles.loading} color="#22C55E" />
        ) : diagnoses.length === 0 ? (
          <Text style={styles.emptyText}>暂无诊断记录，点击上方「开始诊断」试试</Text>
        ) : (
          diagnoses.map((item) => {
            const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.pending;
            const disease =
              item.status === 'completed' && item.aiResult?.disease
                ? item.aiResult.disease
                : status.text;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.diagnosisCard}
                onPress={() => router.push(`/diagnosis/${item.id}`)}
              >
                {item.imageUrls?.length ? (
                  <Image
                    source={{ uri: assetUrl(item.imageUrls[0]) }}
                    style={styles.thumb}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.diagnosisMain}>
                  <Text style={styles.diseaseName} numberOfLines={1}>
                    {disease}
                  </Text>
                  <Text style={styles.diagnosisDate}>{formatDate(item.createdAt)}</Text>
                </View>
                <Text style={[styles.statusBadge, { color: status.color }]}>{status.text}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#22C55E' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: '#e0ffe0', marginTop: 4 },
  quickActions: { padding: 16, gap: 12 },
  actionCard: { padding: 20, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  primaryAction: { backgroundColor: '#22C55E' },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  actionDesc: { fontSize: 12, color: '#e0ffe0', marginTop: 4 },
  secondaryActionTitle: { color: '#111' },
  secondaryActionDesc: { color: '#666' },
  section: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  viewAll: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  emptyText: { color: '#999', textAlign: 'center', padding: 20 },
  loading: { marginTop: 20 },
  diagnosisCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  diagnosisMain: { flex: 1, marginRight: 12 },
  diseaseName: { fontSize: 16, fontWeight: '600', color: '#111' },
  diagnosisDate: { fontSize: 12, color: '#999', marginTop: 4 },
  statusBadge: { fontSize: 13, fontWeight: 'bold' },
});