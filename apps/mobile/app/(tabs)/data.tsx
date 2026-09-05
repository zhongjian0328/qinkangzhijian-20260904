import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function DataTab() {
  return (
    <FeaturePlaceholder
      title="数据看板"
      subtitle="多场数据聚合 · 生产 · 成本 · 经营分析"
      icon="stats-chart-outline"
      actions={[
        { label: '生产管理', desc: '存栏 / 产蛋 / 死亡 / 耗料数据', icon: 'stats-chart-outline', href: '/production' },
        { label: '禽舍管理', desc: '禽舍与环境数据', icon: 'business-outline', href: '/houses' },
      ]}
    />
  );
}
