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
import { useAuthStore } from '../../src/store/auth';
import { MainRole, SubRole } from '@qinkang/types';

const MAIN_ROLES: { value: MainRole; label: string }[] = [
  { value: 'farmer', label: '养殖户' },
  { value: 'institution', label: '机构' },
  { value: 'student', label: '学生' },
];

const SUB_ROLES: Record<string, { value: SubRole; label: string }[]> = {
  farmer: [
    { value: 'small', label: '小散户' },
    { value: 'cooperative', label: '合作社' },
    { value: 'enterprise', label: '养殖企业' },
  ],
  institution: [
    { value: 'cdc', label: '疫控' },
    { value: 'research', label: '科研' },
    { value: 'service', label: '服务商' },
    { value: 'teacher', label: '教师' },
  ],
  student: [
    { value: 'learning', label: '学习' },
    { value: 'cognitive', label: '认知实习' },
    { value: 'internship', label: '实习' },
  ],
};

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<MainRole>('farmer');
  const [subRole, setSubRole] = useState<SubRole>('small');
  const router = useRouter();

  const token = useAuthStore((s) => s.token);
  const isLoading = useAuthStore((s) => s.isLoading);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);

  if (token) {
    return <Redirect href="/" />;
  }

  const switchRole = (r: MainRole) => {
    setRole(r);
    setSubRole(SUB_ROLES[r][0].value);
  };

  const handleSubmit = async () => {
    if (!phone) {
      Alert.alert('提示', '请填写手机号');
      return;
    }
    if (!isLogin && !username) {
      Alert.alert('提示', '请填写用户名');
      return;
    }
    if (!password) {
      Alert.alert('提示', '请填写密码');
      return;
    }

    try {
      if (isLogin) {
        await login(phone, password);
      } else {
        await register(username, phone, password, role, subRole);
      }
      router.replace('/');
    } catch (e) {
      Alert.alert(isLogin ? '登录失败' : '注册失败', e instanceof Error ? e.message : '操作失败');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{isLogin ? '登录' : '注册'}</Text>

      {!isLogin ? (
        <TextInput
          style={styles.input}
          placeholder="用户名"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="手机号"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        maxLength={11}
      />
      <TextInput
        style={styles.input}
        placeholder="密码"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {!isLogin ? (
        <>
          <Text style={styles.fieldLabel}>选择身份</Text>
          <View style={styles.chipRow}>
            {MAIN_ROLES.map((r) => {
              const active = role === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => switchRole(r.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>细化角色</Text>
          <View style={styles.chipRow}>
            {(SUB_ROLES[role] ?? []).map((r) => {
              const active = subRole === r.value;
              return (
                <TouchableOpacity
                  key={r.value}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSubRole(r.value)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      ) : null}

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{isLogin ? '登录' : '注册'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 30 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  fieldLabel: { fontSize: 13, color: '#666', marginBottom: 8, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  chipActive: { backgroundColor: '#22C55E' },
  chipText: { color: '#555', fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  button: {
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  switchText: { color: '#22C55E', textAlign: 'center', marginTop: 16 },
});
