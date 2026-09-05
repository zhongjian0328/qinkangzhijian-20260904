import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/auth';

export default function ServicesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const isVet = !!user && ['vet', 'technician', 'admin'].includes(user.role);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>生态服务</Text>
        <Text style={styles.subtitle}>兽药商城 · 诊疗服务 · 专家咨询</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.card} onPress={() => router.push('/mall')}>
          <View style={styles.iconBox}>
            <Ionicons name="cart-outline" size={26} color="#22C55E" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>兽药商城</Text>
            <Text style={styles.cardDesc}>兽药、疫苗、饲料在线购买</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/service')}>
          <View style={styles.iconBox}>
            <Ionicons name="medkit-outline" size={26} color="#22C55E" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>诊疗服务</Text>
            <Text style={styles.cardDesc}>现场 / 在线 / 实验室检测服务下单</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/consult')}>
          <View style={styles.iconBox}>
            <Ionicons name="chatbubbles-outline" size={26} color="#22C55E" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>专家咨询</Text>
            <Text style={styles.cardDesc}>向兽医发起在线咨询</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={() => router.push('/orders')}>
          <View style={styles.iconBox}>
            <Ionicons name="receipt-outline" size={26} color="#22C55E" />
          </View>
          <View style={styles.cardText}>
            <Text style={styles.cardTitle}>我的订单</Text>
            <Text style={styles.cardDesc}>查看商城订单与状态</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        {isVet ? (
          <>
            <Text style={styles.sectionTitle}>兽医工作台</Text>
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/service', params: { tab: 'pool' } })}>
              <View style={styles.iconBox}>
                <Ionicons name="clipboard-outline" size={26} color="#F59E0B" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>诊疗接单大厅</Text>
                <Text style={styles.cardDesc}>查看并接取养殖户诊疗服务单</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.card} onPress={() => router.push({ pathname: '/consult', params: { tab: 'pool' } })}>
              <View style={styles.iconBox}>
                <Ionicons name="chatbox-ellipses-outline" size={26} color="#F59E0B" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>咨询大厅</Text>
                <Text style={styles.cardDesc}>回复养殖户的在线咨询</Text>
              </View>
              <Text style={styles.arrow}>›</Text>
            </TouchableOpacity>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  subtitle: { fontSize: 13, color: '#999', marginTop: 4 },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  iconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  cardDesc: { fontSize: 13, color: '#999', marginTop: 3 },
  arrow: { fontSize: 20, color: '#ccc', marginLeft: 8 },
  sectionTitle: { fontSize: 14, color: '#666', fontWeight: '600', marginTop: 8, marginBottom: 10 },
});
