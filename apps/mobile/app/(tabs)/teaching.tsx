import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function TeachingTab() {
  return (
    <FeaturePlaceholder
      title="教学管理"
      subtitle="课程 · 组卷 · 师生协同 · 评价"
      icon="school-outline"
      actions={[
        { label: '实习日志', desc: '学生日志查看与批注', icon: 'create-outline', href: '/intern' },
        { label: '题库测验', desc: '题库练习与考试', icon: 'book-outline', href: '/quiz' },
      ]}
    />
  );
}
