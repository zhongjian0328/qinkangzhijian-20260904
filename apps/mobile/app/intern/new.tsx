import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { learningApi } from '../../src/api/learning';

function todayStr(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function InternLogCreateScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [studentDiagnosis, setStudentDiagnosis] = useState('');
  const [logDate, setLogDate] = useState(todayStr());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!title.trim() || !content.trim()) {
      setError('请填写日志标题和内容');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await learningApi.createInternLog({
        title: title.trim(),
        content: content.trim(),
        logDate: `${logDate}T12:00:00.000Z`,
        studentDiagnosis: studentDiagnosis.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : '提交失败');
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
        <Text style={styles.headerTitle}>新建实习日志</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>日志标题 *</Text>
        <TextInput
          style={styles.input}
          placeholder="如：鸡新城疫剖检观察"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>实习日期</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={logDate}
          onChangeText={setLogDate}
        />

        <Text style={styles.label}>实习内容 *</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="记录现场病例、观察到的症状与病变等"
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />

        <Text style={styles.label}>我的判断（学生诊断）</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="你对病例的初步判断（可选）"
          value={studentDiagnosis}
          onChangeText={setStudentDiagnosis}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={submit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? '提交中…' : '提交日志'}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, color: '#666', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    color: '#333',
    marginBottom: 8,
  },
  multiline: { minHeight: 100 },
  error: { color: '#EF4444', fontSize: 13, marginTop: 8 },
  submitBtn: { backgroundColor: '#22C55E', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  submitBtnDisabled: { backgroundColor: '#9ae6b4' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
