import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function PurchaseTab() {
  return (
    <FeaturePlaceholder
      title="大宗采购"
      subtitle="发布询价单 · 供应商竞价 · 比价定标"
      icon="pricetags-outline"
      actions={[
        { label: '发布询价单', desc: '批量采购需求，多家供应商竞价', icon: 'pricetags-outline', href: '/bulk-purchase' },
        { label: '兽药商城', desc: '零售采购兽药 / 疫苗 / 饲料', icon: 'cart-outline', href: '/mall' },
      ]}
    />
  );
}
