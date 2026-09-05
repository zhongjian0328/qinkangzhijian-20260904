import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { knowledgeApi } from '../src/api/knowledge';
import { AtlasIndex } from '@qinkang/types';

export default function AtlasScreen() {
  const router = useRouter();
  const [data, setData] = useState<AtlasIndex | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await knowledgeApi.atlas());
    } catch {
      setData(null);
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
        <Text style={styles.title}>图谱百科</Text>
        <Text style={styles.subtitle}>禽类典型病理图谱 · 剖检对照定位</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : !data || data.atlases.length === 0 ? (
        <Text style={styles.empty}>暂无图谱数据</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {data.atlases.map((atlas) => (
            <View key={atlas.id} style={styles.atlasBlock}>
              <Text style={styles.atlasTitle}>
                {atlas.name}
                <Text style={styles.atlasCount}>  {atlas.diseases.length} 病种</Text>
              </Text>
              {atlas.diseases.map((d) => (
                <TouchableOpacity
                  key={d.title}
                  style={styles.diseaseCard}
                  onPress={() =>
                    router.push({
                      pathname: '/atlas/[disease]',
                      params: { atlas: atlas.id, disease: d.title },
                    })
                  }
                >
                  <View style={styles.diseaseInfo}>
                    <Text style={styles.diseaseTitle}>{d.title}</Text>
                    <Text style={styles.diseaseMeta}>{d.figures.length} 张病变图注</Text>
                  </View>
                  <Text style={styles.arrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4 },
  loading: { marginTop: 40 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
  content: { padding: 16, paddingBottom: 40 },
  atlasBlock: { marginBottom: 20 },
  atlasTitle: { fontSize: 16, fontWeight: 'bold', color: '#22C55E', marginBottom: 10, marginLeft: 4 },
  atlasCount: { fontSize: 12, fontWeight: 'normal', color: '#999' },
  diseaseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  diseaseInfo: { flex: 1 },
  diseaseTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 4 },
  diseaseMeta: { fontSize: 12, color: '#999' },
  arrow: { fontSize: 18, color: '#999', marginLeft: 8 },
});
