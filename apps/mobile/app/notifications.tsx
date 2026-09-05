import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Notification, NotificationType } from '@qinkang/types';
import { notificationApi } from '../src/api/notification';

const TYPE_META: Record<NotificationType, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  warning: { label: '预警', icon: 'warning', color: '#EF4444', bg: '#FEF2F2' },
  diagnosis: { label: '诊断', icon: 'checkmark-circle', color: '#10B981', bg: '#ECFDF5' },
  policy: { label: '政策', icon: 'document-text', color: '#2563EB', bg: '#EFF6FF' },
  order: { label: '订单', icon: 'cart', color: '#2563EB', bg: '#EFF6FF' },
  teaching: { label: '教学', icon: 'people', color: '#8B5CF6', bg: '#F5F3FF' },
  system: { label: '系统', icon: 'notifications', color: '#10B981', bg: '#ECFDF5' },
};

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'warning', label: '预警' },
  { key: 'system', label: '系统' },
  { key: 'teaching', label: '教学' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function tabOf(type: NotificationType): TabKey {
  if (type === 'warning') return 'warning';
  if (type === 'teaching') return 'teaching';
  return 'system';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  if (diffDays === 0) return hm;
  if (diffDays === 1) return `昨天 ${hm}`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [list, setList] = useState<Notification[]>([]);
  const [tab, setTab] = useState<TabKey>('all');
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    notificationApi
      .list()
      .then(setList)
      .catch(() => setList([]))
      .finally(() => setLoading(false));
    notificationApi
      .unreadCount()
      .then(setUnread)
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const markRead = async (id: string) => {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((c) => Math.max(0, c - 1));
    try {
      await notificationApi.markRead(id);
    } catch {
      load();
    }
  };

  const markAllRead = async () => {
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
    try {
      await notificationApi.markAllRead();
    } catch {
      load();
    }
  };

  const filtered = list.filter((n) => tab === 'all' || tabOf(n.type) === tab);

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#555" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>消息通知</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.navAction}>全部已读</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.typeTabs}>
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <TouchableOpacity key={t.key} style={styles.typeTab} onPress={() => setTab(t.key)}>
              <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{t.label}</Text>
              {t.key === 'all' && unread > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{unread}</Text>
                </View>
              ) : null}
              {active ? <View style={styles.typeTabIndicator} /> : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#22C55E" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={36} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>暂无消息</Text>
          <Text style={styles.emptyDesc}>有新的预警、诊断、政策、订单消息时会在这里通知您</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {filtered.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            return (
              <TouchableOpacity
                key={n.id}
                style={[styles.item, !n.read && styles.itemUnread]}
                onPress={() => markRead(n.id)}
              >
                <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
                  <Ionicons name={meta.icon} size={20} color={meta.color} />
                </View>
                <View style={styles.itemContent}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{n.title}</Text>
                    <Text style={styles.itemTime}>{formatTime(n.createdAt)}</Text>
                  </View>
                  <Text style={styles.itemDesc} numberOfLines={2}>
                    {n.content}
                  </Text>
                  <Text style={[styles.itemTag, { color: meta.color }]}>{meta.label}</Text>
                </View>
                {!n.read ? <View style={styles.dot} /> : null}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  navAction: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
  typeTabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  typeTab: { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  typeTabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  typeTabTextActive: { color: '#22C55E' },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: '28%',
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  countText: { color: '#fff', fontSize: 10 },
  typeTabIndicator: {
    position: 'absolute',
    bottom: -1,
    width: 32,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#22C55E',
  },
  list: { padding: 20, paddingBottom: 40 },
  item: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    position: 'relative',
  },
  itemUnread: { backgroundColor: '#F0FDF4', borderColor: 'rgba(34,197,94,0.15)' },
  iconWrap: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemContent: { flex: 1, minWidth: 0 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B', flexShrink: 1 },
  itemTime: { fontSize: 11, color: '#94A3B8', marginLeft: 8, flexShrink: 0 },
  itemDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  itemTag: { fontSize: 10, fontWeight: '600', marginTop: 6 },
  dot: { position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 20 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1E293B', marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});
