import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import * as ImagePicker from 'expo-image-picker';
import { useCameraPermissions } from 'expo-camera';
import React, { useState, useCallback } from 'react';
import { Alert, TouchableOpacity, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CameraCaptureModal } from './CameraCaptureModal';

export interface PhotoUploadButtonProps {
  selectedPhotos: { uri: string; fileName: string }[];
  onPhotosChange: (photos: { uri: string; fileName: string }[]) => void;
  disabled?: boolean;
  label?: string;
  isDarkMode?: boolean;
  maxPhotos?: number;
}

export function PhotoUploadButton({
  selectedPhotos,
  onPhotosChange,
  disabled = false,
  label,
  isDarkMode = false,
  maxPhotos = 5,
}: PhotoUploadButtonProps) {
  const { t } = useTranslation();
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const pickFromLibrary = useCallback(async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          t('permissionRequired') || 'İzin Gerekli',
          t('galleryPermissionDenied') || 'Galeriye erişim izni verilmedi. Lütfen ayarlardan izin verin.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.9,
        allowsMultipleSelection: true,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newPhotos = result.assets.map((asset, index) => ({
          uri: asset.uri,
          fileName: asset.fileName || `photo_${Date.now()}_${index}.jpg`,
        }));

        const combined = [...selectedPhotos, ...newPhotos];
        if (combined.length > maxPhotos) {
          Alert.alert(
            t('warning') || 'Uyarı',
            t('maxPhotosExceeded') || `En fazla ${maxPhotos} fotoğraf yükleyebilirsiniz.`
          );
          onPhotosChange(combined.slice(0, maxPhotos));
        } else {
          onPhotosChange(combined);
        }
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(t('error'), t('galleryAccessError') || 'Galeriye erişim sırasında bir hata oluştu.');
    }
  }, [t, onPhotosChange, selectedPhotos, maxPhotos]);

  const openCamera = useCallback(async () => {
    try {
      if (!permission) {
        return;
      }

      if (!permission.granted) {
        const result = await requestPermission();
        if (!result.granted) {
          Alert.alert(
            t('permissionRequired') || 'İzin Gerekli',
            t('cameraPermissionDenied') || 'Kameraya erişim izni verilmedi. Lütfen ayarlardan izin verin.'
          );
          return;
        }
      }

      setCameraVisible(true);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(t('error'), t('cameraOpenError') || 'Kamera açılırken bir hata oluştu.');
    }
  }, [permission, requestPermission, t]);

  const handleCameraCapture = useCallback(
    async (photo: { uri?: string }) => {
      if (!photo?.uri) {
        throw new Error('Fotoğraf URI alınamadı');
      }

      setCameraVisible(false);

      if (selectedPhotos.length >= maxPhotos) {
        Alert.alert(
          t('warning') || 'Uyarı',
          t('maxPhotosExceeded') || `En fazla ${maxPhotos} fotoğraf yükleyebilirsiniz.`
        );
        return;
      }

      onPhotosChange([
        ...selectedPhotos,
        {
          uri: photo.uri,
          fileName: `camera_${Date.now()}.jpg`,
        },
      ]);
    },
    [onPhotosChange, selectedPhotos, maxPhotos, t]
  );

  const showImageOptions = useCallback(() => {
    Alert.alert(
      t('selectImage') || 'Resim Seç',
      t('selectImageSource') || 'Resim kaynağını seçin',
      [
        {
          text: t('camera') || 'Kamera',
          onPress: () => {
            void openCamera();
          },
        },
        {
          text: t('gallery') || 'Galeri',
          onPress: () => {
            void pickFromLibrary();
          },
        },
        {
          text: t('cancel') || 'İptal',
          style: 'cancel',
        },
      ]
    );
  }, [t, openCamera, pickFromLibrary]);

  const removePhoto = useCallback(
    (index: number) => {
      const newPhotos = selectedPhotos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
    },
    [selectedPhotos, onPhotosChange]
  );

  const canAddMorePhotos = selectedPhotos.length < maxPhotos;

  return (
    <>
      <YStack gap="$2">
        {label && (
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$3" fontWeight="600">
              {label}
            </Text>
            <Text fontSize="$2" color="$gray10">
              ({selectedPhotos.length}/{maxPhotos})
            </Text>
          </XStack>
        )}

        {selectedPhotos.length > 0 && (
          <YStack gap="$2">
            {selectedPhotos.map((photo, index) => (
              <XStack
                key={`${photo.uri}-${index}`}
                padding="$3"
                backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
                borderRadius="$2"
                borderWidth={1}
                borderColor={isDarkMode ? '#333' : '#ddd'}
                alignItems="center"
                justifyContent="space-between"
              >
                <XStack alignItems="center" gap="$3" flex={1}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 8,
                    }}
                  />
                  <Text fontSize="$2" color={isDarkMode ? '#fff' : '#000'} flex={1} numberOfLines={1}>
                    {photo.fileName}
                  </Text>
                </XStack>
                <TouchableOpacity onPress={() => removePhoto(index)} disabled={disabled}>
                  <MaterialIcons name="close" size={24} color={isDarkMode ? '#fff' : '#000'} />
                </TouchableOpacity>
              </XStack>
            ))}
          </YStack>
        )}

        {canAddMorePhotos && (
          <Button
            onPress={showImageOptions}
            disabled={disabled}
            backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
            borderColor={isDarkMode ? '#333' : '#ddd'}
            borderWidth={1}
            color={isDarkMode ? '#fff' : '#000'}
            fontWeight="600"
            height={50}
            borderRadius="$2"
            icon={<MaterialIcons name="add-photo-alternate" size={20} color={isDarkMode ? '#fff' : '#000'} />}
          >
            {selectedPhotos.length > 0 ? t('addMorePhotos') || 'Daha Fazla Resim Ekle' : t('uploadPhoto') || 'Resim Yükle'}
          </Button>
        )}
      </YStack>
      <CameraCaptureModal visible={cameraVisible} onClose={() => setCameraVisible(false)} onCapture={handleCameraCapture} />
    </>
  );
}
