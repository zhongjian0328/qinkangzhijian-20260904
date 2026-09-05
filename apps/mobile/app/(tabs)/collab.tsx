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
import { useFocusEffect } from 'expo-router';
import { Collaboration } from '@qinkang/types';
import { collaborationApi, CollaborationDetail } from '../../src/api/collaboration';
import { useAuthStore } from '../../src/store/auth';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CollabTab() {
  const user = useAuthStore((s) => s.user);
  const [groups, setGroups] = useState<Collaboration[]>([]);
  const [detail, setDetail] = useState<CollaborationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberRole, setMemberRole] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setGroups(await collaborationApi.list());
    } catch {
      setGroups([]);
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
    if (!name.trim()) return Alert.alert('提示', '请填写协作组名称');
    setSaving(true);
    try {
      await collaborationApi.create({ name: name.trim(), topic: topic.trim() || undefined, description: description.trim() || undefined });
      setName('');
      setTopic('');
      setDescription('');
      setShowForm(false);
      await load();
    } catch (e) {
      Alert.alert('创建失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (g: Collaboration) => {
    if (detail?.id === g.id) {
      setDetail(null);
      return;
    }
    setLoading(true);
    try {
      setDetail(await collaborationApi.detail(g.id));
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setLoading(false);
    }
  };

  const postMsg = async () => {
    if (!detail) return;
    if (!msg.trim()) return Alert.alert('提示', '请输入内容');
    setSending(true);
    try {
      await collaborationApi.postMessage(detail.id, { content: msg.trim() });
      setMsg('');
      setDetail(await collaborationApi.detail(detail.id));
    } catch (e) {
      Alert.alert('发送失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSending(false);
    }
  };

  const addMember = async () => {
    if (!detail) return;
    if (!memberName.trim()) return Alert.alert('提示', '请输入成员姓名');
    setSending(true);
    try {
      await collaborationApi.addMember(detail.id, { name: memberName.trim(), role: memberRole.trim() || '研究员' });
      setMemberName('');
      setMemberRole('');
      setDetail(await collaborationApi.detail(detail.id));
    } catch (e) {
      Alert.alert('添加失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSending(false);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('解散协作组', '确定解散该协作组吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '解散',
        style: 'destructive',
        onPress: async () => {
          try {
            await collaborationApi.remove(id);
            if (detail?.id === id) setDetail(null);
            await load();
          } catch (e) {
            Alert.alert('解散失败', e instanceof Error ? e.message : '请重试');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>科研协作</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm((v) => !v)}>
          <Text style={styles.addButtonText}>{showForm ? '取消' : '+ 新建协作组'}</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.sub}>协作组管理 · 病例讨论 · 文件共享</Text>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>协作组名称 *</Text>
          <TextInput style={styles.input} placeholder="如：禽流感新型疫苗攻关组" value={name} onChangeText={setName} />
          <Text style={styles.fieldLabel}>研究方向</Text>
          <TextInput style={styles.input} placeholder="如：卵黄抗体 / 快速检测技术" value={topic} onChangeText={setTopic} />
          <Text style={styles.fieldLabel}>简介</Text>
          <TextInput style={[styles.input, styles.multiline]} placeholder="协作目标、参与单位……" multiline value={description} onChangeText={setDescription} />
          <TouchableOpacity style={[styles.submitButton, saving && { opacity: 0.7 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>创建</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading && !detail ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : groups.length === 0 ? (
        <Text style={styles.empty}>暂无协作组</Text>
      ) : (
        groups.map((g) => {
          const open = detail?.id === g.id;
          return (
            <View key={g.id} style={styles.card}>
              <TouchableOpacity onPress={() => openDetail(g)}>
                <Text style={styles.cardTitle}>{g.name}</Text>
                {g.topic ? <Text style={styles.topic}>方向：{g.topic}</Text> : null}
                {g.description ? <Text style={styles.desc} numberOfLines={2}>{g.description}</Text> : null}
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>
                    {Array.isArray(g.members) ? g.members.length : 0} 位成员
                  </Text>
                  <Text style={styles.meta}>{formatDate(g.createdAt)}</Text>
                </View>
              </TouchableOpacity>

              {open && detail && (
                <View style={styles.detail}>
                  <Text style={styles.sectionTitle}>成员</Text>
                  {(detail.members?.length ?? 0) === 0 ? (
                    <Text style={styles.emptySmall}>暂无成员</Text>
                  ) : (
                    detail.members.map((m, i) => (
                      <View key={i} style={styles.memberRow}>
                        <Text style={styles.memberName}>{m.name}</Text>
                        <Text style={styles.memberRole}>{m.role}</Text>
                      </View>
                    ))
                  )}

                  <View style={styles.addMemberRow}>
                    <TextInput
                      style={[styles.input, styles.flex1]}
                      placeholder="成员姓名"
                      value={memberName}
                      onChangeText={setMemberName}
                    />
                    <TextInput
                      style={[styles.input, styles.flex1]}
                      placeholder="角色（如兽医师）"
                      value={memberRole}
                      onChangeText={setMemberRole}
                    />
                    <TouchableOpacity style={styles.smallBtn} onPress={addMember} disabled={sending}>
                      <Text style={styles.smallBtnText}>添加</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.sectionTitle}>讨论</Text>
                  {(detail.messages?.length ?? 0) === 0 ? (
                    <Text style={styles.emptySmall}>暂无讨论，来说点什么吧</Text>
                  ) : (
                    detail.messages.map((m) => (
                      <View key={m.id} style={styles.msgItem}>
                        <View style={styles.msgHeader}>
                          <Text style={styles.msgAuthor}>{m.userName}</Text>
                          <Text style={styles.msgTime}>{formatDate(m.createdAt)}</Text>
                        </View>
                        <Text style={styles.msgContent}>{m.content}</Text>
                        {m.fileUrl ? <Text style={styles.msgFile}>📎 已共享文件</Text> : null}
                      </View>
                    ))
                  )}

                  <View style={styles.composeRow}>
                    <TextInput
                      style={[styles.input, styles.flex1]}
                      placeholder="输入讨论内容…"
                      value={msg}
                      onChangeText={setMsg}
                      onSubmitEditing={postMsg}
                    />
                    <TouchableOpacity style={styles.smallBtn} onPress={postMsg} disabled={sending}>
                      <Text style={styles.smallBtnText}>发送</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(g.id)}>
                    <Text style={[styles.actionText, { color: '#EF4444', textAlign: 'center' }]}>解散协作组</Text>
                  </TouchableOpacity>
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
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  addButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#22C55E' },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  formCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 16 },
  fieldLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    backgroundColor: '#fff',
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  flex1: { flex: 1 },
  submitButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 12,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loading: { marginTop: 20 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
  emptySmall: { color: '#999', fontSize: 13, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 4 },
  topic: { fontSize: 13, color: '#22C55E', fontWeight: '600', marginBottom: 4 },
  desc: { fontSize: 13, color: '#666', marginBottom: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#999' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#eee' },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111', marginBottom: 6, marginTop: 8 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  memberName: { fontSize: 13, color: '#333' },
  memberRole: { fontSize: 12, color: '#999' },
  addMemberRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  msgItem: { backgroundColor: '#f9fafb', borderRadius: 8, padding: 10, marginBottom: 8 },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  msgAuthor: { fontSize: 13, fontWeight: '600', color: '#22C55E' },
  msgTime: { fontSize: 11, color: '#999' },
  msgContent: { fontSize: 13, color: '#333', lineHeight: 19 },
  msgFile: { fontSize: 12, color: '#999', marginTop: 4 },
  composeRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  smallBtn: { backgroundColor: '#22C55E', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  smallBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  deleteBtn: { marginTop: 12 },
  actionText: { fontSize: 14, fontWeight: '600' },
});