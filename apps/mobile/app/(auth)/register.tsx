import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MainRole, SubRole } from '@qinkang/types';
import { useAuthStore } from '../../src/store/auth';

const PRIMARY = '#22C55E';

const ROLE_LABEL: Record<string, string> = {
  farmer: '养殖户',
  vet: '兽医服务商',
  merchant: '兽药/设备商',
  institution: '机构',
  student: '学生',
};

const SUB_ROLE_LABEL: Record<string, string> = {
  small: '小散户',
  cooperative: '合作社',
  enterprise: '养殖企业',
  service: '兽医服务',
  medicine: '兽药商',
  equipment: '设备商',
  cdc: '疫控机构',
  research: '科研院所',
  teacher: '教师',
  learning: '学习阶段',
  cognitive: '认知实习',
  internship: '顶岗实习',
};

export default function RegisterScreen() {
  const params = useLocalSearchParams<{ role?: string; subRole?: string }>();
  const role = (params.role ?? 'farmer') as MainRole;
  const subRole = (params.subRole ?? undefined) as SubRole | undefined;

  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const register = useAuthStore((s) => s.register);

  if (token) {
    return <Redirect href="/" />;
  }

  const roleLabel = `${ROLE_LABEL[role] ?? role}${subRole ? ` · ${SUB_ROLE_LABEL[subRole] ?? subRole}` : ''}`;

  const handleSubmit = async () => {
    if (!username.trim()) {
      Alert.alert('提示', '请填写用户名');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('提示', '请填写手机号');
      return;
    }
    if (password.length < 6) {
      Alert.alert('提示', '密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('提示', '两次输入的密码不一致');
      return;
    }
    try {
      await register(username.trim(), phone.trim(), password, role, subRole ?? null);
      router.replace('/');
    } catch (e) {
      Alert.alert('注册失败', e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 导航栏 */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>注册账号</Text>
      </View>

      {/* 角色摘要 */}
      <TouchableOpacity style={styles.roleSummary} onPress={() => router.replace('/role-select')}>
        <View style={styles.roleSummaryIcon}>
          <Ionicons name="person" size={20} color={PRIMARY} />
        </View>
        <View style={styles.roleSummaryInfo}>
          <Text style={styles.roleSummaryLabel}>当前身份</Text>
          <Text style={styles.roleSummaryValue}>{roleLabel}</Text>
        </View>
        <Text style={styles.roleSummaryChange}>重新选择</Text>
      </TouchableOpacity>

      {/* 表单 */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Ionicons name="person-outline" size={14} color="#94A3B8" />
            <Text style={styles.inputLabel}>用户名</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="请输入用户名"
              placeholderTextColor="#94A3B8"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Ionicons name="phone-portrait-outline" size={14} color="#94A3B8" />
            <Text style={styles.inputLabel}>手机号</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Ionicons name="lock-closed-outline" size={14} color="#94A3B8" />
            <Text style={styles.inputLabel}>密码</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="请设置密码（至少 6 位）"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Ionicons name="lock-closed-outline" size={14} color="#94A3B8" />
            <Text style={styles.inputLabel}>确认密码</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="请再次输入密码"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>注 册</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerHint}>已有账号？</Text>
          <TouchableOpacity onPress={() => router.replace('/login')}>
            <Text style={styles.footerLink}>去登录</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, paddingBottom: 20 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    gap: 12,
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
  navTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  roleSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
    borderRadius: 16,
    gap: 10,
  },
  roleSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSummaryInfo: { flex: 1 },
  roleSummaryLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  roleSummaryValue: { fontSize: 16, fontWeight: '700', color: '#1E293B' },
  roleSummaryChange: { fontSize: 12, color: PRIMARY, fontWeight: '600' },
  formSection: { paddingHorizontal: 24 },
  inputGroup: { marginBottom: 12 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  inputLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
  },
  input: { flex: 1, padding: 13, fontSize: 15, color: '#1E293B' },
  btnPrimary: {
    width: '100%',
    padding: 14,
    backgroundColor: PRIMARY,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 4,
    shadowColor: PRIMARY,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  footerHint: { fontSize: 13, color: '#64748B' },
  footerLink: { fontSize: 13, color: PRIMARY, fontWeight: '600' },
});
