import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/auth';

const ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  farmer: '养殖户',
  vet: '兽医',
  technician: '技术员',
};

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '退出',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/login');
        },
      },
    ]);
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.name}>未登录</Text>
          <Text style={styles.desc}>登录后享受完整功能</Text>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.replace('/login')}>
          <Text style={styles.loginText}>登录/注册</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{user.username}</Text>
        <Text style={styles.desc}>
          {ROLE_LABEL[user.role] ?? user.role} · {user.phone}
        </Text>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>用户名</Text>
          <Text style={styles.infoValue}>{user.username}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>手机号</Text>
          <Text style={styles.infoValue}>{user.phone}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>角色</Text>
          <Text style={styles.infoValue}>{ROLE_LABEL[user.role] ?? user.role}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 30, alignItems: 'center', backgroundColor: '#22C55E' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  desc: { fontSize: 12, color: '#e0ffe0', marginTop: 4 },
  loginButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#22C55E',
    borderRadius: 12,
    alignItems: 'center',
  },
  loginText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  infoCard: { margin: 20, padding: 16, borderRadius: 12, backgroundColor: '#fff' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  infoLabel: { fontSize: 14, color: '#999' },
  infoValue: { fontSize: 14, color: '#111', fontWeight: '500' },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
});