import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { getTabsForRole, type TabName } from '../../src/tabs';

const TAB_DEFS: { name: TabName; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', title: '首页', icon: 'home' },
  { name: 'diagnose', title: '诊断', icon: 'scan' },
  { name: 'mall', title: '商城', icon: 'cart' },
  { name: 'knowledge', title: '百科', icon: 'book' },
  { name: 'profile', title: '我的', icon: 'person' },
  { name: 'data', title: '数据', icon: 'stats-chart' },
  { name: 'purchase', title: '采购', icon: 'pricetags' },
  { name: 'manage', title: '管理', icon: 'settings' },
  { name: 'map', title: '地图', icon: 'map' },
  { name: 'policy', title: '政策', icon: 'megaphone' },
  { name: 'annotate', title: '标注', icon: 'pricetag' },
  { name: 'collab', title: '协作', icon: 'people' },
  { name: 'orders-pool', title: '接单', icon: 'clipboard' },
  { name: 'customers', title: '客户', icon: 'person-add' },
  { name: 'products', title: '商品', icon: 'cube' },
  { name: 'shop-orders', title: '订单', icon: 'receipt' },
  { name: 'intern', title: '实习', icon: 'create' },
  { name: 'teaching', title: '教学', icon: 'school' },
  { name: 'study', title: '学习', icon: 'library' },
];

export default function TabLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Redirect href="/login" />;
  }

  const visible = new Set(getTabsForRole(user?.role, user?.subRole));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
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

      {/* 旧版 Tab 页面：仍作为路由保留（首页等入口可跳转），但不再出现在底部 Tab 栏 */}
      <Tabs.Screen name="houses" options={{ href: null }} />
      <Tabs.Screen name="production" options={{ href: null }} />
      <Tabs.Screen name="services" options={{ href: null }} />
    </Tabs>
  );
}
