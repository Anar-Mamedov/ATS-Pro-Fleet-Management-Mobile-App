import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Telefon kameraları 3-12 MB'lık fotoğraflar üretiyor. Bu boyutta dosyalar mobil ağda
// yarıda kesilme ve sunucuda eksik kaydedilme riskini artırıyor; bu yüzden her fotoğraf
// yüklenmeden önce uzun kenarı en fazla 1920 px olacak şekilde küçültülüp JPEG'e çevriliyor.
const MAX_PHOTO_DIMENSION = 1920;
const PHOTO_COMPRESS_QUALITY = 0.8;

export type PreparedPhoto = {
  uri: string;
  name: string;
  type: string;
};

export const preparePhotoForUpload = async (uri: string): Promise<PreparedPhoto> => {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  let output = original;

  try {
    if (Math.max(original.width, original.height) > MAX_PHOTO_DIMENSION) {
      const size = original.width >= original.height ? { width: MAX_PHOTO_DIMENSION } : { height: MAX_PHOTO_DIMENSION };
      output = await ImageManipulator.manipulate(original).resize(size).renderAsync();
    }

    const saved = await output.saveAsync({ compress: PHOTO_COMPRESS_QUALITY, format: SaveFormat.JPEG });
    return {
      uri: saved.uri,
      name: saved.uri.split('/').pop() || `photo_${Date.now()}.jpg`,
      type: 'image/jpeg',
    };
  } finally {
    // Büyük bitmap'leri GC'yi beklemeden bellekten bırak
    if (output !== original) {
      output.release();
    }
    original.release();
  }
};
