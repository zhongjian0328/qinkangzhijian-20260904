import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { learningApi } from '../../src/api/learning';
import { useAuthStore } from '../../src/store/auth';
import { InternLog } from '@qinkang/types';

const isMentor = (role?: string, subRole?: string | null) =>
  role === 'admin' || subRole === 'teacher';

export default function InternLogListScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const mentor = isMentor(user?.role, user?.subRole);
  const [logs, setLogs] = useState<InternLog[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await learningApi.internLogs());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>实习日志</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : (
        <FlatList
          data={logs}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.content}
          ListEmptyComponent={<Text style={styles.empty}>暂无实习日志</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push({ pathname: '/intern/[id]', params: { id: item.id } })}
            >
              <View style={styles.cardRow}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.badge, item.status === 'reviewed' ? styles.badgeReviewed : styles.badgeSubmitted]}>
                  <Text style={styles.badgeText}>{item.status === 'reviewed' ? '已批注' : '待批注'}</Text>
                </View>
              </View>
              <Text style={styles.cardMeta}>
                {mentor && item.studentName ? `${item.studentName} · ` : ''}
                {new Date(item.logDate).toLocaleDateString('zh-CN')}
              </Text>
              {item.mentorComment ? (
                <Text style={styles.comment} numberOfLines={2}>导师批注：{item.mentorComment}</Text>
              ) : null}
            </TouchableOpacity>
          )}
        />
      )}

      {!mentor ? (
        <TouchableOpacity style={styles.fab} onPress={() => router.push('/intern/new')}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      ) : null}
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
  content: { padding: 16, paddingBottom: 100 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#111', marginRight: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeReviewed: { backgroundColor: '#f0fdf4' },
  badgeSubmitted: { backgroundColor: '#fef3c7' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#22C55E' },
  cardMeta: { fontSize: 12, color: '#999', marginTop: 6 },
  comment: { fontSize: 13, color: '#666', marginTop: 6, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});
