import { MaterialIcons } from '@expo/vector-icons';
import { Button } from '@tamagui/button';
import { Theme, View } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
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

const SCREEN = Dimensions.get('window');
const GRID_ITEM_SIZE = Math.min(140, Math.max(90, Math.floor((SCREEN.width - 64) / 3)));
const GRID_SPACING = 12; // tamagui $3 approx.
const MAX_VISIBLE_ROWS = 3;
const MAX_GRID_HEIGHT = GRID_ITEM_SIZE * MAX_VISIBLE_ROWS + GRID_SPACING * (MAX_VISIBLE_ROWS - 1);

const viewerStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  imageContainer: {
    width: SCREEN.width,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: SCREEN.width,
    height: SCREEN.height,
    backgroundColor: 'black',
  },
  closeButton: {
    position: 'absolute',
    top: 48,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 8,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 32,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cameraButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 999,
    padding: 16,
  },
  captureButton: {
    backgroundColor: '#fff',
    borderRadius: 999,
    padding: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  cameraText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default function ResimUpload({ refId, refGroup, isForDefault = false, disabled = false, onUploaded, onDeleted }: ResimUploadProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [items, setItems] = useState<LoadedPhoto[]>([]);
  const [viewerVisible, setViewerVisible] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [multiSelectMode, setMultiSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState<boolean>(false);
  const [cameraVisible, setCameraVisible] = useState<boolean>(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const refreshKey = useRef(0);
  const viewerListRef = useRef<FlatList<LoadedPhoto> | null>(null);
  const cameraRef = useRef<CameraView>(null);

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
      setSelectedIds((current) => current.filter((id) => loaded.some((it) => it.tbResimId === id)));
    } catch {
      Alert.alert('Hata', 'Resimler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [refId, refGroup]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    if (!items.length) {
      setViewerVisible(false);
      setSelectedIndex(0);
      return;
    }
    if (selectedIndex > items.length - 1) {
      setSelectedIndex(items.length - 1);
    }
  }, [items.length, selectedIndex]);

  useEffect(() => {
    if (!viewerVisible || !items.length) return;
    const timer = setTimeout(() => {
      try {
        viewerListRef.current?.scrollToIndex({ index: selectedIndex, animated: false });
      } catch {
        // ignore scroll errors (e.g. stale index)
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [viewerVisible, selectedIndex, items.length]);

  const refresh = useCallback(() => {
    refreshKey.current += 1;
    fetchList();
  }, [fetchList]);

  const openViewer = useCallback(
    (index: number) => {
      if (!items.length || multiSelectMode || bulkDeleting) return;
      setSelectedIndex(index);
      setViewerVisible(true);
    },
    [items.length, multiSelectMode, bulkDeleting]
  );

  const closeViewer = useCallback(() => {
    setViewerVisible(false);
  }, []);

  const exitMultiSelect = useCallback(() => {
    setMultiSelectMode(false);
    setSelectedIds([]);
  }, []);

  const toggleMultiSelect = useCallback(() => {
    if (disabled || bulkDeleting) return;
    setMultiSelectMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedIds([]);
      }
      return next;
    });
  }, [disabled, bulkDeleting]);

  const handleSelectToggle = useCallback(
    (photoId: number) => {
      if (disabled || bulkDeleting) return;
      setSelectedIds((current) => {
        if (current.includes(photoId)) {
          return current.filter((id) => id !== photoId);
        }
        return [...current, photoId];
      });
    },
    [disabled, bulkDeleting]
  );

  const handleBulkDelete = useCallback(async () => {
    if (disabled || !selectedIds.length) return;
    let completed = false;
    try {
      setBulkDeleting(true);
      for (const photoId of selectedIds) {
        const res = await apiService.deletePhotoById(photoId);
        if (res && res.success === false) {
          throw new Error(res.message || 'Silme işlemi başarısız oldu');
        }
      }
      onDeleted?.();
      exitMultiSelect();
      refresh();
      completed = true;
    } catch (error: any) {
      Alert.alert('Hata', error?.message || 'Fotoğraflar silinirken bir hata oluştu.');
    } finally {
      if (!completed) {
        refresh();
      }
      setBulkDeleting(false);
    }
  }, [disabled, selectedIds, onDeleted, exitMultiSelect, refresh]);

  const confirmBulkDelete = useCallback(() => {
    if (!selectedIds.length || bulkDeleting) return;
    Alert.alert('Onay', 'Seçilen fotoğrafları silmek istiyor musunuz?', [
      { text: 'Hayır', style: 'cancel' },
      {
        text: 'Evet',
        style: 'destructive',
        onPress: () => {
          void handleBulkDelete();
        },
      },
    ]);
  }, [selectedIds, bulkDeleting, handleBulkDelete]);

  useEffect(() => {
    if (!multiSelectMode) return;
    if (disabled || items.length === 0) {
      exitMultiSelect();
    }
  }, [disabled, items.length, multiSelectMode, exitMultiSelect]);

  const renderViewerItem = useCallback(({ item }: { item: LoadedPhoto }) => {
    return (
      <View style={viewerStyles.imageContainer}>
        <Image source={{ uri: item.uri }} style={viewerStyles.image} contentFit="contain" transition={200} />
      </View>
    );
  }, []);

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
    if (disabled || bulkDeleting) return;

    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('İzin Gerekli', 'Galeriye erişim izni verilmedi. Lütfen ayarlardan izin verin.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.9,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        exif: false, // Expo SDK 54 için performans iyileştirmesi
      });

      if (result.canceled) return;

      // Upload each selected asset separately (backend expects field name `images`)
      for (const asset of result.assets) {
        await uploadAsset(asset.uri, asset.fileName || 'photo.jpg');
      }
      refresh();
      onUploaded?.();
    } catch (error) {
      console.error('Galeri erişim hatası:', error);
      Alert.alert('Hata', 'Galeriye erişim sırasında bir hata oluştu.');
    }
  }, [disabled, bulkDeleting, uploadAsset, refresh, onUploaded]);

  const openCamera = useCallback(async () => {
    if (disabled || bulkDeleting) return;

    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('İzin Gerekli', 'Kameraya erişim izni verilmedi. Lütfen ayarlardan izin verin.');
        return;
      }
    }

    setCameraVisible(true);
  }, [disabled, bulkDeleting, permission, requestPermission]);

  const takePhotoWithCamera = useCallback(async () => {
    if (!cameraRef.current) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
        exif: false,
      });

      await uploadAsset(photo.uri, 'photo.jpg');
      setCameraVisible(false);
      refresh();
      onUploaded?.();
    } catch (error) {
      console.error('Fotoğraf çekme hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekerken bir hata oluştu.');
    }
  }, [uploadAsset, refresh, onUploaded]);

  const toggleCameraFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const closeCamera = useCallback(() => {
    setCameraVisible(false);
  }, []);

  // Tek butonlu yükleme akışı (UploadPhoto.tsx ile aynı davranış)
  const showImageOptions = useCallback(() => {
    if (disabled || bulkDeleting) return;
    Alert.alert('Resim Seç', 'Resim kaynağını seçin', [
      {
        text: 'Kamera',
        onPress: () => {
          void openCamera();
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
  }, [disabled, bulkDeleting, pickFromLibrary, openCamera]);

  const grid = useMemo(() => {
    if (loading) {
      return (
        <View alignItems="center" justifyContent="center" height={120}>
          <ActivityIndicator />
        </View>
      );
    }

    const estimatedPerRow = Math.max(1, Math.floor((SCREEN.width + GRID_SPACING) / (GRID_ITEM_SIZE + GRID_SPACING)));
    const shouldScroll = items.length > estimatedPerRow * MAX_VISIBLE_ROWS;

    return (
      <ScrollView
        style={{ maxHeight: MAX_GRID_HEIGHT }}
        contentContainerStyle={{ paddingBottom: GRID_SPACING / 2 }}
        nestedScrollEnabled
        scrollEnabled={shouldScroll}
        showsVerticalScrollIndicator={shouldScroll}
      >
        <XStack flexWrap="wrap" gap="$3" justifyContent="flex-start">
          {items.map((it, index) => {
            const isSelected = selectedIds.includes(it.tbResimId);
            return (
              <View key={it.tbResimId} position="relative" marginBottom="$3">
                <Pressable
                  onPress={() => {
                    if (multiSelectMode) {
                      handleSelectToggle(it.tbResimId);
                    } else {
                      openViewer(index);
                    }
                  }}
                  onLongPress={() => {
                    if (disabled || bulkDeleting) return;
                    if (!multiSelectMode) {
                      toggleMultiSelect();
                    }
                    handleSelectToggle(it.tbResimId);
                  }}
                  delayLongPress={200}
                  disabled={bulkDeleting}
                  style={{
                    width: GRID_ITEM_SIZE,
                    height: GRID_ITEM_SIZE,
                    borderRadius: 8,
                    overflow: 'hidden',
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? '#1b74e4' : 'transparent',
                  }}
                >
                  <Image source={{ uri: it.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} />
                  {multiSelectMode && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: isSelected ? 'rgba(27,116,228,0.2)' : 'rgba(0,0,0,0.15)',
                      }}
                    />
                  )}
                  {multiSelectMode && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderRadius: 999,
                        padding: 4,
                      }}
                    >
                      <MaterialIcons name={isSelected ? 'check-circle' : 'radio-button-unchecked'} size={20} color={isSelected ? '#4caf50' : '#fff'} />
                    </View>
                  )}
                  {isSelected && bulkDeleting && (
                    <View
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <ActivityIndicator color="#fff" />
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </XStack>
      </ScrollView>
    );
  }, [items, loading, disabled, openViewer, multiSelectMode, selectedIds, handleSelectToggle, toggleMultiSelect, bulkDeleting]);

  return (
    <Theme>
      <YStack gap="$3">
        <XStack gap="$2" justifyContent="center" alignItems="center" flexWrap="wrap">
          <Button
            size="$4"
            theme="blue"
            icon={<MaterialIcons name="cloud-upload" size={20} color="white" />}
            onPress={showImageOptions}
            disabled={disabled || loading || bulkDeleting}
            opacity={disabled || loading || bulkDeleting ? 0.6 : 1}
          >
            Fotoğraf Yükle
          </Button>
          <Button
            size="$3"
            theme={multiSelectMode ? 'green' : 'gray'}
            icon={<MaterialIcons name="edit" size={18} color="white" />}
            onPress={toggleMultiSelect}
            disabled={disabled || bulkDeleting || (!multiSelectMode && items.length === 0)}
            opacity={disabled || bulkDeleting || (!multiSelectMode && items.length === 0) ? 0.6 : 1}
            accessibilityLabel={multiSelectMode ? 'Seçim modunu kapat' : 'Seçim modunu aç'}
          />
          {multiSelectMode && (
            <Button
              size="$4"
              theme="red"
              icon={<MaterialIcons name="delete-forever" size={20} color="white" />}
              onPress={confirmBulkDelete}
              disabled={bulkDeleting || !selectedIds.length}
              opacity={bulkDeleting || !selectedIds.length ? 0.6 : 1}
            >
              {selectedIds.length > 0 ? `Seçilenleri Sil (${selectedIds.length})` : 'Seçilenleri Sil'}
            </Button>
          )}
        </XStack>
        <View height={1} backgroundColor="$gray4" />
        {grid}
      </YStack>
      <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={closeViewer}>
        <View style={viewerStyles.backdrop}>
          {items.length > 0 && (
            <FlatList
              ref={(ref) => {
                viewerListRef.current = ref;
              }}
              data={items}
              renderItem={renderViewerItem}
              keyExtractor={(item) => item.tbResimId.toString()}
              horizontal
              pagingEnabled
              style={{ flex: 1 }}
              initialScrollIndex={selectedIndex}
              getItemLayout={(_, index) => ({ length: SCREEN.width, offset: SCREEN.width * index, index })}
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN.width);
                if (!Number.isNaN(newIndex)) {
                  const boundedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
                  setSelectedIndex(boundedIndex);
                }
              }}
            />
          )}
          <Pressable onPress={closeViewer} style={viewerStyles.closeButton} hitSlop={12}>
            <MaterialIcons name="close" size={28} color="#fff" />
          </Pressable>
        </View>
      </Modal>

      <Modal visible={cameraVisible} animationType="slide" onRequestClose={closeCamera}>
        <View style={viewerStyles.cameraContainer}>
          <CameraView ref={cameraRef} style={viewerStyles.camera} facing={facing} />

          <View style={viewerStyles.cameraControls}>
            <TouchableOpacity style={viewerStyles.cameraButton} onPress={closeCamera}>
              <MaterialIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={viewerStyles.captureButton} onPress={takePhotoWithCamera}>
              <MaterialIcons name="camera-alt" size={32} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity style={viewerStyles.cameraButton} onPress={toggleCameraFacing}>
              <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Theme>
  );
}
