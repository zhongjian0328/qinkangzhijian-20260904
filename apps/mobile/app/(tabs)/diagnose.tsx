import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';

export default function DiagnoseScreen() {
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI 诊断</Text>
      <Text style={styles.subtitle}>选择或拍摄禽类照片进行分析</Text>

      {image ? (
        <View style={styles.preview}>
          <Text>图片已选择: {image}</Text>
        </View>
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>点击下方按钮选择图片</Text>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={pickImage}>
          <Text style={styles.buttonText}>📁 从相册选择</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={takePhoto}>
          <Text style={[styles.buttonText, styles.secondaryText]}>📷 拍照</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 20 },
  placeholderText: { color: '#999' },
  preview: { marginVertical: 20, padding: 20, backgroundColor: '#f5f5f5', borderRadius: 12 },
  actions: { gap: 12 },
  button: { padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryButton: { backgroundColor: '#22C55E' },
  secondaryButton: { backgroundColor: '#e8f5e9' },
  buttonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  secondaryText: { color: '#22C55E' },
});
