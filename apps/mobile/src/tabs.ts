// 角色差异化底部 Tab 配置 —— 对齐《禽康智检APP_多角色业务逻辑说明书》第五章「底部导航Tab对照表（统一 5 个）」
// v3.9：8 角色 × 5 Tab，每角色新增「AI问诊」= AI 对话问诊入口（对齐《AI对话问诊开发文档_豆包2.1turbo》）
import type { MainRole, SubRole } from '@qinkang/types';

export const TAB_NAMES = [
  'index',
  'diagnose',
  'consult',
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
 * - 个体养殖户：首页 / 诊断 / 问诊 / 百科 / 我的
 * - 合作社·企业：首页 / 数据 / 采购 / 问诊 / 管理
 * - 疫控机构：首页 / 地图 / 政策 / 问诊 / 管理
 * - 科研院所：首页 / 标注 / 协作 / 问诊 / 我的
 * - 兽医服务商：首页 / 接单 / 客户 / 问诊 / 我的
 * - 兽药·设备商：首页 / 商品 / 订单 / 问诊 / 管理
 * - 教师·导师：首页 / 实习 / 教学 / 问诊 / 我的
 * - 学生：首页 / 学习 / 实习 / 问诊 / 我的
 */
export function getTabsForRole(role?: MainRole | null, subRole?: SubRole | null): TabName[] {
  switch (role) {
    case 'admin':
      return ['index', 'diagnose', 'consult', 'knowledge', 'profile'];
    case 'merchant':
      return ['index', 'products', 'shop-orders', 'consult', 'manage'];
    case 'vet':
    case 'technician':
      return ['index', 'orders-pool', 'customers', 'consult', 'profile'];
    case 'institution':
      if (subRole === 'teacher') return ['index', 'intern', 'teaching', 'consult', 'profile'];
      if (subRole === 'research') return ['index', 'annotate', 'collab', 'consult', 'profile'];
      return ['index', 'map', 'policy', 'consult', 'manage']; // cdc 疫控机构
    case 'student':
      return ['index', 'study', 'intern', 'consult', 'profile'];
    case 'farmer':
    default:
      if (subRole === 'enterprise' || subRole === 'cooperative') {
        return ['index', 'data', 'purchase', 'consult', 'manage'];
      }
      return ['index', 'diagnose', 'consult', 'knowledge', 'profile'];
  }
}
