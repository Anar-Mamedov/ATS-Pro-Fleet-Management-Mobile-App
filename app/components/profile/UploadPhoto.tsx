import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@tamagui/button';
import { Text, View } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Platform } from 'react-native';
import { apiService } from '../../../services/apiService';

interface UploadPhotoProps {
  refId: number;
  refGroup: string;
  isForDefault?: boolean;
  currentPhotoUri?: string;
  onUploadSuccess?: (photoUri: string) => void;
  onUploadError?: (error: string) => void;
}

export default function UploadPhoto({ refId, refGroup, isForDefault = true, currentPhotoUri, onUploadSuccess, onUploadError }: UploadPhotoProps) {
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(currentPhotoUri || null);

  // İzin kontrolü ve alma
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const libraryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();

      if (libraryStatus.status !== 'granted') {
        Alert.alert(t('permission_denied') || 'İzin Reddedildi', t('gallery_permission_required') || 'Galeri erişimi için izin gerekli!');
        return false;
      }

      if (cameraStatus.status !== 'granted') {
        Alert.alert(t('permission_denied') || 'İzin Reddedildi', t('camera_permission_required') || 'Kamera erişimi için izin gerekli!');
        return false;
      }
    }
    return true;
  };

  // Galeri'den resim seçme
  const pickImageFromGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false, // Android için base64 kullanmıyoruz
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        await uploadImage(selectedImage.uri, selectedImage.fileName || 'profile.jpg');
      }
    } catch (error) {
      console.error('Resim seçme hatası:', error);
      Alert.alert(t('error') || 'Hata', t('image_selection_error') || 'Resim seçilirken hata oluştu');
    }
  };

  // Kamera ile resim çekme
  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const selectedImage = result.assets[0];
        await uploadImage(selectedImage.uri, selectedImage.fileName || 'profile.jpg');
      }
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      Alert.alert(t('error') || 'Hata', t('camera_error') || 'Fotoğraf çekilirken hata oluştu');
    }
  };

  // Resim yükleme fonksiyonu
  const uploadImage = async (imageUri: string, fileName: string) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      let logData: any;

      // Platform'a göre farklı yaklaşımlar
      if (Platform.OS === 'web') {
        // Web için blob kullan
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('images', blob, fileName);
        logData = { name: fileName, type: blob.type, size: blob.size, uri: imageUri };
      } else {
        // Android/iOS için URI kullan - güncel Expo önerisi
        const fileExtension = imageUri.split('.').pop() || 'jpg';

        // Dosya adının uzantısının, URI'den alınan gerçek uzantıyla eşleştiğinden emin olalım.
        // Bu, "Invalid photo format !" hatasını önlemeye yardımcı olur.
        const baseName = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
        const finalFileName = `${baseName}.${fileExtension}`;
        const mimeType = `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;

        const fileDetails = {
          uri: imageUri,
          type: mimeType,
          name: finalFileName,
        };

        formData.append('images', fileDetails as any);
        logData = fileDetails;
      }

      console.log('--- Photo Upload Data ---');
      console.log('Request to /Photo/UploadPhoto');
      console.log('URL Parameters:', { refId, refGroup, isForDefault });
      console.log('File Data:', logData);
      console.log('--------------------------');

      // API endpoint'e yükleme
      await apiService.uploadPhoto(formData, refId, refGroup, isForDefault);

      // Başarılı yükleme
      setSelectedImageUri(imageUri);
      Alert.alert(t('success') || 'Başarılı', t('image_upload_success') || `${fileName} başarıyla yüklendi.`);
      onUploadSuccess?.(imageUri);
    } catch (error: any) {
      console.error('Resim yükleme hatası:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Yükleme sırasında hata oluştu';
      Alert.alert(t('error') || 'Hata', t('image_upload_error') || `${fileName} yükleme sırasında bir hata oluştu: ${errorMessage}`);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Seçim modalı göster
  const showImageOptions = () => {
    Alert.alert(t('select_image') || 'Resim Seç', t('choose_image_source') || 'Resim kaynağını seçin', [
      {
        text: t('camera') || 'Kamera',
        onPress: takePhoto,
      },
      {
        text: t('gallery') || 'Galeri',
        onPress: pickImageFromGallery,
      },
      {
        text: t('cancel') || 'İptal',
        style: 'cancel',
      },
    ]);
  };

  return (
    <YStack space="$4" alignItems="center">
      {/* Profil Resmi Gösterimi */}
      <View width={120} height={120} borderRadius={60} backgroundColor="$gray5" alignItems="center" justifyContent="center" borderWidth={2} borderColor="$gray8" overflow="hidden">
        {isUploading ? (
          <YStack space="$2" alignItems="center">
            <ActivityIndicator size="large" color="#007AFF" />
            <Text fontSize="$3" color="$gray11">
              {t('uploading') || 'Yükleniyor...'}
            </Text>
          </YStack>
        ) : selectedImageUri ? (
          <Image source={{ uri: selectedImageUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <YStack space="$2" alignItems="center">
            <MaterialIcons name="camera-alt" size={40} color="#999" />
            <Text fontSize="$3" color="$gray10" textAlign="center">
              {t('no_photo') || 'Fotoğraf\nYok'}
            </Text>
          </YStack>
        )}
      </View>

      {/* Yükleme Butonları */}
      <XStack space="$3">
        <Button
          size="$4"
          theme="blue"
          icon={<MaterialIcons name="cloud-upload" size={20} color="white" />}
          onPress={showImageOptions}
          disabled={isUploading}
          opacity={isUploading ? 0.6 : 1}
        >
          {selectedImageUri ? t('change_photo') || 'Fotoğrafı Değiştir' : t('upload_photo') || 'Fotoğraf Yükle'}
        </Button>
      </XStack>

      {/* Bilgi Metni */}
      <Text fontSize="$2" color="$gray11" textAlign="center" maxWidth={280}>
        {t('photo_upload_info') || 'Profil fotoğrafınızı yüklemek için butona tıklayın. Kare format önerilir.'}
      </Text>
    </YStack>
  );
}
