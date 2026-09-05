// 角色差异化底部 Tab 配置 —— 对齐《多角色业务逻辑说明书》第五章「底部导航Tab对照表」，
// 用现有已实现的页面映射各角色 Tab（地图/政策/标注/协作/客户/商品/订单管理等未建页面留待后续子阶段接入）。
import type { MainRole, SubRole } from '@qinkang/types';

export const TAB_NAMES = ['index', 'diagnose', 'houses', 'production', 'knowledge', 'services', 'profile'] as const;

export type TabName = (typeof TAB_NAMES)[number];

/**
 * 返回当前角色应显示的底部 Tab 列表。
 * 说明书 8 角色 → 现有页面映射：
 * - 个体养殖户：首页/诊断/禽舍/生产/服务/我的
 * - 合作社/企业：同养殖户
 * - 疫控机构：首页/知识库/我的（疫情上报在「我的」内）
 * - 科研院所：首页/知识库/我的
 * - 兽医服务商：首页/诊断/服务(接单)/知识库/我的
 * - 兽药/设备商：首页/服务(商城)/知识库/我的
 * - 教师/导师：首页/知识库/服务(教学)/我的
 * - 学生：首页/诊断/知识库/服务/我的
 */
export function getTabsForRole(role?: MainRole | null, subRole?: SubRole | null): TabName[] {
  switch (role) {
    case 'admin':
      return ['index', 'diagnose', 'houses', 'production', 'knowledge', 'services', 'profile'];
    case 'merchant':
      return ['index', 'services', 'knowledge', 'profile'];
    case 'vet':
    case 'technician':
      return ['index', 'diagnose', 'services', 'knowledge', 'profile'];
    case 'institution':
      if (subRole === 'teacher') return ['index', 'knowledge', 'services', 'profile'];
      return ['index', 'knowledge', 'profile'];
    case 'student':
      return ['index', 'diagnose', 'knowledge', 'services', 'profile'];
    case 'farmer':
    default:
      return ['index', 'diagnose', 'houses', 'production', 'services', 'profile'];
  }
}
