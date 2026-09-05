import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { learningApi } from '../../src/api/learning';
import { useAuthStore } from '../../src/store/auth';
import { InternLog } from '@qinkang/types';

const isMentor = (role?: string, subRole?: string | null) =>
  role === 'admin' || subRole === 'teacher';

export default function InternLogDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const mentor = isMentor(user?.role, user?.subRole);

  const [log, setLog] = useState<InternLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      setLog(await learningApi.internLog(id));
    } catch {
      setLog(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const submitReview = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const updated = await learningApi.reviewInternLog(id, comment.trim());
      setLog(updated);
      setComment('');
    } catch {
      // 忽略，保持可重试
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>日志详情</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : !log ? (
        <Text style={styles.empty}>日志不存在</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>{log.title}</Text>
          <Text style={styles.meta}>
            {log.studentName ? `${log.studentName} · ` : ''}
            {new Date(log.logDate).toLocaleDateString('zh-CN')} ·{' '}
            {log.status === 'reviewed' ? '已批注' : '待批注'}
          </Text>

          <Text style={styles.sectionLabel}>实习内容</Text>
          <Text style={styles.body}>{log.content}</Text>

          {log.studentDiagnosis ? (
            <>
              <Text style={styles.sectionLabel}>学生诊断</Text>
              <Text style={styles.body}>{log.studentDiagnosis}</Text>
            </>
          ) : null}

          <Text style={styles.sectionLabel}>导师批注</Text>
          {log.mentorComment ? (
            <View style={styles.commentBox}>
              <Text style={styles.commentText}>{log.mentorComment}</Text>
            </View>
          ) : (
            <Text style={styles.noComment}>暂无批注</Text>
          )}

          {mentor && log.status !== 'reviewed' ? (
            <View style={styles.reviewBox}>
              <Text style={styles.sectionLabel}>填写批注</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="输入评语与指导建议…"
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.reviewBtn, (!comment.trim() || submitting) && styles.reviewBtnDisabled]}
                onPress={submitReview}
                disabled={!comment.trim() || submitting}
              >
                <Text style={styles.reviewBtnText}>{submitting ? '提交中…' : '提交批注'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      )}
    </KeyboardAvoidingView>
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
  headerSpacer: { width: 32 },
  loading: { marginTop: 60 },
  empty: { color: '#999', textAlign: 'center', marginTop: 60 },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111', marginBottom: 6 },
  meta: { fontSize: 13, color: '#999', marginBottom: 16 },
  sectionLabel: { fontSize: 14, color: '#22C55E', fontWeight: '600', marginTop: 12, marginBottom: 6 },
  body: { fontSize: 15, color: '#333', lineHeight: 24 },
  commentBox: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12 },
  commentText: { fontSize: 14, color: '#333', lineHeight: 22 },
  noComment: { fontSize: 14, color: '#bbb' },
  reviewBox: { marginTop: 8 },
  reviewInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  reviewBtn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 10 },
  reviewBtnDisabled: { backgroundColor: '#9ae6b4' },
  reviewBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
