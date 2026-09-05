import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function ShopOrdersTab() {
  return (
    <FeaturePlaceholder
      title="订单管理"
      subtitle="订单处理 · 发货 · 退款 · 售后"
      icon="receipt-outline"
      actions={[
        { label: '订单处理', desc: '确认 · 发货 · 退款', icon: 'receipt-outline', href: '/merchant/orders' },
        { label: '商家工作台', desc: '看板 · 商品 · 询价报价', icon: 'storefront-outline', href: '/merchant' },
      ]}
    />
  );
}
