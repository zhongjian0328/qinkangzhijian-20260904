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
import { ExamPaper } from '@qinkang/types';
import { examPaperApi } from '../src/api/exam-paper';
import { useAuthStore } from '../src/store/auth';

const DIFFICULTIES = [
  { key: 'easy', label: '简单' },
  { key: 'medium', label: '中等' },
  { key: 'hard', label: '困难' },
];

function isTeacher(user: { role: string; subRole?: string | null } | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.subRole === 'teacher';
}

export default function ExamPaperScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const teacher = isTeacher(user);
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Record<string, any[]>>({});

  const [title, setTitle] = useState('');
  const [chapter, setChapter] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState('10');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPapers(await examPaperApi.list());
    } catch {
      setPapers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const submit = async () => {
    if (!title.trim()) return Alert.alert('提示', '请填写试卷标题');
    setSaving(true);
    try {
      await examPaperApi.compose({
        title: title.trim(),
        chapter: chapter.trim() || undefined,
        difficulty,
        count: parseInt(count, 10) || 10,
        duration: duration.trim() ? parseInt(duration, 10) : undefined,
      });
      setTitle('');
      setChapter('');
      setCount('10');
      setDuration('');
      setShowForm(false);
      await load();
      Alert.alert('组卷成功', '已从题库自动抽题生成试卷');
    } catch (e) {
      Alert.alert('组卷失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const toggleDetail = async (id: string) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!questions[id]) {
      try {
        const d = await examPaperApi.detail(id);
        setQuestions((m) => ({ ...m, [id]: d.questions ?? [] }));
      } catch {
        setQuestions((m) => ({ ...m, [id]: [] }));
      }
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('删除试卷', '确定删除该试卷吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await examPaperApi.remove(id);
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
        <Text style={styles.title}>{teacher ? '考试组卷' : '在线考试'}</Text>
        {teacher ? (
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
            <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 组卷'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.sub}>{teacher ? '题库抽题 · 智能组卷 · 发布考试' : '已发布试卷 · 在线练习'}</Text>

      {showForm && teacher && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>试卷标题 *</Text>
          <TextInput style={styles.input} placeholder="如：禽病期中考试卷" value={title} onChangeText={setTitle} />
          <TextInput style={styles.input} placeholder="章节范围（如：ch04，留空=全部）" value={chapter} onChangeText={setChapter} />
          <Text style={styles.fieldLabel}>难度</Text>
          <View style={styles.chipRow}>
            {DIFFICULTIES.map((d) => {
              const active = difficulty === d.key;
              return (
                <TouchableOpacity key={d.key} style={[styles.chip, active && styles.chipActive]} onPress={() => setDifficulty(d.key)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="题数（默认10）" keyboardType="number-pad" value={count} onChangeText={setCount} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="时长（分钟）" keyboardType="number-pad" value={duration} onChangeText={setDuration} />
          </View>
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>智能组卷</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : papers.length === 0 ? (
        <Text style={styles.empty}>{teacher ? '暂无试卷，点击右上角组卷' : '暂无已发布试卷'}</Text>
      ) : (
        papers.map((p) => {
          const open = expanded === p.id;
          const qs = questions[p.id] ?? [];
          return (
            <View key={p.id} style={styles.card}>
              <TouchableOpacity onPress={() => toggleDetail(p.id)}>
                <View style={styles.cardHeader}>
                  <View style={styles.nameWrap}>
                    <Text style={styles.cardTitle}>{p.title}</Text>
                    {p.chapter ? <Text style={styles.farm}>{p.chapter}</Text> : null}
                  </View>
                  {p.status === 'draft' ? <Text style={[styles.badge, { color: '#F59E0B' }]}>草稿</Text> : null}
                </View>
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>{p.questionCount} 题</Text>
                  <Text style={styles.meta}>{p.totalScore} 分</Text>
                  {p.duration ? <Text style={styles.meta}>{p.duration} 分钟</Text> : null}
                  {p.teacherName ? <Text style={styles.meta}>教师：{p.teacherName}</Text> : null}
                </View>
              </TouchableOpacity>
              {open && (
                <View style={styles.detail}>
                  {p.description ? <Text style={styles.detailText}>{p.description}</Text> : null}
                  {qs.length === 0 ? (
                    <Text style={styles.detailText}>（题目加载中或暂无题目）</Text>
                  ) : (
                    qs.map((q, i) => (
                      <Text key={q.id} style={styles.qItem}>
                        {i + 1}. {q.question}
                      </Text>
                    ))
                  )}
                  {teacher && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => confirmDelete(p.id)}>
                        <Text style={[styles.actionText, { color: '#EF4444' }]}>删除</Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
  flex1: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 13 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
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
  qItem: { fontSize: 13, color: '#444', marginBottom: 4, lineHeight: 19 },
  actionRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  actionText: { fontSize: 13, color: '#22C55E', fontWeight: '600' },
});
