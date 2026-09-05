import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Course, CourseChapter } from '@qinkang/types';
import { courseApi } from '../src/api/course';
import { useAuthStore } from '../src/store/auth';

function isTeacher(user: { role: string; subRole?: string | null } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.subRole === 'teacher';
}

export default function CourseScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const teacher = isTeacher(user);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [chapters, setChapters] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCourses(await courseApi.list());
      if (!teacher) {
        const p = await courseApi.myProgress();
        const m: Record<string, number> = {};
        p.forEach((x) => (m[x.courseId] = x.progress));
        setProgressMap(m);
      }
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [teacher]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const parseChapters = (text: string): CourseChapter[] =>
    text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        const i = l.indexOf('|');
        return i >= 0 ? { title: l.slice(0, i).trim(), content: l.slice(i + 1).trim() } : { title: l, content: '' };
      });

  const submit = async () => {
    if (!title.trim()) return Alert.alert('提示', '请填写课程标题');
    setSaving(true);
    try {
      await courseApi.create({
        title: title.trim(),
        subject: subject.trim() || undefined,
        description: description.trim() || undefined,
        chapters: parseChapters(chapters),
        status: 'published',
      });
      setTitle('');
      setSubject('');
      setDescription('');
      setChapters('');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('创建失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const markStudy = async (course: Course) => {
    const cur = progressMap[course.id] ?? 0;
    const next = Math.min(100, cur + 10);
    try {
      await courseApi.updateProgress(course.id, { progress: next });
      setProgressMap((m) => ({ ...m, [course.id]: next }));
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除课程', '确定删除该课程吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await courseApi.remove(id);
            await load();
          } catch (e) {
            Alert.alert('删除失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>课程{teacher ? '管理' : '学习'}</Text>
        {teacher ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
            <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 建课'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.sub}>{teacher ? '课程创建 · 章节内容管理' : '课程学习 · 进度追踪'}</Text>

      {showForm && teacher && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>课程标题 *</Text>
          <TextInput style={styles.input} placeholder="如：禽病诊断学基础" value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="学科（如：兽医传染病学）" value={subject} onChangeText={setSubject} />
          <TextInput style={styles.input} placeholder="课程简介" value={description} onChangeText={setDescription} />
          <Text style={styles.fieldLabel}>章节（每行一章，格式：章节名|内容）</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder={'第一章|绪论\n第二章|禽病诊断方法'} multiline value={chapters} onChangeText={setChapters} />
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>创建课程</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : courses.length === 0 ? (
        <Text style={styles.empty}>{teacher ? '暂无课程，点击右上角建课' : '暂无已发布课程'}</Text>
      ) : (
        courses.map((c) => {
          const open = expanded === c.id;
          const chapters = (c.chapters as CourseChapter[]) ?? [];
          const progress = progressMap[c.id] ?? 0;
          return (
            <View key={c.id} style={styles.card}>
              <TouchableOpacity onPress={() => setExpanded(open ? null : c.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.cardTitle}>{c.title}</Text>
                    {c.subject ? <Text style={styles.farm}>{c.subject}</Text> : null}
                  </View>
                  {c.status === 'draft' ? <Text style={[styles.badge, { color: '#F59E0B' }]}>草稿</Text> : null}
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{chapters.length} 章</Text>
                  {c.teacherName ? <Text style={styles.meta}>教师：{c.teacherName}</Text> : null}
                  {!teacher ? <Text style={styles.meta}>进度 {progress}%</Text> : null}
                </View>
              </TouchableOpacity>
              {open && (
                <View style={styles.detail}>
                  {c.description ? <Text style={styles.detailText}>{c.description}</Text> : null}
                  {chapters.length > 0 && (
                    <View style={styles.chapterList}>
                      {chapters.map((ch, i) => (
                        <Text key={i} style={styles.chapterItem}>第{i + 1}章 {ch.title}{ch.content ? `：${ch.content}` : ''}</Text>
                      ))}
                    </View>
                  )}
                  <View style={styles.actionRow}>
                    {!teacher && (
                      <TouchableOpacity onPress={() => markStudy(c)}>
                        <Text style={styles.actionText}>标记学习 +10%</Text>
                      </TouchableOpacity>
                    )}
                    {teacher && (
                      <TouchableOpacity onPress={() => confirmDelete(c.id)}>
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>删除</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14, backgroundColor: '#22C55E' },
  back: { color: '#fff', fontSize: 16, width: 64 },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' },
  placeholder: { width: 64 },
  addButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  sub: { fontSize: 13, color: '#666', marginHorizontal: 16, marginTop: 10, marginBottom: 12 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#e0e0e0', borderRadius: 10, padding: 12, fontSize: 14, marginBottom: 8, color: '#333', backgroundColor: '#fff' },
  multiline: { height: 90, textAlignVertical: 'top' },
  submitButton: { padding: 14, borderRadius: 10, backgroundColor: '#22C55E', alignItems: 'center', justifyContent: 'center', minHeight: 48, marginTop: 12 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 20, paddingHorizontal: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, marginHorizontal: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  nameWrap: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  farm: { fontSize: 12, color: '#666', marginTop: 2 },
  badge: { fontSize: 13, fontWeight: 'bold' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  meta: { fontSize: 12, color: '#999' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  detailText: { fontSize: 13, color: '#333', marginBottom: 6 },
  chapterList: { marginBottom: 6 },
  chapterItem: { fontSize: 13, color: '#444', marginBottom: 4, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  actionText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});
