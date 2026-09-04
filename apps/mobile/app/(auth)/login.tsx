import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!phone || !password) {
      Alert.alert('提示', '请填写手机号和密码');
      return;
    }

    try {
      // TODO: Replace with actual API call
      // const res = await api.post(isLogin ? '/auth/login' : '/auth/register', {
      //   phone,
      //   password,
      //   username: phone,
      // });
      Alert.alert('提示', '登录功能需要配置API地址');
    } catch (e) {
      Alert.alert('错误', '操作失败');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? '登录' : '注册'}</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>{isLogin ? '登录' : '注册'}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
        <Text style={styles.switchText}>
          {isLogin ? '没有账号？去注册' : '已有账号？去登录'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#22C55E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  switchText: { color: '#22C55E', textAlign: 'center', marginTop: 16 },
});
