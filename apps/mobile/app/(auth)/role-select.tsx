import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MainRole, SubRole } from '@qinkang/types';
import { useAuthStore } from '../../src/store/auth';

const PRIMARY = '#22C55E';

type RoleColor = { icon: string; bg: string; badge: string; badgeText: string };

interface RoleOption {
  value: MainRole;
  name: string;
  desc: string;
  badge: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: RoleColor;
  subRoles: { value: SubRole; label: string }[];
  features: { icon: keyof typeof Ionicons.glyphMap; label: string }[];
}

const ROLES: RoleOption[] = [
  {
    value: 'farmer',
    name: '养殖户',
    desc: '从事禽类养殖生产，需要疾病诊断与生产管理',
    badge: '推荐',
    icon: 'leaf',
    color: { icon: PRIMARY, bg: '#F0FDF4', badge: '#FEF2F2', badgeText: '#EF4444' },
    subRoles: [
      { value: 'small', label: '小散户' },
      { value: 'cooperative', label: '合作社' },
      { value: 'enterprise', label: '养殖企业' },
    ],
    features: [
      { icon: 'scan', label: 'AI诊断' },
      { icon: 'stats-chart', label: '生产管理' },
      { icon: 'notifications', label: '疫情预警' },
    ],
  },
  {
    value: 'vet',
    name: '兽医服务商',
    desc: '乡镇兽医站、个体兽医，在线接单与客户管理',
    badge: '专业',
    icon: 'medkit',
    color: { icon: '#F59E0B', bg: '#FFFBEB', badge: '#EFF6FF', badgeText: '#2563EB' },
    subRoles: [{ value: 'service', label: '兽医服务' }],
    features: [
      { icon: 'briefcase', label: '在线接单' },
      { icon: 'scan', label: 'AI诊断' },
      { icon: 'people', label: '客户管理' },
    ],
  },
  {
    value: 'merchant',
    name: '兽药/设备商',
    desc: '兽药厂、设备商、饲料企业，商品销售与大宗采购',
    badge: '商家',
    icon: 'storefront',
    color: { icon: '#6366F1', bg: '#EEF2FF', badge: '#FFFBEB', badgeText: '#F59E0B' },
    subRoles: [
      { value: 'medicine', label: '兽药商' },
      { value: 'equipment', label: '设备商' },
    ],
    features: [
      { icon: 'cube', label: '商品上架' },
      { icon: 'receipt', label: '订单管理' },
      { icon: 'pricetags', label: '大宗采购' },
    ],
  },
  {
    value: 'institution',
    name: '机构',
    desc: '疫控、科研、教育机构，提供专业技术支持',
    badge: '专业',
    icon: 'business',
    color: { icon: '#2563EB', bg: '#EFF6FF', badge: '#EFF6FF', badgeText: '#2563EB' },
    subRoles: [
      { value: 'cdc', label: '疫控机构' },
      { value: 'research', label: '科研院所' },
      { value: 'teacher', label: '教师' },
    ],
    features: [
      { icon: 'globe', label: '疫情监测' },
      { icon: 'document-text', label: '报告审核' },
      { icon: 'bar-chart', label: '数据统计' },
    ],
  },
  {
    value: 'student',
    name: '学生',
    desc: '学习禽类养殖相关专业，理论学习与实习实践',
    badge: '学习',
    icon: 'school',
    color: { icon: '#8B5CF6', bg: '#F5F3FF', badge: '#F5F3FF', badgeText: '#8B5CF6' },
    subRoles: [
      { value: 'learning', label: '学习阶段' },
      { value: 'cognitive', label: '认知实习' },
      { value: 'internship', label: '顶岗实习' },
    ],
    features: [
      { icon: 'book', label: '题库学习' },
      { icon: 'create', label: '实习日志' },
      { icon: 'people', label: '导师指导' },
    ],
  },
];

export default function RoleSelectScreen() {
  const [selected, setSelected] = useState<MainRole>('farmer');
  const [selectedSub, setSelectedSub] = useState<SubRole>('small');
  const router = useRouter();
  const token = useAuthStore((s) => s.token);

  if (token) {
    return <Redirect href="/" />;
  }

  const selectRole = (role: RoleOption) => {
    setSelected(role.value);
    setSelectedSub(role.subRoles[0].value);
  };

  const selectSubRole = (role: RoleOption, sub: SubRole) => {
    setSelected(role.value);
    setSelectedSub(sub);
  };

  const handleNext = () => {
    router.push({ pathname: '/register', params: { role: selected, subRole: selectedSub } });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>选择您的身份</Text>
          <Text style={styles.headerDesc}>
            不同身份将获得定制化的功能服务与数据看板，选择后可在个人中心随时切换
          </Text>
        </View>

        <View style={styles.roleSection}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelBar} />
            <Text style={styles.sectionLabel}>主角色</Text>
          </View>

          {ROLES.map((role) => {
            const active = selected === role.value;
            return (
              <TouchableOpacity
                key={role.value}
                style={[styles.roleCard, active && styles.roleCardActive]}
                activeOpacity={0.85}
                onPress={() => selectRole(role)}
              >
                <View style={styles.roleCardTop}>
                  <View style={[styles.roleIcon, { backgroundColor: role.color.bg }]}>
                    <Ionicons name={role.icon} size={28} color={role.color.icon} />
                  </View>
                  <View style={styles.roleInfo}>
                    <View style={styles.roleNameRow}>
                      <Text style={styles.roleName}>{role.name}</Text>
                      <View style={[styles.roleBadge, { backgroundColor: role.color.badge }]}>
                        <Text style={[styles.roleBadgeText, { color: role.color.badgeText }]}>
                          {role.badge}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.roleDesc}>{role.desc}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={active ? PRIMARY : '#94A3B8'} />
                </View>

                <View style={styles.subRoleRow}>
                  {role.subRoles.map((sub) => {
                    const subActive = active && selectedSub === sub.value;
                    return (
                      <TouchableOpacity
                        key={sub.value}
                        style={[styles.subRole, subActive && styles.subRoleActive]}
                        onPress={() => selectSubRole(role, sub.value)}
                      >
                        <Text style={[styles.subRoleText, subActive && styles.subRoleTextActive]}>
                          {sub.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.featureRow}>
                  {role.features.map((f) => (
                    <View key={f.label} style={styles.featureTag}>
                      <Ionicons name={f.icon} size={12} color="#64748B" />
                      <Text style={styles.featureTagText}>{f.label}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnPrimary} onPress={handleNext}>
          <Text style={styles.btnPrimaryText}>下一步</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.skipLink}>返回登录</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { paddingBottom: 120 },
  header: { paddingHorizontal: 24, paddingTop: 64, paddingBottom: 28 },
  headerTitle: { fontSize: 26, fontWeight: '800', marginBottom: 8, color: '#1E293B' },
  headerDesc: { fontSize: 14, color: '#64748B', lineHeight: 22 },
  roleSection: { paddingHorizontal: 20 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, paddingLeft: 4 },
  sectionLabelBar: { width: 3, height: 12, backgroundColor: PRIMARY, borderRadius: 2 },
  sectionLabel: { fontSize: 12, color: '#94A3B8', fontWeight: '600', letterSpacing: 2 },
  roleCard: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 20,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  roleCardActive: {
    borderColor: PRIMARY,
    backgroundColor: '#F0FDF4',
    shadowColor: PRIMARY,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  roleCardTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 14 },
  roleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleInfo: { flex: 1 },
  roleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  roleName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  roleBadgeText: { fontSize: 10, fontWeight: '600' },
  roleDesc: { fontSize: 13, color: '#64748B' },
  subRoleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  subRole: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  subRoleActive: {
    backgroundColor: PRIMARY,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  subRoleText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  subRoleTextActive: { color: '#fff', fontWeight: '600' },
  featureRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  featureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  featureTagText: { fontSize: 11, color: '#64748B' },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 28,
    backgroundColor: '#F8FAFC',
  },
  btnPrimary: {
    width: '100%',
    padding: 16,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  skipLink: { textAlign: 'center', marginTop: 12, fontSize: 13, color: '#94A3B8' },
});
