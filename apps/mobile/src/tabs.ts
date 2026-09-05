// 角色差异化底部 Tab 配置 —— 对齐《禽康智检APP_多角色业务逻辑说明书》第五章「底部导航Tab对照表」
// （说明书 976-983 行：8 角色 × 4 语义 Tab）
import type { MainRole, SubRole } from '@qinkang/types';

export const TAB_NAMES = [
  'index',
  'diagnose',
  'mall',
  'knowledge',
  'profile',
  'data',
  'purchase',
  'manage',
  'map',
  'policy',
  'annotate',
  'collab',
  'orders-pool',
  'customers',
  'products',
  'shop-orders',
  'intern',
  'teaching',
  'study',
] as const;

export type TabName = (typeof TAB_NAMES)[number];

/**
 * 返回当前角色应显示的底部 Tab 列表（按说明书第五章的顺序）。
 * - 个体养殖户：首页 / 诊断 / 百科 / 我的
 * - 合作社·企业：首页 / 数据 / 采购 / 管理
 * - 疫控机构：首页 / 地图 / 政策 / 管理
 * - 科研院所：首页 / 标注 / 协作 / 我的
 * - 兽医服务商：首页 / 接单 / 客户 / 我的
 * - 兽药·设备商：首页 / 商品 / 订单 / 管理
 * - 教师·导师：首页 / 实习 / 教学 / 我的
 * - 学生：首页 / 学习 / 实习 / 我的
 */
export function getTabsForRole(role?: MainRole | null, subRole?: SubRole | null): TabName[] {
  switch (role) {
    case 'admin':
      return ['index', 'diagnose', 'knowledge', 'profile'];
    case 'merchant':
      return ['index', 'products', 'shop-orders', 'manage'];
    case 'vet':
    case 'technician':
      return ['index', 'orders-pool', 'customers', 'profile'];
    case 'institution':
      if (subRole === 'teacher') return ['index', 'intern', 'teaching', 'profile'];
      if (subRole === 'research') return ['index', 'annotate', 'collab', 'profile'];
      return ['index', 'map', 'policy', 'manage']; // cdc 疫控机构
    case 'student':
      return ['index', 'study', 'intern', 'profile'];
    case 'farmer':
    default:
      if (subRole === 'enterprise' || subRole === 'cooperative') {
        return ['index', 'data', 'purchase', 'manage'];
      }
      return ['index', 'diagnose', 'knowledge', 'profile'];
  }
}
