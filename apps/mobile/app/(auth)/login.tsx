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
import { useRouter, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../src/store/auth';

// 主色：品牌绿 #22C55E（原 UI 原型为 teal #0EA5A4，按需求统一替换为绿色）
const COLORS = {
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#86EFAC',
  primaryBg: '#F0FDF4',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
};

type LoginMode = 'code' | 'password';

export default function LoginScreen() {
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);

  if (token) {
    return <Redirect href="/" />;
  }

  const handleSendCode = () => {
    Alert.alert('提示', '短信验证码服务暂未开通，请使用密码登录');
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      Alert.alert('提示', '请填写手机号');
      return;
    }
    if (mode === 'code') {
      if (!code.trim()) {
        Alert.alert('提示', '请填写验证码');
        return;
      }
      Alert.alert('提示', '短信验证码服务暂未开通，请使用密码登录');
      return;
    }
    if (!password) {
      Alert.alert('提示', '请填写密码');
      return;
    }
    try {
      await login(phone.trim(), password);
      router.replace('/');
    } catch (e) {
      Alert.alert('登录失败', e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 顶部装饰 */}
      <View style={styles.topDecoration} />
      <View style={styles.bottomDecoration} />

      {/* Logo 区 */}
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <Ionicons name="shield-checkmark" size={38} color="#fff" />
        </View>
        <Text style={styles.appName}>禽康智检</Text>
        <Text style={styles.appSlogan}>AI 赋能 · 精准诊断 · 绿色防控</Text>
      </View>

      {/* 表单区 */}
      <View style={styles.formSection}>
        <View style={styles.tabGroup}>
          <TouchableOpacity
            style={[styles.tabItem, mode === 'code' && styles.tabItemActive]}
            onPress={() => setMode('code')}
          >
            <Text style={[styles.tabText, mode === 'code' && styles.tabTextActive]}>验证码登录</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, mode === 'password' && styles.tabItemActive]}
            onPress={() => setMode('password')}
          >
            <Text style={[styles.tabText, mode === 'password' && styles.tabTextActive]}>密码登录</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputLabelRow}>
            <Ionicons name="phone-portrait-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.inputLabel}>手机号</Text>
          </View>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              maxLength={11}
            />
          </View>
        </View>

        {mode === 'code' ? (
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.inputLabel}>验证码</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="请输入6位验证码"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                value={code}
                onChangeText={setCode}
                maxLength={6}
              />
              <TouchableOpacity style={styles.codeBtn} onPress={handleSendCode}>
                <Text style={styles.codeBtnText}>获取验证码</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="lock-closed-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.inputLabel}>密码</Text>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="请输入密码"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btnPrimary, isLoading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnPrimaryText}>登 录</Text>
          )}
        </TouchableOpacity>

        <View style={styles.formFooter}>
          <TouchableOpacity onPress={() => Alert.alert('提示', '请联系管理员重置密码')}>
            <Text style={styles.footerLink}>忘记密码？</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/role-select')}>
            <Text style={styles.footerLink}>注册新账号</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.experienceEntry}
          onPress={() => router.push('/role-select')}
        >
          <Text style={styles.experienceTitle}>体验模式 · 无需登录</Text>
          <Text style={styles.experienceDesc}>选择角色直接体验全部功能</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>其他登录方式</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="logo-wechat" size={22} color="#07C160" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color="#1296DB" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.socialBtn}>
            <Ionicons name="add-circle-outline" size={24} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.bottomText}>
        <Text style={styles.bottomTextMain}>
          登录即表示同意 <Text style={styles.bottomTextLink}>《用户协议》</Text> 和{' '}
          <Text style={styles.bottomTextLink}>《隐私政策》</Text>
        </Text>
        <Text style={styles.bottomTextSub}>
          禽康智检 · 禽类养殖智能诊疗平台 v{Constants.expoConfig?.version ?? '3.0.0'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.bg },
  content: { flexGrow: 1, position: 'relative' },
  topDecoration: {
    position: 'absolute',
    top: -100,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(34,197,94,0.08)',
  },
  bottomDecoration: {
    position: 'absolute',
    bottom: -80,
    left: -50,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: 'rgba(37,99,235,0.06)',
  },
  logoSection: { paddingTop: 64, paddingHorizontal: 24, paddingBottom: 36, alignItems: 'center' },
  logoIcon: {
    width: 76,
    height: 76,
    marginBottom: 22,
    backgroundColor: COLORS.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 3,
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  appSlogan: { fontSize: 13, color: COLORS.textSecondary, letterSpacing: 1 },
  formSection: { paddingHorizontal: 24 },
  tabGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.borderLight,
    borderRadius: 12,
    padding: 4,
    marginBottom: 28,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabItemActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: COLORS.primary },
  inputGroup: { marginBottom: 18 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  inputLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
  },
  input: { flex: 1, padding: 16, fontSize: 15, color: COLORS.textPrimary },
  codeBtn: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    borderRadius: 8,
  },
  codeBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  btnPrimary: {
    width: '100%',
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  btnDisabled: { opacity: 0.7 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 2 },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  footerLink: { fontSize: 13, color: COLORS.primary },
  experienceEntry: {
    marginTop: 24,
    padding: 16,
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.15)',
    borderRadius: 14,
    alignItems: 'center',
  },
  experienceTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  experienceDesc: { fontSize: 12, color: COLORS.textSecondary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 8 },
  socialBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  bottomText: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 40, alignItems: 'center' },
  bottomTextMain: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18 },
  bottomTextLink: { color: COLORS.primary },
  bottomTextSub: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginTop: 2 },
});
