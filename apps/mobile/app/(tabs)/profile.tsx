import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { useAuthStore } from '../../src/store/auth';
import { notificationApi } from '../../src/api/notification';

const ROLE_LABEL: Record<string, string> = {
  admin: '管理员',
  farmer: '养殖户',
  vet: '兽医服务商',
  technician: '技术员',
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

function roleText(user: { role: string; subRole?: string | null }): string {
  const main = ROLE_LABEL[user.role] ?? user.role;
  const sub = user.subRole ? `·${SUB_ROLE_LABEL[user.subRole] ?? user.subRole}` : '';
  return `${main}${sub}`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [unread, setUnread] = useState(0);

  useFocusEffect(
    useCallback(() => {
      notificationApi
        .unreadCount()
        .then(setUnread)
        .catch(() => {});
    }, []),
  );

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
          {roleText(user)} · {user.phone}
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
          <Text style={styles.infoValue}>{roleText(user)}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.entryButton} onPress={() => router.push('/notifications')}>
        <Text style={styles.entryText}>消息通知</Text>
        <View style={styles.entryRight}>
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
          <Text style={styles.entryArrow}>›</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.entryButton} onPress={() => router.push('/certification')}>
        <Text style={styles.entryText}>身份认证</Text>
        <Text style={styles.entryArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.entryButton} onPress={() => router.push('/prevention')}>
        <Text style={styles.entryText}>我的防控预案</Text>
        <Text style={styles.entryArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.entryButton} onPress={() => router.push('/intern')}>
        <Text style={styles.entryText}>实习日志</Text>
        <Text style={styles.entryArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.entryButton} onPress={() => router.push('/epidemic')}>
        <Text style={styles.entryText}>疫情上报</Text>
        <Text style={styles.entryArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.entryButton} onPress={() => router.push('/epidemic/statistics')}>
        <Text style={styles.entryText}>区域疫情统计</Text>
        <Text style={styles.entryArrow}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      <Text style={styles.version}>禽康智检 v{Constants.expoConfig?.version ?? '3.5.0'}</Text>
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
  entryButton: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryText: { fontSize: 15, color: '#111', fontWeight: '600' },
  entryArrow: { fontSize: 18, color: '#999' },
  entryRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  logoutButton: {
    marginHorizontal: 20,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  logoutText: { fontSize: 16, fontWeight: 'bold', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#bbb', marginTop: 24, marginBottom: 12 },
});