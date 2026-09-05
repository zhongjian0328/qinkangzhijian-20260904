import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { knowledgeApi } from '../../src/api/knowledge';
import { assetUrl } from '../../src/api/client';
import { AtlasDisease } from '@qinkang/types';

export default function AtlasDiseaseScreen() {
  const router = useRouter();
  const { atlas: atlasId, disease } = useLocalSearchParams<{ atlas: string; disease: string }>();
  const [detail, setDetail] = useState<AtlasDisease | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await knowledgeApi.atlas();
      const atlas = data.atlases.find((a) => a.id === atlasId);
      const found = atlas?.diseases.find((d) => d.title === disease);
      setDetail(found ?? null);
    } catch {
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [atlasId, disease]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {disease || '图谱详情'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : !detail ? (
        <Text style={styles.empty}>未找到该病种的图谱图注</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>{detail.title}</Text>
          <Text style={styles.subtitle}>共 {detail.figures.length} 条典型病变图注</Text>
          {detail.figures.map((f, i) => (
            <View key={i} style={styles.card}>
              {f.image ? (
                <Image
                  source={{ uri: assetUrl(f.image) }}
                  style={styles.image}
                  resizeMode="contain"
                />
              ) : null}
              <Text style={styles.caption}>{f.text}</Text>
            </View>
          ))}
        </ScrollView>
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
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#999', marginBottom: 16 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  image: { width: '100%', height: 220, borderRadius: 8, backgroundColor: '#f0f0f0' },
  caption: { fontSize: 14, color: '#333', lineHeight: 22, marginTop: 10, alignSelf: 'stretch' },
});
