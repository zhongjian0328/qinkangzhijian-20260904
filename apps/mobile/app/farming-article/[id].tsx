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
import { FarmingArticle } from '@qinkang/types';
import { knowledgeApi } from '../../src/api/knowledge';

function cleanContent(raw: string): string {
  return raw
    .split('\n')
    .map((line) => {
      const t = line.replace(/\*\*/g, '');
      return t.replace(/^-\s+/, '• ');
    })
    .join('\n');
}

export default function FarmingArticleScreen() {
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const [article, setArticle] = useState<FarmingArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    knowledgeApi
      .farmingArticle(id)
      .then(setArticle)
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
          {title || article?.title || '养鸡技巧'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator style={styles.loading} color="#22C55E" />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : article ? (
          <>
            <Text style={styles.title}>{article.title}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryTagText}>{article.category}</Text>
            </View>
            <Text style={styles.body}>{cleanContent(article.content)}</Text>
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
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 12, lineHeight: 30 },
  categoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 16,
  },
  categoryTagText: { fontSize: 12, color: '#16A34A', fontWeight: '600' },
  body: { fontSize: 15, color: '#333', lineHeight: 26 },
});
