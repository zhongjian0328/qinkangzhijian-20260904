import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { VetCase } from '@qinkang/types';
import { vetDiagnosisApi } from '../../src/api/vet-diagnosis';
import { useAuthStore } from '../../src/store/auth';

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿', submitted: '已提交', analyzing: '分析中',
  completed: '已完成', failed: '失败', offline: '离线',
};

export default function VetCaseLibraryScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isFarmer = user?.role === 'farmer';
  const [cases, setCases] = useState<VetCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await vetDiagnosisApi.list({ take: 50 });
        setCases(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const completed = cases.filter((c) => c.status === 'completed' || c.status === 'offline');
  const diseases = new Set(completed.map((c) => c.diagnosisResult?.disease).filter(Boolean));
  const avgConfidence = completed.length
    ? Math.round((completed.reduce((s, c) => s + (c.confidence ?? 0), 0) / completed.length) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>‹ 返回</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{isFarmer ? '诊断历史' : '病例库'}</Text>

      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statNum}>{cases.length}</Text><Text style={styles.statLabel}>总病例</Text></View>
        <View style={styles.statBox}><Text style={styles.statNum}>{diseases.size}</Text><Text style={styles.statLabel}>涉及疾病</Text></View>
        <View style={styles.statBox}><Text style={styles.statNum}>{avgConfidence}%</Text><Text style={styles.statLabel}>平均置信度</Text></View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : cases.length === 0 ? (
        <Text style={styles.empty}>暂无记录，去「AI诊断」Tab 提交一例吧</Text>
      ) : (
        cases.map((c) => {
          const disease = c.diagnosisResult?.disease ?? (c.status === 'completed' ? '—' : '分析中');
          return (
            <TouchableOpacity key={c.id} style={styles.card} onPress={() => router.push(`/vet-diagnosis/${c.id}`)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardNo}>{c.caseNo}</Text>
                <Text style={styles.cardStatus}>{STATUS_LABEL[c.status] ?? c.status}</Text>
              </View>
              <Text style={styles.cardSpecies}>
                {c.basicInfo?.species ?? c.species} · {c.basicInfo?.breed || '未知品种'} · {c.basicInfo?.ageDays || '?'}日龄
              </Text>
              <Text style={styles.cardDisease}>🎯 {disease}</Text>
              {c.confidence != null ? (
                <Text style={styles.cardConf}>置信度 {Math.round(c.confidence * 100)}%</Text>
              ) : null}
              <Text style={styles.cardDate}>{new Date(c.createdAt).toLocaleString()}</Text>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 8 },
  backText: { fontSize: 16, color: '#22C55E', fontWeight: '600' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  statBox: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#f0fdf4', alignItems: 'center', borderWidth: 1, borderColor: '#bbf7d0' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#166534' },
  statLabel: { fontSize: 12, color: '#15803d', marginTop: 4 },
  loading: { marginTop: 40 },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  card: { padding: 14, borderRadius: 14, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNo: { fontSize: 13, color: '#374151', fontWeight: '600' },
  cardStatus: { fontSize: 12, color: '#22C55E', fontWeight: 'bold' },
  cardSpecies: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  cardDisease: { fontSize: 16, fontWeight: 'bold', color: '#111', marginTop: 6 },
  cardConf: { fontSize: 13, color: '#22C55E', fontWeight: '600', marginTop: 4 },
  cardDate: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
});