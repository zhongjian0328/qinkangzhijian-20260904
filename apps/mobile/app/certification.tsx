import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Certification, CertificationType, CertificationStatus } from '@qinkang/types';
import { certificationApi } from '../src/api/certification';
import { diagnosisApi } from '../src/api/diagnosis';
import { useAuthStore } from '../src/store/auth';

const TYPE_OPTIONS: { value: CertificationType; label: string }[] = [
  { value: 'farmer', label: '养殖户' },
  { value: 'vet', label: '兽医' },
  { value: 'merchant', label: '商家' },
  { value: 'institution', label: '机构/教师' },
  { value: 'student', label: '学生' },
];

const TYPE_FIELDS: Record<CertificationType, { key: string; label: string; placeholder: string }[]> = {
  farmer: [
    { key: 'farmName', label: '养殖场名称', placeholder: '如：达州市达川区兴旺蛋鸡养殖场' },
    { key: 'creditCode', label: '统一社会信用代码', placeholder: '如：91511703MA68****' },
    { key: 'scale', label: '养殖规模', placeholder: '如：2万羽' },
    { key: 'address', label: '养殖场地址', placeholder: '如：达州市达川区亭子镇书湾村3组' },
    { key: 'contact', label: '联系人', placeholder: '姓名' },
    { key: 'phone', label: '联系电话', placeholder: '手机号' },
  ],
  vet: [
    { key: 'licenseNo', label: '执业兽医资格证号', placeholder: '如：A012019****' },
    { key: 'unit', label: '执业单位', placeholder: '如：达川区动物疫控中心' },
    { key: 'scope', label: '执业范围', placeholder: '如：家禽' },
    { key: 'contact', label: '联系人', placeholder: '姓名' },
    { key: 'phone', label: '联系电话', placeholder: '手机号' },
  ],
  merchant: [
    { key: 'companyName', label: '企业名称', placeholder: '如：XX兽药有限公司' },
    { key: 'creditCode', label: '统一社会信用代码', placeholder: '如：91511703MA68****' },
    { key: 'category', label: '经营品类', placeholder: '如：兽药/疫苗/设备' },
    { key: 'contact', label: '联系人', placeholder: '姓名' },
    { key: 'phone', label: '联系电话', placeholder: '手机号' },
  ],
  institution: [
    { key: 'orgName', label: '机构名称', placeholder: '如：达川区动物疫病预防控制中心' },
    { key: 'creditCode', label: '统一社会信用代码', placeholder: '如：12511703MB****' },
    { key: 'orgType', label: '机构类型', placeholder: '如：疫控机构/科研院所/学校' },
    { key: 'contact', label: '联系人', placeholder: '姓名' },
    { key: 'phone', label: '联系电话', placeholder: '手机号' },
  ],
  student: [
    { key: 'school', label: '学校名称', placeholder: '如：四川农业大学' },
    { key: 'major', label: '专业', placeholder: '如：动物医学' },
    { key: 'studentNo', label: '学号', placeholder: '如：2023****' },
    { key: 'grade', label: '入学年份', placeholder: '如：2023' },
    { key: 'name', label: '姓名', placeholder: '真实姓名' },
  ],
};

const TYPE_DOC_LABEL: Record<CertificationType, string> = {
  farmer: '营业执照',
  vet: '执业兽医资格证',
  merchant: '营业执照',
  institution: '机构资质证明',
  student: '学生证',
};

const STATUS_META: Record<CertificationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: '审核中', color: '#F59E0B', bg: '#FFFBEB' },
  approved: { label: '已通过', color: '#10B981', bg: '#ECFDF5' },
  rejected: { label: '已驳回', color: '#EF4444', bg: '#FEF2F2' },
};

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

export default function CertificationScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [cert, setCert] = useState<Certification | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [type, setType] = useState<CertificationType>(user?.role === 'student' ? 'student' : user?.role === 'vet' ? 'vet' : user?.role === 'merchant' ? 'merchant' : user?.role === 'institution' ? 'institution' : 'farmer');
  const [form, setForm] = useState<Record<string, string>>({});
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      certificationApi
        .mine()
        .then((c) => {
          if (!active) return;
          setCert(c);
          if (c) {
            setType(c.type);
            setForm(c.data ?? {});
            setImageUris(c.images ?? []);
          }
        })
        .catch(() => {})
        .finally(() => active && setLoaded(true));
      return () => {
        active = false;
      };
    }, []),
  );

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要权限', '请允许访问相册以选择证件照片');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets?.length) {
      setImageUris((prev) => {
        const next = [...prev];
        for (const asset of picked.assets) {
          if (next.length >= 3) break;
          if (!next.includes(asset.uri)) next.push(asset.uri);
        }
        return next;
      });
    }
  };

  const removeImage = (uri: string) => setImageUris((prev) => prev.filter((u) => u !== uri));

  const submit = async () => {
    const fields = TYPE_FIELDS[type];
    const data: Record<string, string> = {};
    for (const f of fields) {
      const v = (form[f.key] ?? '').trim();
      if (!v) {
        Alert.alert('信息不完整', `请填写「${f.label}」`);
        return;
      }
      data[f.key] = v;
    }

    setSubmitting(true);
    try {
      let uploadedUrls: string[] = [];
      const localUris = imageUris.filter((u) => u.startsWith('file://') || u.startsWith('content://') || u.startsWith('ph://'));
      if (localUris.length) {
        const dataUris = await Promise.all(localUris.map(uriToDataUri));
        const res = await diagnosisApi.upload(dataUris);
        uploadedUrls = res.urls;
      }
      const images = [...imageUris.filter((u) => u.startsWith('http')), ...uploadedUrls];

      const updated = await certificationApi.submit({ type, data, images });
      setCert(updated);
      setImageUris(updated.images ?? []);
      Alert.alert('已提交', '认证信息已提交，1-3 个工作日内完成审核，结果将通过消息通知您。');
    } catch (e) {
      Alert.alert('提交失败', e instanceof Error ? e.message : '请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#22C55E" />
      </View>
    );
  }

  const statusMeta = cert ? STATUS_META[cert.status] : null;

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="#555" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>身份认证</Text>
        {statusMeta ? (
          <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
            <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
          </View>
        ) : (
          <Text style={styles.navUncertified}>未认证</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>完成身份认证</Text>
          <Text style={styles.heroDesc}>认证通过后可解锁对应角色的全部功能，审核通常在 1-3 个工作日内完成</Text>
          <View style={styles.heroSteps}>
            {['填写信息', '上传证件', '等待审核'].map((s, i) => (
              <View key={s} style={[styles.heroStep, i === 0 && styles.heroStepActive]}>
                <Text style={styles.heroStepNum}>{i + 1}</Text>
                <Text style={styles.heroStepLabel}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {cert?.status === 'approved' ? (
          <View style={styles.approvedCard}>
            <Ionicons name="shield-checkmark" size={36} color="#22C55E" />
            <Text style={styles.approvedTitle}>认证已通过</Text>
            <Text style={styles.approvedDesc}>您已解锁对应角色的全部功能，如需修改认证信息可联系平台。</Text>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>认证类型</Text>
              <View style={styles.typeTabs}>
                {TYPE_OPTIONS.map((opt) => {
                  const active = type === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[styles.typeTab, active && styles.typeTabActive]}
                      onPress={() => setType(opt.value)}
                    >
                      <Text style={[styles.typeTabText, active && styles.typeTabTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.card}>
                {TYPE_FIELDS[type].map((f) => (
                  <View key={f.key} style={styles.formGroup}>
                    <Text style={styles.formLabel}>
                      {f.label} <Text style={styles.required}>*</Text>
                    </Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder={f.placeholder}
                      placeholderTextColor="#aaa"
                      value={form[f.key] ?? ''}
                      onChangeText={(v) => setForm((prev) => ({ ...prev, [f.key]: v }))}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>资质证明</Text>
              <View style={styles.card}>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={18} color="#F59E0B" />
                  <Text style={styles.infoText}>
                    请上传{TYPE_DOC_LABEL[type]}原件照片，确保四角完整、文字清晰可辨。支持 JPG/PNG 格式，单张不超过 10MB。
                  </Text>
                </View>

                <Text style={styles.formLabel}>{TYPE_DOC_LABEL[type]} <Text style={styles.required}>*</Text></Text>
                <View style={styles.uploadRow}>
                  {imageUris.map((uri) => (
                    <View key={uri} style={styles.thumbWrap}>
                      <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                      <TouchableOpacity style={styles.thumbRemove} onPress={() => removeImage(uri)}>
                        <Text style={styles.thumbRemoveText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity style={styles.addTile} onPress={pickImages}>
                    <Text style={styles.addTilePlus}>＋</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {cert?.status === 'rejected' && cert.reviewerNote ? (
              <View style={styles.rejectBox}>
                <Text style={styles.rejectTitle}>驳回原因</Text>
                <Text style={styles.rejectText}>{cert.reviewerNote}</Text>
              </View>
            ) : null}

            <View style={styles.benefitCard}>
              <Ionicons name="shield-checkmark" size={20} color="#22C55E" />
              <View style={styles.benefitBody}>
                <Text style={styles.benefitTitle}>认证权益</Text>
                <Text style={styles.benefitText}>
                  解锁 AI 兽医模式完整诊断功能；可下单诊疗服务、购买兽药；参与区域联防预警、接收政策通知；生产数据云端存储与分析。
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cert?.status !== 'approved' ? (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitDisabled]} onPress={submit} disabled={submitting}>
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>{cert ? '重新提交审核' : '提交审核'}</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.submitHint}>提交后 1-3 个工作日内完成审核，结果将通过消息通知</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#F8FAFC',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: { fontSize: 18, fontWeight: '700', flex: 1 },
  navUncertified: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  content: { padding: 20, paddingBottom: 140 },
  hero: { backgroundColor: '#22C55E', borderRadius: 20, padding: 24, overflow: 'hidden' },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6 },
  heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  heroSteps: { flexDirection: 'row', gap: 8, marginTop: 16 },
  heroStep: { flex: 1, padding: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  heroStepActive: { backgroundColor: 'rgba(255,255,255,0.3)' },
  heroStepNum: { fontSize: 16, fontWeight: '800', color: '#fff' },
  heroStepLabel: { fontSize: 10, color: 'rgba(255,255,255,0.9)', marginTop: 2 },
  section: { marginTop: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12, paddingLeft: 8, borderLeftWidth: 3, borderLeftColor: '#22C55E' },
  typeTabs: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  typeTab: {
    flex: 1,
    minWidth: 60,
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeTabActive: { backgroundColor: '#F0FDF4', borderColor: '#22C55E' },
  typeTabText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  typeTabTextActive: { color: '#22C55E' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 16, padding: 18 },
  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  required: { color: '#EF4444' },
  formInput: {
    padding: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 18 },
  uploadRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  thumbWrap: { width: 100, height: 70, borderRadius: 10, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  thumb: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbRemoveText: { color: '#fff', fontSize: 10 },
  addTile: {
    width: 100,
    height: 70,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#22C55E',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTilePlus: { fontSize: 26, color: '#22C55E' },
  rejectBox: { marginTop: 16, padding: 14, backgroundColor: '#FEF2F2', borderRadius: 12 },
  rejectTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 4 },
  rejectText: { fontSize: 13, color: '#B91C1C', lineHeight: 20 },
  benefitCard: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  benefitBody: { flex: 1 },
  benefitTitle: { fontSize: 13, fontWeight: '700', color: '#22C55E', marginBottom: 4 },
  benefitText: { fontSize: 12, color: '#64748B', lineHeight: 20 },
  approvedCard: {
    marginTop: 16,
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  approvedTitle: { fontSize: 17, fontWeight: '700', marginTop: 10, color: '#111' },
  approvedDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 28,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  submitBtn: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#22C55E',
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  submitHint: { textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 10 },
});
