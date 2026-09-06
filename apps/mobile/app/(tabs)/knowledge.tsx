import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { FarmingIndex, KnowledgeStats } from '@qinkang/types';
import { knowledgeApi, KnowledgeSearchResult } from '../../src/api/knowledge';

type Tab = 'disease' | 'farming';
const ALL = 'all';

const TABS: { key: Tab; label: string }[] = [
  { key: 'disease', label: '疾病防治' },
  { key: 'farming', label: '养鸡技巧' },
];

const PRESET_DISEASES = ['新城疫', '禽流感', '球虫病', '大肠杆菌病', '支原体病', '氨气中毒'];

export default function KnowledgeScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('disease');
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [farming, setFarming] = useState<FarmingIndex | null>(null);
  const [category, setCategory] = useState(ALL);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KnowledgeSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    knowledgeApi.stats().then(setStats).catch(() => setStats(null));
    knowledgeApi.farmingIndex().then(setFarming).catch(() => setFarming(null));
  }, []);

  const runSearch = useCallback(async (q: string) => {
    const kw = q.trim();
    if (!kw) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await knowledgeApi.searchDisease(kw);
      setResults(res.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const switchTab = (t: Tab) => {
    setTab(t);
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  const visibleCategories = useMemo(() => {
    if (!farming) return [];
    return category === ALL
      ? farming.categories
      : farming.categories.filter((c) => c.id === category);
  }, [farming, category]);

  const subtitle = stats
    ? `收录鸡病 ${stats.disease_count} 种 · 鸡病图片 ${stats.figure_count} 张 · 养鸡实用技巧 ${stats.tip_count} 篇`
    : '禽病防治教材 · 养鸡疑难问答';

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>养鸡知识库</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
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

        {tab === 'disease' ? (
          <>
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索病名或症状…"
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={() => runSearch(query)}
                returnKeyType="search"
              />
              <TouchableOpacity style={styles.searchBtn} onPress={() => runSearch(query)}>
                <Text style={styles.searchBtnText}>搜索</Text>
              </TouchableOpacity>
            </View>

            {!searched ? (
              <>
                <Text style={styles.sectionTitle}>常见鸡病</Text>
                <View style={styles.chipWrap}>
                  {PRESET_DISEASES.map((p) => (
                    <TouchableOpacity
                      key={p}
                      style={styles.chip}
                      onPress={() => {
                        setQuery(p);
                        runSearch(p);
                      }}
                    >
                      <Text style={styles.chipText}>{p}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.hint}>点击标签快速查询，或输入病名/症状搜索疾病防控知识。</Text>
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
          </>
        ) : (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryRow}
              contentContainerStyle={styles.categoryRowContent}
            >
              <TouchableOpacity
                style={[styles.categoryChip, category === ALL && styles.categoryChipActive]}
                onPress={() => setCategory(ALL)}
              >
                <Text
                  style={[styles.categoryChipText, category === ALL && styles.categoryChipTextActive]}
                >
                  全部{farming ? `（${farming.total}）` : ''}
                </Text>
              </TouchableOpacity>
              {(farming?.categories ?? []).map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.categoryChip, category === c.id && styles.categoryChipActive]}
                  onPress={() => setCategory(c.id)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      category === c.id && styles.categoryChipTextActive,
                    ]}
                  >
                    {c.name}（{c.count}）
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {!farming ? (
              <ActivityIndicator style={styles.loading} color="#22C55E" />
            ) : visibleCategories.length === 0 ? (
              <Text style={styles.empty}>暂无内容</Text>
            ) : (
              visibleCategories.map((c) => (
                <View key={c.id}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionHeaderText}>{c.name}</Text>
                    <Text style={styles.sectionHeaderCount}>{c.count} 篇</Text>
                  </View>
                  {c.articles.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={styles.card}
                      onPress={() =>
                        router.push({
                          pathname: '/farming-article/[id]',
                          params: { id: a.id, title: a.title },
                        })
                      }
                    >
                      <Text style={styles.cardTitle}>{a.title}</Text>
                      <Text style={styles.cardExcerpt} numberOfLines={3}>
                        {a.excerpt}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scroll: { paddingBottom: 40 },
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
  sectionTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16, paddingHorizontal: 20 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  chipText: { color: '#22C55E', fontSize: 14 },
  hint: { color: '#999', fontSize: 13, lineHeight: 20, paddingHorizontal: 20 },
  categoryRow: { flexGrow: 0, marginBottom: 12 },
  categoryRowContent: { paddingHorizontal: 20, gap: 8 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryChipActive: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  categoryChipText: { color: '#555', fontSize: 13 },
  categoryChipTextActive: { color: '#fff' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionHeaderText: { fontSize: 15, fontWeight: 'bold', color: '#22C55E' },
  sectionHeaderCount: { fontSize: 12, color: '#999' },
  loading: { marginTop: 30 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  cardExcerpt: { fontSize: 13, color: '#666', lineHeight: 20 },
});
