import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { learningApi } from '../../src/api/learning';
import { ExamRecord } from '@qinkang/types';

const TYPE_LABEL: Record<string, string> = { practice: '章节练习', mock: '综合测验' };

export default function ExamRecordsScreen() {
  const router = useRouter();
  const [records, setRecords] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await learningApi.examRecords());
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>测验记录</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : records.length === 0 ? (
        <Text style={styles.empty}>暂无测验记录，去测一次吧</Text>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.content}
          renderItem={({ item }) => {
            const pct = item.totalScore > 0 ? Math.round((item.score / item.totalScore) * 100) : 0;
            return (
              <View style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle}>{TYPE_LABEL[item.type] ?? item.type}</Text>
                  <Text style={styles.cardScore}>{item.score}/{item.totalScore}</Text>
                </View>
                <Text style={styles.cardMeta}>
                  {pct >= 60 ? '✅ ' : '📝 '}正确率 {pct}% · {new Date(item.createdAt).toLocaleString('zh-CN')}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backBtn: { width: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#111' },
  headerSpacer: { width: 32 },
  loading: { marginTop: 60 },
  empty: { color: '#999', textAlign: 'center', marginTop: 60 },
  content: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  cardScore: { fontSize: 18, fontWeight: 'bold', color: '#22C55E' },
  cardMeta: { fontSize: 12, color: '#999', marginTop: 6 },
});
