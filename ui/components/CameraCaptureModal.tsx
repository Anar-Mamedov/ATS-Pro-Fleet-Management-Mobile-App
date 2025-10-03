import { MaterialIcons } from '@expo/vector-icons';
import { CameraView, CameraType, FlashMode } from 'expo-camera';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type CameraCaptureModalProps = {
  visible: boolean;
  onClose: () => void;
  onCapture: (photo: Awaited<ReturnType<CameraView['takePictureAsync']>>) => Promise<void> | void;
  initialFacing?: CameraType;
  initialFlash?: FlashMode;
  captureQuality?: number;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  flashButton: {
    position: 'absolute',
    left: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 999,
    padding: 8,
  },
  controls: {
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
  controlButton: {
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
  disabledCaptureButton: {
    opacity: 0.6,
  },
});

export function CameraCaptureModal({
  visible,
  onClose,
  onCapture,
  initialFacing = 'back',
  initialFlash = 'off',
  captureQuality = 0.9,
}: CameraCaptureModalProps) {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<CameraType>(initialFacing);
  const [flashMode, setFlashMode] = useState<FlashMode>(initialFlash);
  const [isCapturing, setIsCapturing] = useState(false);

  const flashIcon = useMemo(() => {
    if (flashMode === 'on') return 'flash-on';
    if (flashMode === 'auto') return 'flash-auto';
    return 'flash-off';
  }, [flashMode]);

  const toggleFacing = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }, []);

  const toggleFlash = useCallback(() => {
    setFlashMode((current) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  }, []);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: captureQuality,
        base64: false,
        exif: false,
      });

      if (!photo?.uri) {
        throw new Error('Fotoğraf kaydedilemedi.');
      }

      await onCapture(photo);
      onClose();
    } catch (error: any) {
      const message = error?.message || 'Fotoğraf çekilirken bir hata oluştu.';
      Alert.alert('Kamera Hatası', message);
    } finally {
      setIsCapturing(false);
    }
  }, [captureQuality, isCapturing, onCapture, onClose]);

  const handleRequestClose = useCallback(() => {
    if (isCapturing) return;
    onClose();
  }, [isCapturing, onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleRequestClose}>
      <View style={styles.container}>
        <CameraView
          ref={(ref) => {
            cameraRef.current = ref;
          }}
          style={styles.camera}
          facing={facing}
          enableTorch={flashMode === 'on'}
        />

        <TouchableOpacity
          style={[styles.flashButton, { top: Math.max(12, insets.top + 12) }]}
          onPress={toggleFlash}
        >
          <MaterialIcons name={flashIcon as any} size={24} color={flashMode === 'off' ? '#fff' : '#FFD700'} />
        </TouchableOpacity>

        <View style={[styles.controls, { paddingBottom: 32 + Math.max(insets.bottom, 0) }]}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRequestClose} disabled={isCapturing}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.captureButton, isCapturing && styles.disabledCaptureButton]}
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <MaterialIcons name="camera-alt" size={32} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={toggleFacing} disabled={isCapturing}>
            <MaterialIcons name="flip-camera-ios" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
