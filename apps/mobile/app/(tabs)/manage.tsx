import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function ManageTab() {
  return (
    <FeaturePlaceholder
      title="管理中心"
      subtitle="审核 · 人员 · 设备 · 组织管理"
      icon="settings-outline"
      actions={[
        { label: '个人中心', desc: '个人信息 · 数据统计 · 设置', icon: 'person-outline', href: '/profile' },
        { label: '身份认证', desc: '实名 / 资质认证', icon: 'shield-checkmark-outline', href: '/certification' },
        { label: '消息通知', desc: '预警 · 政策 · 订单消息', icon: 'notifications-outline', href: '/notifications' },
      ]}
    />
  );
}
