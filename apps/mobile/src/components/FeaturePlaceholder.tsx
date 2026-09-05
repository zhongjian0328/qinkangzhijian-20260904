import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export interface FeatureAction {
  label: string;
  desc?: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
}

/**
 * 通用「Tab 占位/入口页」：顶部绿色 header + 底部若干功能入口卡片。
 * 用于补齐《多角色业务逻辑说明书》第五章中各角色尚未建设的功能 Tab。
 */
export default function FeaturePlaceholder({
  title,
  subtitle,
  icon,
  actions = [],
}: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  actions?: FeatureAction[];
}) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {actions.length > 0 ? (
          actions.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => router.push(a.href)}
            >
              <View style={styles.iconBox}>
                <Ionicons name={a.icon} size={22} color="#22C55E" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{a.label}</Text>
                {a.desc ? <Text style={styles.cardDesc}>{a.desc}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color="#ccc" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name={icon} size={44} color="#22C55E" />
            </View>
            <Text style={styles.emptyTitle}>{title}</Text>
            <Text style={styles.emptyDesc}>{subtitle}</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>该模块将在后续版本上线</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#22C55E' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: '#e0ffe0', marginTop: 4 },
  content: { padding: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  cardDesc: { fontSize: 13, color: '#999', marginTop: 3 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 20 },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#111', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#666', lineHeight: 22, textAlign: 'center' },
  comingSoonBadge: {
    marginTop: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  comingSoonText: { fontSize: 12, color: '#94A3B8' },
});
