import AsyncStorage from '@react-native-async-storage/async-storage';
import { Text, View } from '@tamagui/core';
import { YStack } from '@tamagui/stacks';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image } from 'react-native';
import { apiService } from '../../../services/apiService';

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

export default function ProfileUserInfo() {
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      setError(null);

      // AsyncStorage'dan kullanıcı ID'sini al
      const userId = await AsyncStorage.getItem('id');

      if (!userId) {
        setError(t('userIdNotFound'));
        return;
      }

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
  };

  const fetchProfilePhoto = async (photoId: number, extension: string, fileName: string) => {
    try {
      setPhotoLoading(true);
      const photoArrayBuffer = await apiService.downloadPhotoById(photoId, extension, fileName);

      if (photoArrayBuffer) {
        // ArrayBuffer'ı base64'e çevir
        const base64String = arrayBufferToBase64(photoArrayBuffer);
        const mimeType = extension.replace('.', '');
        setProfilePhoto(`data:image/${mimeType};base64,${base64String}`);
      }
    } catch (error: any) {
      console.error('Error fetching profile photo:', error);
      // Fotoğraf yüklenemezse sessizce devam et, hata gösterme
    } finally {
      setPhotoLoading(false);
    }
  };

  // ArrayBuffer'ı base64'e çeviren yardımcı fonksiyon
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
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
        <View width={80} height={80} borderRadius={40} backgroundColor="$gray5" alignItems="center" justifyContent="center" overflow="hidden">
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
            <Text fontSize="$6" fontWeight="600" color="$gray10">
              {userInfo.isim.charAt(0)}
              {userInfo.soyAd.charAt(0)}
            </Text>
          )}
        </View>

        {/* Kullanıcı Bilgileri */}
        <YStack space="$3" alignItems="center">
          <YStack space="$2" alignItems="center">
            {/* <Text fontSize="$3" color="$gray10" fontWeight="500">
              {t('name')}
            </Text> */}
            <Text fontSize="$6" fontWeight="600" textAlign="center">
              {userInfo.isim} {userInfo.soyAd}
            </Text>
          </YStack>

          <YStack space="$2" alignItems="center">
            {/*  <Text fontSize="$3" color="$gray10" fontWeight="500">
              {t('email')}
            </Text> */}
            <Text fontSize="$5" color="$blue10" textAlign="center">
              {userInfo.email}
            </Text>
          </YStack>
        </YStack>
      </YStack>
    </View>
  );
}
