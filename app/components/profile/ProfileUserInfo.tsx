import { useThemeController } from '@/config/theme';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, Modal, TouchableOpacity } from 'react-native';
import { apiService } from '../../../services/apiService';
import UploadPhoto from './UploadPhoto';

interface UserInfo {
  siraNo: number;
  kullaniciKod: string;
  isim: string;
  soyAd: string;
  sifre: string;
  accessToken: string | null;
  aktif: boolean;
  gucluSifreAktif: boolean;
  firmaSifre: string | null;
  email: string;
  telefon: string;
  paraf: string;
  kullaniciRengi: string;
  defPhotoInfo: {
    tbResimId: number;
    rsmRefId: number;
    rsmRefGrup: string | null;
    rsmUzanti: string;
    rsmAd: string;
    rsmYol: string | null;
    rsmBoyut: number;
  };
  defRsmId: number;
}

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export default function ProfileUserInfo() {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isDriver, setIsDriver] = useState(false);

  const fetchProfilePhoto = useCallback(async (photoId: number, extension: string, fileName: string) => {
    try {
      const photoArrayBuffer = await apiService.downloadPhotoById(photoId, extension, fileName);

      if (photoArrayBuffer) {
        const base64String = arrayBufferToBase64(photoArrayBuffer);
        const mimeType = extension.replace('.', '');
        setProfilePhoto(`data:image/${mimeType};base64,${base64String}`);
      }
    } catch (error: any) {
      console.error('Error fetching profile photo:', error);
      // Fotoğraf yüklenemezse sessizce devam et, hata gösterme
    }
  }, []);

  const fetchUserInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // AsyncStorage'dan kullanıcı ID'sini al
      const userId = await AsyncStorage.getItem('id');

      if (!userId) {
        setError(t('userIdNotFound'));
        return;
      }

      // isDriver bilgisini AsyncStorage'dan al
      const loginResponse = await AsyncStorage.getItem('loginResponse');
      let driverStatus = false;
      if (loginResponse) {
        const parsedLoginResponse = JSON.parse(loginResponse);
        driverStatus = parsedLoginResponse.isDriver === true;
      }
      setIsDriver(driverStatus);

      // API'den kullanıcı bilgilerini getir
      const userData = await apiService.getUserInfoById(userId);
      setUserInfo(userData);

      // Profil fotoğrafını getir
      if (userData.defPhotoInfo && userData.defPhotoInfo.tbResimId) {
        await fetchProfilePhoto(userData.defPhotoInfo.tbResimId, userData.defPhotoInfo.rsmUzanti, userData.defPhotoInfo.rsmAd);
      }
    } catch (error: any) {
      console.error('Error fetching user info:', error);
      setError(error.message || t('userInfoError'));
      Alert.alert(t('error'), error.message || t('userInfoError'));
    } finally {
      setLoading(false);
    }
  }, [fetchProfilePhoto, t]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  // Resim yükleme başarılı olduğunda çağrılacak
  const handleUploadSuccess = (photoUri: string) => {
    setProfilePhoto(photoUri);
    setShowUploadModal(false);
    // Kullanıcı bilgilerini yenile
    fetchUserInfo();
  };

  // Resim yükleme hatası olduğunda çağrılacak
  const handleUploadError = (error: string) => {
    console.error('Upload error:', error);
    setShowUploadModal(false);
  };

  if (loading) {
    return (
      <View padding="$4">
        <Text fontSize="$5" textAlign="center">
          {t('loading')}
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View padding="$4">
        <Text fontSize="$5" color="$red10" textAlign="center">
          {error}
        </Text>
      </View>
    );
  }

  if (!userInfo) {
    return (
      <View padding="$4">
        <Text fontSize="$5" textAlign="center">
          {t('userInfoNotFound')}
        </Text>
      </View>
    );
  }

  return (
    <View padding="$4">
      <YStack space="$4" alignItems="center">
        {/* Profil Fotoğrafı */}
        <View position="relative">
          <View width={80} height={80} borderRadius={40} backgroundColor="$backgroundStrong" alignItems="center" justifyContent="center" overflow="hidden">
            {profilePhoto ? (
              <Image
                source={{ uri: profilePhoto }}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                }}
                resizeMode="cover"
              />
            ) : (
              <Text fontSize="$6" fontWeight="600" color="$color">
                {userInfo.isim?.charAt(0) || ''}
                {userInfo.soyAd?.charAt(0) || ''}
              </Text>
            )}
          </View>

          {/* Edit Icon */}
          <TouchableOpacity
            onPress={() => setShowUploadModal(true)}
            style={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              backgroundColor: '#0A84FF',
              borderRadius: 12,
              width: 24,
              height: 24,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: '#FFFFFF',
            }}
          >
            <MaterialIcons name="edit" size={14} color="white" />
          </TouchableOpacity>
        </View>

        {/* Kullanıcı Bilgileri */}
        <YStack space="$3" alignItems="center">
          <YStack space="$2" alignItems="center">
            {/* <Text fontSize="$3" color="$gray10" fontWeight="500">
              {t('name')}
            </Text> */}
            <Text fontSize="$6" fontWeight="600" textAlign="center" color="$color">
              {userInfo.isim || ''} {userInfo.soyAd || ''}
            </Text>
          </YStack>

          <YStack space="$2" alignItems="center">
            {/*  <Text fontSize="$3" color="$gray10" fontWeight="500">
              {t('email')}
            </Text> */}
            <Text fontSize="$5" color="$blue10" textAlign="center">
              {userInfo.email || ''}
            </Text>
          </YStack>
        </YStack>
      </YStack>

      {/* Upload Photo Modal */}
      <Modal visible={showUploadModal} transparent={true} animationType="slide" onRequestClose={() => setShowUploadModal(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF',
              borderRadius: 20,
              padding: 20,
              width: '90%',
              maxWidth: 400,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Text fontSize="$6" fontWeight="600" color="$color">
                {t('upload_photo') || 'Fotoğraf Yükle'}
              </Text>
              <TouchableOpacity
                onPress={() => setShowUploadModal(false)}
                style={{
                  padding: 5,
                }}
              >
                <MaterialIcons name="close" size={24} color={themeName === 'dark' ? '#A1A1AA' : '#666'} />
              </TouchableOpacity>
            </View>

            {/* Upload Photo Component */}
            {userInfo && (
              <UploadPhoto
                refId={userInfo.siraNo}
                refGroup={isDriver ? 'SURUCU' : 'USER'}
                isForDefault={true}
                currentPhotoUri={profilePhoto || undefined}
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
