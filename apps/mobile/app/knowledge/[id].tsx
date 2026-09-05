import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { knowledgeApi, ChapterDetail } from '../../src/api/knowledge';

export default function KnowledgeChapterScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    knowledgeApi
      .chapter(id)
      .then(setChapter)
      .catch((e) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title || chapter?.title || '知识详情'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator style={styles.loading} color="#22C55E" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : chapter ? (
          <>
            <Text style={styles.title}>{chapter.title}</Text>

            {chapter.figures?.length ? (
              <View style={styles.figuresCard}>
                <Text style={styles.figuresLabel}>图谱诊断要点</Text>
                {chapter.figures.map((f, i) => (
                  <View key={i}>
                    <Text style={styles.figuresTitle}>{f.title}</Text>
                    <Text style={styles.figuresText}>{f.text}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Text style={styles.body}>{chapter.text}</Text>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: 'bold', color: '#111' },
  headerSpacer: { width: 30 },
  content: { padding: 20, paddingBottom: 40 },
  loading: { marginTop: 40 },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 16 },
  figuresCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  figuresLabel: { fontSize: 14, fontWeight: 'bold', color: '#16A34A', marginBottom: 6 },
  figuresTitle: { fontSize: 13, color: '#166534', fontWeight: '600', marginTop: 6 },
  figuresText: { fontSize: 13, color: '#334155', lineHeight: 21, marginTop: 2 },
  body: { fontSize: 14, color: '#333', lineHeight: 24 },
});
