import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function ProductsTab() {
  return (
    <FeaturePlaceholder
      title="商品管理"
      subtitle="商品上架 · 定价 · 促销 · 库存"
      icon="cube-outline"
      actions={[
        { label: '商品管理', desc: '上架 / 改价 / 促销 / 库存', icon: 'cube-outline', href: '/merchant/products' },
        { label: '商家工作台', desc: '看板 · 订单 · 询价报价', icon: 'storefront-outline', href: '/merchant' },
      ]}
    />
  );
}
