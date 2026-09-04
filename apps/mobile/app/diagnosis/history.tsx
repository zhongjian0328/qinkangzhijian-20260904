import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Diagnosis } from '@qinkang/types';
import { diagnosisApi } from '../../src/api/diagnosis';
import { assetUrl } from '../../src/api/client';

const PAGE_SIZE = 20;

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

export default function DiagnosisHistoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<Diagnosis[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const list = await diagnosisApi.list({ take: PAGE_SIZE, skip: 0 });
      setItems(list);
      setSkip(list.length);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const list = await diagnosisApi.list({ take: PAGE_SIZE, skip });
      setItems((prev) => [...prev, ...list]);
      setSkip((s) => s + list.length);
      setHasMore(list.length === PAGE_SIZE);
    } catch {
      // 加载更多失败静默处理
    } finally {
      setLoadingMore(false);
    }
  }, [loading, loadingMore, hasMore, skip]);

  useFocusEffect(
    useCallback(() => {
      loadInitial();
    }, [loadInitial]),
  );

  const renderItem = ({ item }: { item: Diagnosis }) => {
    const status = STATUS_LABEL[item.status] ?? STATUS_LABEL.pending;
    const disease =
      item.status === 'completed' && item.aiResult?.disease
        ? item.aiResult.disease
        : status.text;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/diagnosis/${item.id}`)}
      >
        {item.imageUrls?.length ? (
          <Image source={{ uri: assetUrl(item.imageUrls[0]) }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Text style={styles.thumbPlaceholderText}>🐔</Text>
          </View>
        )}
        <View style={styles.main}>
          <Text style={styles.disease} numberOfLines={1}>
            {disease}
          </Text>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={[styles.status, { color: status.color }]}>{status.text}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>诊断历史</Text>
        <View style={styles.headerSpacer} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loading} color="#22C55E" />
          ) : (
            <Text style={styles.empty}>暂无诊断记录</Text>
          )
        }
        ListFooterComponent={
          loadingMore ? <ActivityIndicator style={styles.loadingMore} color="#22C55E" /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  back: { fontSize: 16, color: '#22C55E', fontWeight: '600', width: 60 },
  title: { fontSize: 18, fontWeight: 'bold' },
  headerSpacer: { width: 60 },
  list: { padding: 16 },
  loading: { marginTop: 40 },
  loadingMore: { paddingVertical: 16 },
  empty: { color: '#999', textAlign: 'center', padding: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 12 },
  thumbPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbPlaceholderText: { fontSize: 24 },
  main: { flex: 1, marginRight: 12 },
  disease: { fontSize: 16, fontWeight: '600', color: '#111' },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  status: { fontSize: 13, fontWeight: 'bold' },
});
