Seçenek 1 — Xcode ile (genelde en stabil)

1. npx expo prebuild --platform ios
2. npx pod-install (veya cd ios && pod install)
3. ios/ATSPro.xcworkspace dosyasını Xcode ile aç
4. Target: ATSPro → Signing & Capabilities
   - Automatically manage signing açık
   - Team: kendi Apple Developer takımını seç
5. Product → Archive (Release)
6. Distribute App → App Store Connect (veya IPA export)

Seçenek 2 — EAS local build

eas build -p ios --profile production --local

- Xcode, CocoaPods vb. yüklü olmalı.
- Lokal imzalama/sertifika ayarlarını yine isteme ihtimali var.

Hızlı çözüm için genelde Xcode archive öneririm. Hangisini tercih edersin? İstersen adım adım birlikte ilerleyelim.
