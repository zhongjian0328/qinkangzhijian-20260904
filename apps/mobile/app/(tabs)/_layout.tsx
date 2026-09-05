import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';
import { getTabsForRole, type TabName } from '../../src/tabs';

const TAB_DEFS: { name: TabName; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'index', title: '首页', icon: 'home' },
  { name: 'diagnose', title: '诊断', icon: 'scan' },
  { name: 'consult', title: '问诊', icon: 'chatbubbles' },
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

const LEGACY_HIDDEN: string[] = ['houses', 'production', 'services'];

export default function TabLayout() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  if (!token) {
    return <Redirect href="/login" />;
  }

  // 可见 Tab 按角色顺序渲染（保证底部栏顺序与说明书一致）
  const visible = getTabsForRole(user?.role, user?.subRole);
  const visibleDefs = visible
    .map((name) => TAB_DEFS.find((t) => t.name === name))
    .filter(Boolean) as { name: TabName; title: string; icon: keyof typeof Ionicons.glyphMap }[];
  const hiddenDefs = TAB_DEFS.filter((t) => !visible.includes(t.name));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      {visibleDefs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, size }) => (
              <Ionicons name={tab.icon} size={size} color={color} />
            ),
          }}
        />
      ))}

      {hiddenDefs.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{ href: null }} />
      ))}

      {/* 旧版 Tab 页面：仍作为路由保留（首页等入口可跳转），但不再出现在底部 Tab 栏 */}
      {LEGACY_HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name as any} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
