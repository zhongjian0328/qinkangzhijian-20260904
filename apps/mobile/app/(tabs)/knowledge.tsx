import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { knowledgeApi, KnowledgeSearchResult } from '../../src/api/knowledge';

type Tab = 'disease' | 'farming';

const TABS: { key: Tab; label: string }[] = [
  { key: 'disease', label: '疾病防治' },
  { key: 'farming', label: '养鸡问答' },
];

const PRESET_DISEASES = ['新城疫', '禽流感', '球虫病', '大肠杆菌病', '支原体病', '氨气中毒'];
const PRESET_FARMING = ['育雏温度', '免疫程序', '产蛋下降', '强制换羽', '断喙', '消毒'];

export default function KnowledgeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('disease');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = useCallback(
    async (q: string, activeTab: Tab) => {
      const kw = q.trim();
      if (!kw) return;
      setLoading(true);
      setSearched(true);
      try {
        const res =
          activeTab === 'disease'
            ? await knowledgeApi.searchDisease(kw)
            : await knowledgeApi.searchFarming(kw);
        setResults(res.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const switchTab = (t: Tab) => {
    setTab(t);
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const presets = tab === 'disease' ? PRESET_DISEASES : PRESET_FARMING;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>养鸡知识库</Text>
        <Text style={styles.subtitle}>禽病防治教材 62 章 · 养鸡疑难 300 问</Text>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => switchTab(t.key)}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={tab === 'disease' ? '搜索病名或症状…' : '搜索养鸡问题…'}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => runSearch(query, tab)}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => runSearch(query, tab)}>
          <Text style={styles.searchBtnText}>搜索</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!searched ? (
          <>
            <Text style={styles.presetTitle}>常见问题</Text>
            <View style={styles.chipWrap}>
              {presets.map((p) => (
                <TouchableOpacity
                  key={p}
                  style={styles.chip}
                  onPress={() => {
                    setQuery(p);
                    runSearch(p, tab);
                  }}
                >
                  <Text style={styles.chipText}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.hint}>
              点击标签快速查询，或输入关键词搜索{tab === 'disease' ? '疾病防控知识' : '养殖管理问答'}。
            </Text>
          </>
        ) : loading ? (
          <ActivityIndicator style={styles.loading} color="#22C55E" />
        ) : results.length === 0 ? (
          <Text style={styles.empty}>未找到相关内容，换个关键词试试</Text>
        ) : (
          results.map((r) => (
            <TouchableOpacity
              key={r.id}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/knowledge/[id]',
                  params: { id: r.id, title: r.title, tab },
                })
              }
            >
              <Text style={styles.cardTitle}>{r.title}</Text>
              <Text style={styles.cardExcerpt} numberOfLines={3}>
                {r.excerpt}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4 },
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
  searchRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 12 },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
  },
  searchBtn: {
    paddingHorizontal: 18,
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: '#22C55E',
  },
  searchBtnText: { color: '#fff', fontWeight: 'bold' },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  presetTitle: { fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  chipText: { color: '#22C55E', fontSize: 14 },
  hint: { color: '#999', fontSize: 13, lineHeight: 20 },
  loading: { marginTop: 30 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  cardExcerpt: { fontSize: 13, color: '#666', lineHeight: 20 },
});
