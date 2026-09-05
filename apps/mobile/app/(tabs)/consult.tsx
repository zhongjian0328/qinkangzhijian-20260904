import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { ConsultMessage, ConsultSession } from '@qinkang/types';
import { consultApi } from '../../src/api/consult';
import { diagnosisApi } from '../../src/api/diagnosis';
import { assetUrl } from '../../src/api/client';
import { useAuthStore } from '../../src/store/auth';

const QUICK_QUESTIONS = ['鸡拉稀怎么办', '呼吸有啰音', '产蛋下降', '突然死亡', '精神萎靡不吃料'];
const STUDENT_QUESTIONS = [
  '如何鉴别新城疫与禽流感',
  '请引导我分析这个病例',
  '禽病问诊的基本思路是什么',
  '剖检时重点观察哪些病变',
  '常见呼吸道病的鉴别要点',
];

function getMime(uri: string): string {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  return 'image/jpeg';
}

async function uriToDataUri(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return `data:${getMime(uri)};base64,${base64}`;
}

function welcomeText(role?: string, subRole?: string | null): string {
  if (role === 'vet' || subRole === 'service')
    return '您好，我是您的 AI 兽医助手。请描述病例（症状、日龄、死亡率、剖检病变等），或上传图片，我帮您做鉴别诊断。';
  if (role === 'student')
    return '同学好，我是你的 AI 学习辅导老师。请描述你遇到的病例，我会引导你一步步排查——先说说你的初步判断？';
  if (role === 'merchant')
    return '您好，我是产品与客服助手。请告诉我您想了解的产品，或描述客户的使用场景，我帮您推荐合适方案。';
  if (role === 'institution') {
    if (subRole === 'teacher') return '您好，我是您的教学助手，可帮您备课、设计教学案例、讲解鉴别诊断要点。';
    if (subRole === 'research') return '您好，我是禽病科研助手，可帮您做混合感染风险评估与鉴别诊断要点分析。';
    return '您好，我是疫情分析助手，可帮您评估区域疫情风险、制定监测预警方案。';
  }
  if (role === 'farmer' && (subRole === 'enterprise' || subRole === 'cooperative'))
    return '您好，我是禽病兽医兼经营顾问。请描述鸡群异常（场区、存栏、死亡、采食、产蛋等），我帮您批量排查。';
  return '您好，我是您的 AI 禽病兽医。请描述鸡的症状（精神、采食、粪便、呼吸、产蛋等），或上传病鸡图片，我帮您初步诊断。';
}

export default function ConsultScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConsultMessage[]>([]);
  const [input, setInput] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<ConsultSession[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const listRef = useRef<FlatList<ConsultMessage>>(null);

  const welcome: ConsultMessage = {
    role: 'assistant',
    content: welcomeText(user?.role, user?.subRole),
    createdAt: new Date().toISOString(),
  };

  const data: ConsultMessage[] = messages.length ? messages : [welcome];

  const pickImages = async () => {
    if (images.length >= 3) {
      Alert.alert('提示', '单条消息最多附加 3 张图片');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相册以选择图片');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets?.length) {
      setImages((prev) => {
        const next = [...prev];
        for (const asset of picked.assets) {
          if (next.length >= 3) break;
          if (!next.includes(asset.uri)) next.push(asset.uri);
        }
        return next;
      });
    }
  };

  const newSession = () => {
    setSessionId(null);
    setMessages([]);
    setInput('');
    setImages([]);
    setShowHistory(false);
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    setShowHistory(true);
    try {
      const list = await consultApi.list();
      setSessions(list ?? []);
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSession = (session: ConsultSession) => {
    setSessionId(session.id);
    setMessages(session.messages ?? []);
    setInput('');
    setImages([]);
    setShowHistory(false);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
  };

  const send = async (override?: string) => {
    const content = (override ?? input).trim();
    if (!content && images.length === 0) return;
    if (!token || token === 'guest') {
      Alert.alert('请先登录', 'AI 对话问诊需要登录后使用', [
        { text: '取消', style: 'cancel' },
        { text: '去登录', onPress: () => router.replace('/login') },
      ]);
      return;
    }

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (images.length) {
        const dataUris = await Promise.all(images.map(uriToDataUri));
        const res = await diagnosisApi.upload(dataUris);
        imageUrls = res.urls;
      }

      const res = await consultApi.send({
        sessionId: sessionId ?? undefined,
        content,
        imageUrls,
        role: user?.role,
        subRole: user?.subRole ?? undefined,
      });

      setSessionId(res.sessionId);
      setMessages(res.messages as ConsultMessage[]);
      setInput('');
      setImages([]);
    } catch (e) {
      Alert.alert('发送失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const generateReport = async () => {
    if (!sessionId) {
      Alert.alert('提示', '请先完成一轮问诊并得到诊断结论后再生成报告');
      return;
    }
    try {
      await consultApi.generateReport(sessionId);
      router.push(`/consult-report/${sessionId}`);
    } catch (e) {
      Alert.alert('生成失败', e instanceof Error ? e.message : '请稍后重试');
    }
  };

  const goToVet = () => router.push('/service');

  // 最后一条带诊断结论的 AI 消息索引（用于在其下方显示「生成报告/转人工」按钮）
  const lastDiagIndex = data.reduce(
    (acc, m, i) => (m.role === 'assistant' && m.diagnosis?.preliminaryDiagnosis ? i : acc),
    -1,
  );

  const renderMessage = ({ item, index }: { item: ConsultMessage; index: number }) => {
    const isUser = item.role === 'user';
    const diag = item.diagnosis;
    const related = item.relatedDiseases;
    const showActions = !isUser && index === lastDiagIndex;
    return (
      <View style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowAi]}>
        {!isUser && <Text style={styles.aiAvatar}>🐔</Text>}
        <View style={styles.msgCol}>
          {item.imageUrls?.length ? (
            <View style={styles.msgImages}>
              {item.imageUrls.map((u, i) => (
                <Image key={i} source={{ uri: assetUrl(u) }} style={styles.msgImg} />
              ))}
            </View>
          ) : null}
          <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
            <Text style={isUser ? styles.bubbleTextUser : styles.bubbleTextAi}>{item.content}</Text>
          </View>

          {!isUser && related?.length ? (
            <View style={styles.tagRow}>
              {related.map((d, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>🔍 {d}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {!isUser && diag?.preliminaryDiagnosis ? (
            <View style={styles.diagCard}>
              <Text style={styles.diagTitle}>初步诊断：{diag.preliminaryDiagnosis}</Text>
              {typeof diag.confidence === 'number' ? (
                <Text style={styles.diagConf}>置信度 {(diag.confidence * 100).toFixed(0)}%</Text>
              ) : null}
              {diag.suggestions?.length ? (
                <View style={styles.diagSection}>
                  {diag.suggestions.map((s, i) => (
                    <Text key={i} style={styles.diagBody}>
                      • {s}
                    </Text>
                  ))}
                </View>
              ) : null}
              {diag.nextSteps ? (
                <Text style={styles.diagNext}>后续建议：{diag.nextSteps}</Text>
              ) : null}
            </View>
          ) : null}

          {showActions ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionPrimary} onPress={generateReport}>
                <Text style={styles.actionPrimaryText}>📄 生成诊断报告</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionGhost} onPress={goToVet}>
                <Text style={styles.actionGhostText}>👨‍⚕️ 转人工兽医</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  const renderSession = ({ item }: { item: ConsultSession }) => {
    const last = item.messages?.[item.messages.length - 1];
    const preview = last?.content ?? '';
    const diag = (item.messages ?? []).find((m) => m.diagnosis?.preliminaryDiagnosis)?.diagnosis;
    const hasReport = !!item.report;
    return (
      <View style={styles.sessionItem}>
        <TouchableOpacity style={styles.sessionTouch} onPress={() => loadSession(item)}>
          <View style={styles.sessionMain}>
            <Text style={styles.sessionTitle} numberOfLines={1}>
              {item.title || 'AI 问诊'}
            </Text>
            <Text style={styles.sessionPreview} numberOfLines={1}>
              {preview}
            </Text>
            {diag?.preliminaryDiagnosis ? (
              <Text style={styles.sessionDiag} numberOfLines={1}>
                初步诊断：{diag.preliminaryDiagnosis}
              </Text>
            ) : null}
          </View>
          <View style={styles.sessionSide}>
            <Text style={styles.sessionTime}>
              {new Date(item.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
            </Text>
            <Text style={styles.sessionCount}>{item.messages?.length ?? 0} 条</Text>
          </View>
        </TouchableOpacity>
        {hasReport ? (
          <TouchableOpacity
            style={styles.viewReportBtn}
            onPress={() => router.push(`/consult-report/${item.id}`)}
          >
            <Text style={styles.viewReportText}>📄 查看报告</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI对话问诊</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.newBtn} onPress={showHistory ? () => setShowHistory(false) : loadHistory}>
            <Text style={styles.newBtnText}>{showHistory ? '对话' : '历史'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.newBtn} onPress={newSession}>
            <Text style={styles.newBtnText}>＋ 新对话</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showHistory ? (
        <View style={styles.flex}>
          <Text style={styles.historyHint}>选择一条历史会话继续问诊</Text>
          {historyLoading ? (
            <ActivityIndicator color="#22C55E" style={{ marginTop: 24 }} />
          ) : sessions.length ? (
            <FlatList
              data={sessions}
              keyExtractor={(s) => s.id}
              renderItem={renderSession}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <Text style={styles.emptyText}>暂无问诊历史，开始第一次 AI 问诊吧</Text>
          )}
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            data={data}
            keyExtractor={(item, i) => String(i)}
            renderItem={renderMessage}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListHeaderComponent={
              messages.length === 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.quickWrap}
                  contentContainerStyle={styles.quickContent}
                >
                  <Text style={styles.quickLabel}>💡 快速提问：</Text>
                  {(user?.role === 'student' ? STUDENT_QUESTIONS : QUICK_QUESTIONS).map((q) => (
                    <TouchableOpacity key={q} style={styles.quickChip} onPress={() => send(q)}>
                      <Text style={styles.quickChipText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : null
            }
            ListFooterComponent={
              loading ? <ActivityIndicator color="#22C55E" style={{ marginVertical: 12 }} /> : null
            }
          />

          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.imgBtn} onPress={pickImages}>
              <Text style={styles.imgBtnText}>🖼</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="描述症状，或追问细节…"
              placeholderTextColor="#aaa"
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, loading && styles.sendDisabled]}
              onPress={() => send()}
              disabled={loading}
            >
              <Text style={styles.sendText}>发送</Text>
            </TouchableOpacity>
          </View>

          {images.length ? (
            <View style={styles.pendingImages}>
              {images.map((uri, i) => (
                <View key={i} style={styles.pendingWrap}>
                  <Image source={{ uri }} style={styles.pendingImg} />
                  <TouchableOpacity
                    style={styles.pendingRemove}
                    onPress={() => setImages((prev) => prev.filter((u) => u !== uri))}
                  >
                    <Text style={styles.pendingRemoveText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f5f7f6' },
  header: {
    paddingTop: 56,
    paddingBottom: 10,
    paddingHorizontal: 16,
    backgroundColor: '#22C55E',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerBtns: { flexDirection: 'row', gap: 8 },
  newBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.25)' },
  newBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  historyHint: { padding: 12, paddingBottom: 4, fontSize: 13, color: '#6b7280' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#9ca3af', fontSize: 14 },
  sessionItem: {
    padding: 14,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  sessionTouch: { flexDirection: 'row', alignItems: 'center' },
  viewReportBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  viewReportText: { fontSize: 12, color: '#16a34a', fontWeight: 'bold' },
  sessionMain: { flex: 1, marginRight: 10 },
  sessionTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f2937' },
  sessionPreview: { fontSize: 13, color: '#6b7280', marginTop: 3 },
  sessionDiag: { fontSize: 12, color: '#22C55E', marginTop: 3, fontWeight: 'bold' },
  sessionSide: { alignItems: 'flex-end' },
  sessionTime: { fontSize: 12, color: '#9ca3af' },
  sessionCount: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  listContent: { padding: 16, paddingBottom: 8 },
  quickWrap: { marginBottom: 12 },
  quickContent: { alignItems: 'center', paddingRight: 8 },
  quickLabel: { fontSize: 13, color: '#6b7280', marginRight: 4 },
  quickChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 3,
  },
  quickChipText: { color: '#16a34a', fontSize: 13 },
  msgRow: { flexDirection: 'row', marginBottom: 14 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowAi: { justifyContent: 'flex-start' },
  aiAvatar: { fontSize: 22, marginRight: 8, marginTop: 2 },
  msgCol: { maxWidth: '82%', alignItems: 'flex-start' },
  msgImages: { flexDirection: 'row', gap: 6, marginBottom: 6, alignSelf: 'flex-end' },
  msgImg: { width: 72, height: 72, borderRadius: 10, backgroundColor: '#e5e7eb' },
  bubble: { padding: 12, borderRadius: 16 },
  bubbleUser: { backgroundColor: '#22C55E', borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: '#e5e7eb' },
  bubbleTextUser: { color: '#fff', fontSize: 15, lineHeight: 22 },
  bubbleTextAi: { color: '#1f2937', fontSize: 15, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontSize: 12, color: '#16a34a', fontWeight: 'bold' },
  diagCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignSelf: 'stretch',
  },
  diagTitle: { fontSize: 15, fontWeight: 'bold', color: '#166534' },
  diagConf: { fontSize: 13, color: '#22C55E', fontWeight: 'bold', marginTop: 2 },
  diagSection: { marginTop: 6 },
  diagBody: { fontSize: 13, color: '#374151', lineHeight: 20 },
  diagNext: { fontSize: 13, color: '#6b7280', marginTop: 6 },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    alignSelf: 'stretch',
  },
  actionPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPrimaryText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  actionGhost: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGhostText: { color: '#22C55E', fontSize: 13, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    gap: 8,
    backgroundColor: '#fff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
  },
  imgBtn: { padding: 8 },
  imgBtnText: { fontSize: 22 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 15,
    color: '#333',
    textAlignVertical: 'center',
  },
  sendBtn: { backgroundColor: '#22C55E', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 10 },
  sendDisabled: { opacity: 0.6 },
  sendText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  pendingImages: { flexDirection: 'row', gap: 8, padding: 10, backgroundColor: '#fff', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#e5e7eb' },
  pendingWrap: { width: 60, height: 60, borderRadius: 8, overflow: 'hidden' },
  pendingImg: { width: '100%', height: '100%', backgroundColor: '#e5e7eb' },
  pendingRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingRemoveText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
