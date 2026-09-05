import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { PreventionPlan } from '@qinkang/types';
import { preventionApi } from '../../src/api/prevention';

const SEVERITY_META: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: '#22C55E' },
  medium: { label: '中风险', color: '#F59E0B' },
  high: { label: '高风险', color: '#F97316' },
  critical: { label: '危重', color: '#EF4444' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function PreventionListScreen() {
  const router = useRouter();
  const [plans, setPlans] = useState<PreventionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPlans(await preventionApi.list());
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>我的防控预案</Text>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>暂无防控预案。完成一次 AI 诊断后即可生成。</Text>}
        renderItem={({ item }) => {
          const disease = item.diagnosis?.disease || '未知疾病';
          const severity = SEVERITY_META[item.diagnosis?.severity ?? ''] ?? null;
          const date = item.diagnosis?.createdAt ? formatDate(item.diagnosis.createdAt) : '';
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/prevention/${item.diagnosisId}`)}
            >
              <View style={styles.cardMain}>
                <Text style={styles.disease}>{disease}</Text>
                {item.content?.diagnosisSummary ? (
                  <Text style={styles.summary} numberOfLines={2}>
                    {item.content.diagnosisSummary}
                  </Text>
                ) : null}
              </View>
              <View style={styles.cardSide}>
                {severity ? (
                  <View style={[styles.severityBadge, { backgroundColor: severity.color }]}>
                    <Text style={styles.severityText}>{severity.label}</Text>
                  </View>
                ) : null}
                {date ? <Text style={styles.date}>{date}</Text> : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60 },
  back: { fontSize: 15, color: '#22C55E', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40, lineHeight: 22 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  cardMain: { flex: 1, marginRight: 12 },
  disease: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  summary: { fontSize: 13, color: '#666', marginTop: 6, lineHeight: 19 },
  cardSide: { alignItems: 'flex-end', gap: 6 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  severityText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  date: { fontSize: 11, color: '#999' },
});
