import { useThemeController } from '@/config/theme';
import { apiService } from '@/services/apiService';
import { MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Button } from '@tamagui/button';
import { Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

interface Document {
  tbDosyaId: number;
  dosyaAd: string;
  dosyaUzanti: string;
}

interface DocumentUploadProps {
  refId: number;
  refGroup: string;
  editable?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ refId, refGroup, editable = true }) => {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const isDarkMode = themeName === 'dark';

  // Fetch documents from API
  const fetchDocuments = useCallback(async () => {
    if (!refId) return;

    try {
      setLoading(true);
      const data = await apiService.getDocumentsByRefGroup(refId, refGroup);
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      Alert.alert(t('error'), t('documentsLoadError') || 'Dokümanlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [refId, refGroup, t]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Pick and upload document
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        return;
      }

      console.log('Selected document:', {
        uri: file.uri,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
      });

      setUploading(true);

      // Create FormData for upload
      const formData = new FormData();

      // Android'de content:// URI'lerini düzgün handle et
      const fileToUpload: any = {
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      };

      console.log('File to upload:', fileToUpload);

      formData.append('documents', fileToUpload);

      await apiService.uploadDocument(formData, refId, refGroup);
      Alert.alert(t('success'), t('documentUploadSuccess') || 'Doküman başarıyla yüklendi');
      fetchDocuments();
    } catch (error: any) {
      console.error('Error uploading document:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      Alert.alert(t('error'), error.message || t('documentUploadError') || 'Doküman yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  // Download document
  const handleDownloadDocument = async (doc: Document) => {
    try {
      setLoading(true);
      const arrayBuffer = await apiService.downloadDocumentById(doc.tbDosyaId, doc.dosyaUzanti, doc.dosyaAd);

      // Convert ArrayBuffer to base64
      const binary = Array.from(new Uint8Array(arrayBuffer))
        .map((byte) => String.fromCharCode(byte))
        .join('');
      const base64 = btoa(binary);

      const fileName = getFileNameWithExtension(doc);
      const mimeType = getMimeType(doc.dosyaUzanti);

      if (Platform.OS === 'android') {
        const savedToDownloads = await saveDocumentToDownloads(fileName, mimeType, base64);
        if (savedToDownloads) {
          Alert.alert(t('success'), t('documentDownloaded') || 'Doküman indirildi');
          return;
        }
      }

      const fileUri = await saveToAppDirectory(fileName, base64);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: fileName,
          UTI: doc.dosyaUzanti,
        });
      } else {
        Alert.alert(t('success'), t('documentDownloaded') || 'Doküman indirildi');
      }
    } catch (error: any) {
      console.error('Error downloading document:', error);
      Alert.alert(t('error'), t('documentDownloadError') || 'Doküman indirilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Delete document
  const handleDeleteDocument = (doc: Document) => {
    Alert.alert(
      t('deleteDocument') || 'Dokümanı Sil',
      t('deleteDocumentConfirm') || 'Bu dokümanı silmek istediğinizden emin misiniz?',
      [
        {
          text: t('cancel') || 'İptal',
          style: 'cancel',
        },
        {
          text: t('delete') || 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await apiService.deleteDocumentById(doc.tbDosyaId);
              Alert.alert(t('success'), t('documentDeleted') || 'Doküman silindi');
              fetchDocuments();
            } catch (error: any) {
              console.error('Error deleting document:', error);
              Alert.alert(t('error'), t('documentDeleteError') || 'Doküman silinirken hata oluştu');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get MIME type from extension
  const getMimeType = (extension: string): string => {
    const ext = extension.toLowerCase().replace('.', '');
    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  };

  const normalizeExtension = (extension: string) => {
    if (!extension) return '';
    return extension.startsWith('.') ? extension : `.${extension}`;
  };

  const sanitizeFileName = (fileName: string) => fileName.replace(/[\\/:*?"<>|]/g, '_').trim();

  const getFileNameWithExtension = (doc: Document) => {
    const extension = normalizeExtension(doc.dosyaUzanti);
    const rawName = doc.dosyaAd || `document-${doc.tbDosyaId}`;
    const sanitizedName = sanitizeFileName(rawName);
    const safeName = sanitizedName.length > 0 ? sanitizedName : `document-${doc.tbDosyaId}`;
    const hasExtension = /\.[^./\\]+$/.test(safeName);
    if (!extension || hasExtension) {
      return safeName;
    }
    return `${safeName}${extension}`;
  };

  const saveToAppDirectory = async (fileName: string, base64: string) => {
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return fileUri;
  };

  const saveDocumentToDownloads = async (fileName: string, mimeType: string, base64: string) => {
    try {
      const { StorageAccessFramework } = FileSystem;
      const downloadDirUri = StorageAccessFramework.getUriForDirectoryInRoot('Download');
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(downloadDirUri);
      if (!permissions.granted) {
        return false;
      }
      const downloadUri = await StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, mimeType);
      await StorageAccessFramework.writeAsStringAsync(downloadUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return true;
    } catch (error) {
      console.error('Error saving document to downloads:', error);
      return false;
    }
  };

  return (
    <YStack flex={1} padding="$4" gap="$3">
      <Text fontSize="$6" fontWeight="600" textAlign="center" marginBottom="$2" color="$color">
        {t('aracBelgeleri')}
      </Text>

      {loading && !uploading ? (
        <YStack alignItems="center" justifyContent="center" padding="$4">
          <ActivityIndicator size="large" color={isDarkMode ? '#fff' : '#000'} />
        </YStack>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {documents.length > 0 ? (
            <YStack gap="$2">
              {documents.map((doc) => (
                <Pressable
                  key={doc.tbDosyaId}
                  onPress={() => handleDownloadDocument(doc)}
                  style={[
                    styles.documentItem,
                    {
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                      borderColor: isDarkMode ? '#333' : '#ddd',
                    },
                  ]}
                >
                  <XStack alignItems="center" justifyContent="space-between" flex={1}>
                    <XStack alignItems="center" gap="$3" flex={1}>
                      <MaterialIcons name="insert-drive-file" size={24} color={isDarkMode ? '#fff' : '#666'} />
                      <Text fontSize="$4" color="$color" numberOfLines={1} flex={1}>
                        {doc.dosyaAd}
                      </Text>
                    </XStack>
                    {editable && (
                      <Pressable
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc);
                        }}
                        style={styles.deleteButton}
                      >
                        <MaterialIcons name="delete" size={20} color="#ef4444" />
                      </Pressable>
                    )}
                  </XStack>
                </Pressable>
              ))}
            </YStack>
          ) : (
            <YStack alignItems="center" padding="$4">
              <Text color="$color" opacity={0.7}>
                {t('noDocuments') || 'Henüz doküman yüklenmemiş'}
              </Text>
            </YStack>
          )}
        </ScrollView>
      )}

      {editable && (
        <Button
          onPress={handlePickDocument}
          disabled={uploading || loading}
          backgroundColor="$blue10"
          color="white"
          fontWeight="600"
          height={50}
          borderRadius="$2"
          icon={uploading ? undefined : <MaterialIcons name="upload-file" size={20} color="white" />}
        >
          {uploading ? t('uploading') : t('selectDocument') || 'Doküman Seç'}
        </Button>
      )}
    </YStack>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  documentItem: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  deleteButton: {
    padding: 8,
  },
});

export default DocumentUpload;
