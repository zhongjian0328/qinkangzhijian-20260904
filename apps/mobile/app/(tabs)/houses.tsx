import { View, Text, StyleSheet } from 'react-native';

export default function HousesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>禽舍管理</Text>
      <Text style={styles.empty}>暂无禽舍，请先添加</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
});
