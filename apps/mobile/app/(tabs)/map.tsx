import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function MapTab() {
  return (
    <FeaturePlaceholder
      title="疫情地图"
      subtitle="全域疫情热力图 · 区域下钻 · 监测预警"
      icon="map-outline"
      actions={[
        { label: '疫情上报', desc: '疫情病例上报登记', icon: 'warning-outline', href: '/epidemic/report' },
        { label: '疫情统计', desc: '区域疫情数据聚合', icon: 'bar-chart-outline', href: '/epidemic/statistics' },
      ]}
    />
  );
}
