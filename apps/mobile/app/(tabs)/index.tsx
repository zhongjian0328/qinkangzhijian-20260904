import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>欢迎使用禽康智检</Text>
        <Text style={styles.subGreeting}>AI辅助禽类疾病诊断</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.actionCard, styles.primaryAction]}>
          <Text style={styles.actionTitle}>📷 开始诊断</Text>
          <Text style={styles.actionDesc}>拍照或上传图片进行AI诊断</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <Text style={styles.actionTitle}>📊 环境监控</Text>
          <Text style={styles.actionDesc}>查看禽舍实时环境数据</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>最近诊断</Text>
        <Text style={styles.emptyText}>暂无诊断记录</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#22C55E' },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: '#e0ffe0', marginTop: 4 },
  quickActions: { padding: 16, gap: 12 },
  actionCard: { padding: 20, borderRadius: 12, backgroundColor: '#fff', elevation: 2 },
  primaryAction: { backgroundColor: '#22C55E' },
  actionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  actionDesc: { fontSize: 12, color: '#e0ffe0', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  emptyText: { color: '#999', textAlign: 'center', padding: 20 },
});
