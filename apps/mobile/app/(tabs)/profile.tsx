import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>未登录</Text>
        <Text style={styles.desc}>登录后享受完整功能</Text>
      </View>
      <TouchableOpacity style={styles.loginButton}>
        <Text style={styles.loginText}>登录/注册</Text>
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
});
