import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Text } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import React, { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { changeLanguage } from '../../../config/i18n';
import { useThemeController } from '../../../config/theme';

interface Language {
  code: string;
  name: string;
  nativeName: string;
}

const languages: Language[] = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'az', name: 'Azerbaijani', nativeName: 'Azərbaycan' },
];

export default function LanguageSelector() {
  const { t, i18n } = useTranslation();
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { themeName } = useThemeController();

  // Bottom sheet snap points
  const snapPoints = useMemo(() => [440], []);

  // Open bottom sheet
  const handleOpenBottomSheet = useCallback(() => {
    bottomSheetRef.current?.present();
  }, []);

  // Close bottom sheet
  const handleCloseBottomSheet = useCallback(() => {
    bottomSheetRef.current?.dismiss();
  }, []);

  // Handle language change
  const handleLanguageChange = useCallback(
    (languageCode: string) => {
      changeLanguage(languageCode);
      handleCloseBottomSheet();
    },
    [handleCloseBottomSheet]
  );

  // Backdrop component for darkening background
  const renderBackdrop = useCallback((props: any) => <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} pressBehavior="close" />, []);

  // Get current language info
  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];

  // Get flag SVG content (using actual SVG content from files)
  const getFlagSvg = (langCode: string) => {
    switch (langCode) {
      case 'tr':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="21" viewBox="0 -30000 90000 60000"><path fill="#e30a17" d="m0-30000h90000v60000H0z"/><path fill="#fff" d="m41750 0 13568-4408-8386 11541V-7133l8386 11541zm925 8021a15000 15000 0 1 1 0-16042 12000 12000 0 1 0 0 16042z"/></svg>';
      case 'en':
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" width="32" height="16"><clipPath id="s"><path d="M0,0 v30 h60 v-30 z"/></clipPath><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath><g clip-path="url(#s)"><path d="M0,0 v30 h60 v-30 z" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#C8102E" stroke-width="4"/><path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" stroke-width="6"/></g></svg>';
      case 'ru':
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" width="32" height="21"><rect fill="#fff" width="9" height="3"/><rect fill="#d52b1e" y="3" width="9" height="3"/><rect fill="#0039a6" y="2" width="9" height="2"/></svg>';
      case 'az':
        return '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 1200 600"><rect width="1200" height="600" fill="#509e2f"/><rect width="1200" height="400" fill="#ef3340"/><rect width="1200" height="200" fill="#00b5e2"/><circle cx="570" cy="300" r="90" fill="#fff"/><circle cx="590" cy="300" r="75" fill="#ef3340"/><path d="M670 250l9.567 26.903 25.788-12.258-12.258 25.788L720 300l-26.903 9.567 12.258 25.788-25.788-12.258L670 350l-9.567-26.903-25.788 12.258 12.258-25.788L620 300l26.903-9.567-12.258-25.788 25.788 12.258z" fill="#fff"/></svg>';
      default:
        return '<svg width="32" height="21"><rect width="32" height="21" fill="#ccc"/></svg>';
    }
  };

  return (
    <>
      {/* Language Selector Button */}
      <TouchableOpacity onPress={handleOpenBottomSheet}>
        <XStack alignItems="center" space="$2" padding="$3" borderRadius="$4" borderWidth={1} borderColor="$borderColor" backgroundColor="$background">
          <SvgXml xml={getFlagSvg(currentLanguage.code)} width={24} height={16} />
          <Text fontSize="$4" numberOfLines={1} flexShrink={1} color="$color">
            {currentLanguage.nativeName}
          </Text>
          <Text fontSize="$3" color="$color" opacity={0.7}>
            ▼
          </Text>
        </XStack>
      </TouchableOpacity>

      {/* Bottom Sheet */}
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: themeName === 'dark' ? '#1C1C1E' : '#FFFFFF',
        }}
      >
        <BottomSheetView style={{ flex: 1, padding: 20 }}>
          <YStack space="$3">
            <Text fontSize={17} fontWeight="600" textAlign="center" marginBottom="$4" color="$color">
              {t('language')}
            </Text>

            {languages.map((language) => (
              <TouchableOpacity key={language.code} onPress={() => handleLanguageChange(language.code)}>
                <XStack
                  alignItems="center"
                  space="$3"
                  padding="$4"
                  borderRadius="$3"
                  backgroundColor={i18n.language === language.code ? '$blue2' : 'transparent'}
                  borderWidth={i18n.language === language.code ? 1 : 0}
                  borderColor={i18n.language === language.code ? '$blue10' : 'transparent'}
                >
                  <SvgXml xml={getFlagSvg(language.code)} width={32} height={21} />
                  <YStack flex={1}>
                    <Text fontSize={15} fontWeight="500" color="$color">
                      {language.nativeName}
                    </Text>
                    <Text fontSize={13} color="$color" opacity={0.7}>
                      {language.name}
                    </Text>
                  </YStack>
                  {i18n.language === language.code && (
                    <Text fontSize="$4" color="$blue10">
                      ✓
                    </Text>
                  )}
                </XStack>
              </TouchableOpacity>
            ))}
          </YStack>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
}
