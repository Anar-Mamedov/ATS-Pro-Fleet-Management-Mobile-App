import AsyncStorage from '@react-native-async-storage/async-storage';

// Oturumdaki kullanıcının şoför (sürücü) olup olmadığı. Giriş cevabı login sırasında
// AsyncStorage'a 'loginResponse' olarak yazılıyor; okunamazsa şoför değil kabul edilir.
export async function getIsDriver(): Promise<boolean> {
  try {
    const loginResponse = await AsyncStorage.getItem('loginResponse');
    return loginResponse ? JSON.parse(loginResponse).isDriver === true : false;
  } catch (error) {
    console.error('Error parsing loginResponse:', error);
    return false;
  }
}
