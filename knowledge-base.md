# Knowledge Base - Hata Çözümleri

## API servislerini gereksiz bulup silme hatası

Solution: API isteklerini component içinde yazmak yerine service katmanında yazmak daha doğru bir yaklaşımdır. Service katmanı:

- Kodu daha organize eder
- Tekrar kullanılabilirlik sağlar
- Component'leri temiz tutar
- API logic'ini merkezi bir yerde toplar
- Test edilebilirlik arttırır

API servisleri her zaman ayrı dosyalarda tutulmalıdır.

## Storage helper'larını yanlış dosyaya koyma hatası

Solution: AsyncStorage helper fonksiyonları http.ts dosyasına ait değildir. Bu fonksiyonlar:

- Ayrı bir utils/storage.ts dosyasında olmalı
- Veya doğrudan component içinde kullanılmalı
- HTTP konfigürasyon dosyası sadece axios instance ve interceptor'lar içermeli
- Her dosya kendi sorumluluğu olan işleri yapmalı (Single Responsibility Principle)

## Gereksiz storage utility dosyası oluşturma hatası

Solution: AsyncStorage işlemleri için ayrı utility dosyası oluşturmak gereksiz karmaşıklık yaratır:

- AsyncStorage işlemleri doğrudan component içinde yapılmalı
- Basit işlemler için ayrı dosya oluşturmak over-engineering'dir
- Component'in kendi ihtiyacı olan storage işlemlerini kendi içinde yapması daha basit ve anlaşılır
- Sadece gerçekten paylaşılması gereken karmaşık logic'ler için ayrı dosya oluşturulmalı

## Hermes Engine Debug Sorunları

### "No compatible apps connected. JavaScript Debugging can only be used with the Hermes engine" Hatası

**Neden Oluşur:**

- Expo'nun yeni sürümlerinde Hermes JavaScript engine kullanması
- Debug ayarlarındaki uyumsuzluk
- app.json'da jsEngine ayarının eksik olması

**Çözümler:**

1. **app.json'da Hermes'i açık olarak belirtin:**

```json
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

2. **Doğru Debug Araçlarını Kullanın:**

   - Expo Dev Tools'da "Debug Remote JS" yerine "Open DevTools" kullanın
   - Metro bundler'da "j" tuşuna basarak debugger'ı açın
   - React Native Debugger yerine Chrome DevTools kullanın
   - `npx expo start` sonrasında "j" tuşu ile Chrome/Edge debugger açın

3. **Alternatif Debug Yöntemleri:**

   - Console.log'ları Metro bundler terminalinde görüntüleyin
   - Chrome DevTools'u manuel olarak açın
   - Flipper kullanarak debug yapın

4. **Troubleshooting Adımları:**
   - Debug build kullandığınızdan emin olun (eas build, npx expo run:android/ios)
   - WebSocket bağlantısının kurulduğunu kontrol edin
   - Metro terminalde "r" tuşu ile uygulamayı reload edin
   - `curl http://127.0.0.1:8081/json/list` komutu ile debug availability test edin
   - Gerekirse `--localhost` veya `--tunnel` flag'leri ile expo start çalıştırın

**Not:** Bu hata uygulamanın çalışmasını etkilemez, sadece debug aracı seçimi ile ilgilidir.

## Tamagui Button'ların Silik Gözükmesi

Solution: Tamagui Button bileşenlerinde `opacity` özelliği ve `theme` ayarları düğmeleri silik gösterebilir.

- `opacity={loading ? 0.7 : 1}` özelliğini kaldırın
- `theme="blue"` veya `theme="green"` yerine doğrudan `backgroundColor` kullanın
- `backgroundColor="#007AFF"` (mavi) ve `backgroundColor="#34C759"` (yeşil) gibi net renkler kullanın
- `disabled={loading}` özelliği zaten loading durumunda düğmeyi devre dışı bırakır
- Gereksiz opacity ve tema manipülasyonu yapmayın

## React Native Localization (i18n) Implementasyonu

Solution: React Native uygulamasında i18next kullanarak çoklu dil desteği ekleme:

**Gerekli Paketler:**

```bash
npm install i18next react-i18next expo-localization @react-native-async-storage/async-storage
```

**Dosya Yapısı:**

```
locales/
  en/translation.json
  tr/translation.json
  ru/translation.json
  az/translation.json
config/i18n.ts
```

**i18n Konfigürasyonu (config/i18n.ts):**

- AsyncStorage'dan dil ayarını kontrol et
- Yoksa cihaz dilini tespit et (expo-localization)
- Desteklenen diller: tr, en, ru, az
- Desteklenmeyen diller için fallback: en
- changeLanguage fonksiyonu ile dil değiştirme

**Kullanım:**

- App layout'ında import: `import '../config/i18n';`
- Component'lerde: `const { t, i18n } = useTranslation();`
- Çeviri: `{t('keyName')}`
- Dil değiştirme: `changeLanguage('tr')`

**Önemli Notlar:**

- Dil değişikliği AsyncStorage'da saklanır
- Uygulama yeniden başlatıldığında son seçilen dil kullanılır
- Tab navigation'da da çeviriler otomatik güncellenir
