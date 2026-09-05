import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { learningApi, ExamSubmitResult } from '../src/api/learning';
import { Question } from '@qinkang/types';

const TYPE_LABEL: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
};

const DIFF_LABEL: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export default function QuizScreen() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamSubmitResult | null>(null);

  useEffect(() => {
    learningApi
      .questions({ limit: 10 })
      .then((qs) => {
        setQuestions(qs);
        setAnswers(Object.fromEntries(qs.map((q) => [q.id, []])));
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (q: Question, idx: number) => {
    if (result) return;
    setAnswers((prev) => {
      const cur = prev[q.id] ?? [];
      if (q.type === 'multiple') {
        const next = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx];
        return { ...prev, [q.id]: next };
      }
      return { ...prev, [q.id]: [idx] };
    });
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        answers: questions.map((q) => ({ questionId: q.id, selected: answers[q.id] ?? [] })),
      };
      setResult(await learningApi.submitExam(payload));
    } catch {
      // 忽略，保持可重试
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = questions.filter((q) => (answers[q.id] ?? []).length > 0).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>题库测验</Text>
        <TouchableOpacity onPress={() => router.push('/quiz/records')} style={styles.recordsBtn}>
          <Text style={styles.recordsText}>记录</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : questions.length === 0 ? (
        <Text style={styles.empty}>暂无题目</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {result ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultScore}>{result.score} 分</Text>
              <Text style={styles.resultMeta}>
                答对 {result.correctCount}/{result.total} 题 · 满分 {result.totalScore}
              </Text>
              <TouchableOpacity style={styles.againBtn} onPress={() => { setResult(null); setAnswers(Object.fromEntries(questions.map((q) => [q.id, []]))); }}>
                <Text style={styles.againText}>再测一次</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {questions.map((q, qi) => (
            <View key={q.id} style={styles.questionCard}>
              <View style={styles.qMetaRow}>
                <Text style={styles.qType}>{TYPE_LABEL[q.type] ?? q.type}</Text>
                <Text style={styles.qDiff}>{DIFF_LABEL[q.difficulty] ?? q.difficulty}</Text>
              </View>
              <Text style={styles.qText}>
                {qi + 1}. {q.question}
              </Text>
              {q.options.map((opt, oi) => {
                const selected = (answers[q.id] ?? []).includes(oi);
                const isCorrect = result
                  ? (JSON.parse(result.record.answers) as { questionId: string; answer: number[] }[])
                      .find((a) => a.questionId === q.id)?.answer.includes(oi)
                  : false;
                return (
                  <TouchableOpacity
                    key={oi}
                    style={[
                      styles.option,
                      selected && styles.optionSelected,
                      result && isCorrect && styles.optionCorrect,
                    ]}
                    onPress={() => toggle(q, oi)}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {String.fromCharCode(65 + oi)}. {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {result && q.explanation ? (
                <Text style={styles.explanation}>解析：{q.explanation}</Text>
              ) : null}
            </View>
          ))}

          {!result ? (
            <TouchableOpacity
              style={[styles.submitBtn, (answeredCount < questions.length || submitting) && styles.submitBtnDisabled]}
              onPress={submit}
              disabled={answeredCount < questions.length || submitting}
            >
              <Text style={styles.submitText}>
                {submitting ? '判分中…' : `提交测验（已答 ${answeredCount}/${questions.length}）`}
              </Text>
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  backBtn: { width: 32 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '600', color: '#111' },
  recordsBtn: { width: 48, alignItems: 'flex-end' },
  recordsText: { fontSize: 14, color: '#22C55E', fontWeight: '600' },
  loading: { marginTop: 60 },
  empty: { color: '#999', textAlign: 'center', marginTop: 60 },
  content: { padding: 16, paddingBottom: 40 },
  resultCard: { backgroundColor: '#22C55E', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 16 },
  resultScore: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  resultMeta: { fontSize: 14, color: '#e0ffe0', marginTop: 6 },
  againBtn: { marginTop: 12, backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  againText: { color: '#22C55E', fontWeight: 'bold' },
  questionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  qMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  qType: { fontSize: 12, color: '#22C55E', fontWeight: '600' },
  qDiff: { fontSize: 12, color: '#999' },
  qText: { fontSize: 15, fontWeight: '600', color: '#111', lineHeight: 22, marginBottom: 10 },
  option: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionSelected: { borderColor: '#22C55E', backgroundColor: '#f0fdf4' },
  optionCorrect: { borderColor: '#22C55E', backgroundColor: '#f0fdf4' },
  optionText: { fontSize: 14, color: '#333' },
  optionTextSelected: { color: '#22C55E', fontWeight: '600' },
  explanation: { fontSize: 13, color: '#666', lineHeight: 20, marginTop: 4, backgroundColor: '#f5f5f5', borderRadius: 8, padding: 10 },
  submitBtn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 4 },
  submitBtnDisabled: { backgroundColor: '#9ae6b4' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
