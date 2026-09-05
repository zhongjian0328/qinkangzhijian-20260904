import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { getTabsForRole, type TabName } from '../../src/tabs';

const TAB_DEFS: { name: TabName; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', title: '首页', icon: 'home-outline' },
  { name: 'diagnose', title: 'AI诊断', icon: 'scan-outline' },
  { name: 'houses', title: '禽舍', icon: 'business-outline' },
  { name: 'production', title: '生产', icon: 'stats-chart-outline' },
  { name: 'knowledge', title: '知识库', icon: 'book-outline' },
  { name: 'services', title: '服务', icon: 'grid-outline' },
  { name: 'profile', title: '我的', icon: 'person-outline' },
];

export default function TabLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Redirect href="/login" />;
  }

  const visible = new Set(getTabsForRole(user?.role, user?.subRole));

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      {TAB_DEFS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            href: visible.has(tab.name) ? undefined : null,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
