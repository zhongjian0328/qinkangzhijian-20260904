import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';
import { commerceApi } from '../../src/api/commerce';
import { Consultation } from '@qinkang/types';

export default function ConsultDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isVet = !!user && ['vet', 'technician', 'admin'].includes(user.role);

  const [consult, setConsult] = useState<Consultation | null>(null);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      setConsult(await commerceApi.consultation(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const content = input.trim();
    if (!content || sending) return;
    setSending(true);
    try {
      setConsult(await commerceApi.sendMessage(id, content));
      setInput('');
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : '发送失败');
    } finally {
      setSending(false);
    }
  };

  const isMine = (role: string) => (isVet ? role === 'vet' : role === 'user');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {consult?.subject ?? '咨询详情'}
        </Text>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !consult ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" size="large" />
      ) : (
        <>
          <ScrollView
            ref={scrollRef}
            style={styles.chat}
            contentContainerStyle={styles.chatContent}
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            {consult.messages.length === 0 ? (
              <Text style={styles.empty}>开始你的第一条咨询吧</Text>
            ) : (
              consult.messages.map((m, i) => {
                const mine = isMine(m.role);
                return (
                  <View
                    key={i}
                    style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}
                  >
                    <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                      {!mine ? <Text style={styles.roleTag}>{m.role === 'vet' ? '兽医' : '我'}</Text> : null}
                      <Text style={[styles.msgText, mine && styles.msgTextMine]}>{m.content}</Text>
                      <Text style={[styles.msgTime, mine && styles.msgTimeMine]}>
                        {new Date(m.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="输入咨询内容…"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={send}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!input.trim() || sending) && styles.sendDisabled]}
              onPress={send}
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendText}>发送</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 12, backgroundColor: '#fff' },
  back: { fontSize: 16, color: '#22C55E', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111' },
  error: { color: '#EF4444', textAlign: 'center', marginTop: 40 },
  loading: { marginTop: 60 },
  chat: { flex: 1 },
  chatContent: { padding: 16 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
  bubbleRow: { marginBottom: 12, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 14, padding: 12 },
  bubbleMine: { backgroundColor: '#22C55E', borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#fff', borderBottomLeftRadius: 4 },
  roleTag: { fontSize: 11, color: '#22C55E', fontWeight: 'bold', marginBottom: 4 },
  msgText: { fontSize: 15, color: '#111', lineHeight: 21 },
  msgTextMine: { color: '#fff' },
  msgTime: { fontSize: 10, color: '#999', marginTop: 4, textAlign: 'right' },
  msgTimeMine: { color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  sendBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#22C55E',
    minWidth: 64,
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.6 },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
