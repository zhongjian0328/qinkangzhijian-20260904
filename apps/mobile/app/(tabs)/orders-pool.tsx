import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function OrdersPoolTab() {
  return (
    <FeaturePlaceholder
      title="接单大厅"
      subtitle="诊疗服务接单 · 在线咨询 · 佣金"
      icon="clipboard-outline"
      actions={[
        { label: '诊疗接单大厅', desc: '查看并接取养殖户服务单', icon: 'clipboard-outline', href: '/service?tab=pool' },
        { label: '咨询大厅', desc: '回复养殖户在线咨询', icon: 'chatbubbles-outline', href: '/consult?tab=pool' },
        { label: '我的佣金', desc: '诊疗方案推荐返佣', icon: 'cash-outline', href: '/commissions' },
      ]}
    />
  );
}
