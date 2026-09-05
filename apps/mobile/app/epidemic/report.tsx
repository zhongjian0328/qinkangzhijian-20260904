import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { epidemicApi } from '../../src/api/epidemic';

const LEVEL_OPTIONS = [
  { value: 'suspected', label: '疑似' },
  { value: 'confirmed', label: '确诊' },
  { value: 'controlled', label: '已控制' },
];

export default function EpidemicReportScreen() {
  const router = useRouter();
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [disease, setDisease] = useState('');
  const [affected, setAffected] = useState('');
  const [death, setDeath] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [level, setLevel] = useState('suspected');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!location.trim()) {
      Alert.alert('提示', '请填写发生地点');
      return;
    }
    if (!disease.trim()) {
      Alert.alert('提示', '请填写疑似疾病');
      return;
    }
    const aff = parseInt(affected, 10);
    if (Number.isNaN(aff) || aff <= 0) {
      Alert.alert('提示', '请填写正确的发病数量');
      return;
    }

    setSaving(true);
    try {
      await epidemicApi.create({
        location: location.trim(),
        province: province.trim() || null,
        city: city.trim() || null,
        district: district.trim() || null,
        disease: disease.trim(),
        affectedCount: aff,
        deathCount: parseInt(death, 10) || 0,
        symptoms: symptoms.trim() || null,
        level: level as any,
      });
      Alert.alert('上报成功', '疫情信息已提交，感谢您配合疫病防控工作。', [
        { text: '确定', onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert('上报失败', e instanceof Error ? e.message : '请重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>‹ 返回</Text>
        </TouchableOpacity>
        <Text style={styles.title}>疫情上报</Text>
        <Text style={styles.sub}>发现异常情况请及时上报</Text>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          疑似重大动物疫情请立即上报，当地疫控机构将尽快跟进处置。信息仅用于疫病防控，严格保密。
        </Text>
      </View>

      <Text style={styles.fieldLabel}>发生地点 *</Text>
      <TextInput
        style={styles.input}
        placeholder="请填写详细地址（如：XX省XX市XX区XX养殖场）"
        value={location}
        onChangeText={setLocation}
      />

      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="省（选填）"
          value={province}
          onChangeText={setProvince}
        />
        <TextInput
          style={[styles.input, styles.rowInput]}
          placeholder="市（选填）"
          value={city}
          onChangeText={setCity}
        />
      </View>
      <TextInput
        style={styles.input}
        placeholder="区/县（选填）"
        value={district}
        onChangeText={setDistrict}
      />

      <Text style={styles.fieldLabel}>疑似疾病 *</Text>
      <TextInput
        style={styles.input}
        placeholder="如：新城疫、禽流感等"
        value={disease}
        onChangeText={setDisease}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.fieldLabel}>发病数量（羽）*</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={affected}
            onChangeText={setAffected}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.fieldLabel}>死亡数量（羽）</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            value={death}
            onChangeText={setDeath}
          />
        </View>
      </View>

      <Text style={styles.fieldLabel}>疫情级别</Text>
      <View style={styles.levelRow}>
        {LEVEL_OPTIONS.map((o) => {
          const active = level === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.levelChip, active && styles.levelChipActive]}
              onPress={() => setLevel(o.value)}
            >
              <Text style={[styles.levelText, active && styles.levelTextActive]}>{o.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.fieldLabel}>主要症状</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="请描述临床症状、剖检变化、发病进程等"
        multiline
        value={symptoms}
        onChangeText={setSymptoms}
      />

      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitDisabled]}
        onPress={submit}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>提交上报</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 16 },
  back: { fontSize: 15, color: '#22C55E', marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111' },
  sub: { fontSize: 13, color: '#666', marginTop: 4 },
  tipCard: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16 },
  tipText: { fontSize: 12, color: '#991B1B', lineHeight: 18 },
  fieldLabel: { fontSize: 13, color: '#333', fontWeight: '600', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    marginBottom: 8,
    color: '#333',
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', gap: 12 },
  rowInput: { flex: 1 },
  rowItem: { flex: 1 },
  multiline: { height: 100, textAlignVertical: 'top' },
  levelRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  levelChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  levelChipActive: { backgroundColor: '#22C55E' },
  levelText: { color: '#555', fontSize: 14 },
  levelTextActive: { color: '#fff', fontWeight: 'bold' },
  submitButton: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 16,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});