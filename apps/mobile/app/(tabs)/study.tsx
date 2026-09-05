import FeaturePlaceholder from '../../src/components/FeaturePlaceholder';

export default function StudyTab() {
  return (
    <FeaturePlaceholder
      title="学习中心"
      subtitle="课程学习 · 题库训练 · 疾病知识"
      icon="library-outline"
      actions={[
        { label: '课程学习', desc: '课程浏览与学习进度', icon: 'book-outline', href: '/course' },
        { label: '在线考试', desc: '已发布试卷练习', icon: 'create-outline', href: '/exam-paper' },
        { label: '题库测验', desc: '答题训练与考试判分', icon: 'book-outline', href: '/quiz' },
        { label: '疾病知识库', desc: '62 种禽病查询与学习', icon: 'medkit-outline', href: '/knowledge' },
        { label: '图谱百科', desc: '病理图谱看图识病', icon: 'images-outline', href: '/atlas' },
      ]}
    />
  );
}
