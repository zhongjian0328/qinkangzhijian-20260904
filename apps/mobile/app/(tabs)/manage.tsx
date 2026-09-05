import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { certificationApi, PendingCertification } from '../../src/api/certification';
import { merchantApi } from '../../src/api/merchant';
import { useAuthStore } from '../../src/store/auth';

const CERT_TYPE_LABEL: Record<string, string> = {
  farmer: '养殖户',
  vet: '兽医',
  merchant: '商家',
  institution: '机构',
  student: '学生',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function ManageTab() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isInstitution = user?.role === 'institution';
  const isMerchant = user?.role === 'merchant';

  const [pending, setPending] = useState<PendingCertification[]>([]);
  const [merchantDash, setMerchantDash] = useState<{ productCount: number; orderCount: number; revenue: number; pendingShipCount: number; openBulkCount: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (isInstitution) {
        setPending(await certificationApi.pending());
      } else if (isMerchant) {
        setMerchantDash(await merchantApi.dashboard());
      }
    } catch {
      /* 忽略 */
    } finally {
      setLoading(false);
    }
  }, [isInstitution, isMerchant]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const review = async (c: PendingCertification, status: 'approved' | 'rejected') => {
    const note = status === 'rejected' ? '资料不全，请补充后重新提交' : undefined;
    try {
      await certificationApi.review(c.id, { status, reviewerNote: note });
      await load();
    } catch (e) {
      Alert.alert('审核失败', e instanceof Error ? e.message : '请重试');
    }
  };

  const confirmReject = (c: PendingCertification) => {
    Alert.alert('驳回认证', '确定驳回该认证申请吗？', [
      { text: '取消', style: 'cancel' },
      { text: '驳回', style: 'destructive', onPress: () => review(c, 'rejected') },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>管理中心</Text>
      <Text style={styles.sub}>
        {isInstitution ? '审核管理 · 组织 · 人员' : isMerchant ? '店铺 · 商品 · 订单' : '组织 · 认证 · 设置'}
      </Text>

      {loading ? (
        <ActivityIndicator style={styles.loading} color="#22C55E" />
      ) : isInstitution ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>待审核认证（{pending.length}）</Text>
          {pending.length === 0 ? (
            <Text style={styles.empty}>暂无待审核认证</Text>
          ) : (
            pending.map((c) => (
              <View key={c.id} style={styles.certCard}>
                <View style={styles.certHeader}>
                  <Text style={styles.certName}>{c.user?.username ?? '用户'}</Text>
                  <Text style={styles.certType}>{CERT_TYPE_LABEL[c.type] ?? c.type}</Text>
                </View>
                <Text style={styles.certMeta}>{c.user?.phone ?? ''} · 提交于 {formatDate(c.createdAt)}</Text>
                {Object.keys(c.data ?? {}).length > 0 && (
                  <Text style={styles.certData}>
                    {Object.entries(c.data).slice(0, 3).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                  </Text>
                )}
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => review(c, 'approved')}>
                    <Text style={styles.approveText}>通过</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => confirmReject(c)}>
                    <Text style={styles.rejectText}>驳回</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      ) : isMerchant ? (
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{merchantDash?.productCount ?? 0}</Text>
            <Text style={styles.statLabel}>在售商品</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{merchantDash?.orderCount ?? 0}</Text>
            <Text style={styles.statLabel}>订单总数</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>¥{merchantDash?.revenue ?? 0}</Text>
            <Text style={styles.statLabel}>累计营收</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#F59E0B' }]}>{merchantDash?.pendingShipCount ?? 0}</Text>
            <Text style={styles.statLabel}>待发货</Text>
          </View>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>常用管理</Text>
        <Entry label="身份认证" desc="实名 / 资质认证" href="/certification" />
        <Entry label="消息通知" desc="预警 · 政策 · 订单消息" href="/notifications" />
        {isMerchant && <Entry label="商家工作台" desc="商品 / 订单 / 询价报价" href="/merchant" />}
        {!isInstitution && <Entry label="个人中心" desc="个人信息 · 数据统计 · 设置" href="/profile" />}
      </View>
    </ScrollView>
  );
}

function Entry({ label, desc, href }: { label: string; desc: string; href: string }) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.entry} onPress={() => router.push(href as any)}>
      <View>
        <Text style={styles.entryLabel}>{label}</Text>
        <Text style={styles.entryDesc}>{desc}</Text>
      </View>
      <Text style={styles.entryArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4, marginBottom: 16 },
  loading: { marginTop: 20 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', color: '#111', marginBottom: 12 },
  empty: { color: '#999', fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  certCard: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee', paddingVertical: 12 },
  certHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  certName: { fontSize: 15, fontWeight: 'bold', color: '#111' },
  certType: { fontSize: 12, color: '#22C55E', fontWeight: '600' },
  certMeta: { fontSize: 12, color: '#999', marginBottom: 4 },
  certData: { fontSize: 12, color: '#666', marginBottom: 8 },
  actionRow: { flexDirection: 'row', gap: 10 },
  approveBtn: { flex: 1, backgroundColor: '#22C55E', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  approveText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  rejectBtn: { flex: 1, backgroundColor: '#fef2f2', borderRadius: 8, paddingVertical: 9, alignItems: 'center' },
  rejectText: { color: '#EF4444', fontWeight: 'bold', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: { width: '47%', flexGrow: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: '#22C55E' },
  statLabel: { fontSize: 12, color: '#999', marginTop: 4 },
  entry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  entryLabel: { fontSize: 14, fontWeight: '600', color: '#111' },
  entryDesc: { fontSize: 12, color: '#999', marginTop: 2 },
  entryArrow: { fontSize: 20, color: '#22C55E' },
});
