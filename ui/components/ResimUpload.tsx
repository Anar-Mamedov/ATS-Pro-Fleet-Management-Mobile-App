import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@tamagui/button';
import { Theme, View } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable } from 'react-native';
import { apiService } from '../../services/apiService';

type PhotoItem = {
  tbResimId: number;
  rsmUzanti: string;
  rsmAd: string;
};

type LoadedPhoto = PhotoItem & {
  uri: string;
};

export type ResimUploadProps = {
  refId: number | string;
  refGroup: string;
  isForDefault?: boolean;
  disabled?: boolean; // kapali
  onUploaded?: () => void;
  onDeleted?: () => void;
};

// Minimal base64 encoder for Uint8Array (no btoa / Buffer dependency)
function encodeBase64(bytes: Uint8Array): string {
  const base64abc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');
  let result = '';
  let i: number;
  const l = bytes.length - (bytes.length % 3);
  for (i = 0; i < l; i += 3) {
    result += base64abc[bytes[i] >> 2];
    result += base64abc[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    result += base64abc[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    result += base64abc[bytes[i + 2] & 63];
  }
  if (l < bytes.length) {
    const a = bytes[l];
    result += base64abc[a >> 2];
    if (l + 1 < bytes.length) {
      const b = bytes[l + 1];
      result += base64abc[((a & 3) << 4) | (b >> 4)];
      result += base64abc[(b & 15) << 2];
      result += '=';
    } else {
      result += base64abc[(a & 3) << 4];
      result += '==';
    }
  }
  return result;
}

function getMimeTypeFromExtension(ext: string): string {
  const lower = (ext || '').toLowerCase().replace(/^\./, '');
  switch (lower) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
    case 'heif':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

export default function ResimUpload({ refId, refGroup, isForDefault = false, disabled = false, onUploaded, onDeleted }: ResimUploadProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [items, setItems] = useState<LoadedPhoto[]>([]);
  const refreshKey = useRef(0);

  const fetchList = useCallback(async () => {
    if (!refId || !refGroup) return;
    try {
      setLoading(true);
      const list: PhotoItem[] = await apiService.getPhotosByRefGroup(refId, refGroup);

      const loaded: LoadedPhoto[] = [];
      for (const it of list) {
        try {
          const data: ArrayBuffer = await apiService.downloadPhotoById(it.tbResimId, it.rsmUzanti, it.rsmAd);
          const base64 = encodeBase64(new Uint8Array(data));
          const mime = getMimeTypeFromExtension(it.rsmUzanti);
          loaded.push({ ...it, uri: `data:${mime};base64,${base64}` });
        } catch {
          // Skip failed item but continue others
        }
      }
      setItems(loaded);
    } catch {
      Alert.alert('Hata', 'Resimler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [refId, refGroup]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const refresh = useCallback(() => {
    refreshKey.current += 1;
    fetchList();
  }, [fetchList]);

  const uploadAsset = useCallback(
    async (uri: string, fileName: string) => {
      try {
        setLoading(true);
        const form = new FormData();
        const ext = (fileName.split('.').pop() || 'jpg').toLowerCase();
        const type = getMimeTypeFromExtension(ext);
        const fileDetails = { uri, name: fileName, type } as any;
        form.append('images', fileDetails as any);
        await apiService.uploadPhoto(form, Number(refId), refGroup, isForDefault);
      } catch {
        Alert.alert('Hata', 'Yükleme sırasında bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    },
    [refId, refGroup, isForDefault]
  );

  const pickFromLibrary = useCallback(async () => {
    if (disabled) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni verilmedi.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.9,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (result.canceled) return;

    // Upload each selected asset separately (backend expects field name `images`)
    for (const asset of result.assets) {
      await uploadAsset(asset.uri, asset.fileName || 'photo.jpg');
    }
    refresh();
    onUploaded?.();
  }, [disabled, uploadAsset, refresh, onUploaded]);

  const takePhoto = useCallback(async () => {
    if (disabled) return;
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('İzin Gerekli', 'Kameraya erişim izni verilmedi.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.9 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await uploadAsset(asset.uri, asset.fileName || 'photo.jpg');
    refresh();
    onUploaded?.();
  }, [disabled, uploadAsset, refresh, onUploaded]);

  // Tek butonlu yükleme akışı (UploadPhoto.tsx ile aynı davranış)
  const showImageOptions = useCallback(() => {
    if (disabled) return;
    Alert.alert('Resim Seç', 'Resim kaynağını seçin', [
      {
        text: 'Kamera',
        onPress: () => {
          void takePhoto();
        },
      },
      {
        text: 'Galeri',
        onPress: () => {
          void pickFromLibrary();
        },
      },
      {
        text: 'İptal',
        style: 'cancel',
      },
    ]);
  }, [disabled, pickFromLibrary, takePhoto]);

  const handleDelete = useCallback(
    async (photoId: number) => {
      if (disabled) return;
      try {
        setDeletingId(photoId);
        const res = await apiService.deletePhotoById(photoId);
        if (res && res.success === false) {
          throw new Error(res.message || 'Silme işlemi başarısız oldu');
        }
        onDeleted?.();
        refresh();
      } catch (error: any) {
        Alert.alert('Hata', error?.message || 'Fotoğraf silinirken bir hata oluştu.');
      } finally {
        setDeletingId(null);
      }
    },
    [disabled, onDeleted, refresh]
  );

  const grid = useMemo(() => {
    if (loading) {
      return (
        <View alignItems="center" justifyContent="center" height={120}>
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <XStack flexWrap="wrap" gap="$3">
        {items.map((it) => (
          <View key={it.tbResimId} position="relative">
            <Image source={{ uri: it.uri }} style={{ width: 150, height: 150, borderRadius: 8 }} contentFit="cover" transition={200} />
            {!disabled && (
              <Pressable
                onPress={() =>
                  Alert.alert('Onay', 'Bu fotoğrafı silmek istiyor musunuz?', [
                    { text: 'Hayır', style: 'cancel' },
                    { text: 'Evet', style: 'destructive', onPress: () => handleDelete(it.tbResimId) },
                  ])
                }
                style={{ position: 'absolute', top: 6, right: 6 }}
              >
                <View backgroundColor="$backgroundStrong" opacity={0.85} padding="$2" borderRadius={999}>
                  {deletingId === it.tbResimId ? <ActivityIndicator size="small" /> : <MaterialIcons name="delete" size={18} color="#d00" />}
                </View>
              </Pressable>
            )}
          </View>
        ))}
      </XStack>
    );
  }, [items, loading, deletingId, disabled, handleDelete]);

  return (
    <Theme>
      <YStack gap="$3">
        <XStack gap="$2" justifyContent="center" alignItems="center">
          <Button
            size="$4"
            theme="blue"
            icon={<MaterialIcons name="cloud-upload" size={20} color="white" />}
            onPress={showImageOptions}
            disabled={disabled || loading}
            opacity={disabled || loading ? 0.6 : 1}
          >
            Fotoğraf Yükle
          </Button>
        </XStack>
        <View height={1} backgroundColor="$gray4" />
        {grid}
      </YStack>
    </Theme>
  );
}
