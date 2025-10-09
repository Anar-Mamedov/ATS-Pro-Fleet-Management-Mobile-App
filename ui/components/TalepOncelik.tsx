import React, { useState, useEffect } from 'react';
import { Controller, Control } from 'react-hook-form';
import { XStack, YStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { Check, ChevronDown } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useThemeController } from '@/config/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TalepOncelikProps {
  control: Control<any>;
  name: string;
  rules?: any;
  placeholder?: string;
}

const TalepOncelik: React.FC<TalepOncelikProps> = ({ control, name, rules, placeholder }) => {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const isDarkMode = themeName === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const slideAnim = React.useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [modalVisible, slideAnim]);

  const priorityOptions = React.useMemo(
    () => [
      { value: 'dusuk', label: t('priorityLow') },
      { value: 'orta', label: t('priorityMedium') },
      { value: 'yuksek', label: t('priorityHigh') },
      { value: 'acil', label: t('priorityUrgent') },
    ],
    [t]
  );

  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value } }) => {
        const selectedOption = priorityOptions.find((opt) => opt.value === value);

        return (
          <>
            {/* Trigger Button */}
            <TouchableOpacity
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <XStack
                alignItems="center"
                justifyContent="space-between"
                paddingHorizontal="$3"
                paddingVertical="$3"
                borderRadius="$4"
                borderWidth={1}
                borderColor={isDarkMode ? '#333' : '#ddd'}
                backgroundColor={isDarkMode ? '#1a1a1a' : '#f5f5f5'}
                minHeight={48}
              >
                <Text fontSize="$4" color={value ? (isDarkMode ? '#fff' : '#000') : '#999'}>
                  {selectedOption ? selectedOption.label : placeholder || t('selectPriority')}
                </Text>
                <ChevronDown size={16} color={isDarkMode ? '#fff' : '#000'} />
              </XStack>
            </TouchableOpacity>

            {/* Modal */}
            <Modal
              visible={modalVisible}
              transparent={true}
              animationType="none"
              onRequestClose={() => setModalVisible(false)}
            >
              <Pressable
                style={styles.modalOverlay}
                onPress={() => setModalVisible(false)}
              >
                <Animated.View
                  style={[
                    styles.safeArea,
                    {
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >
                  <Pressable
                    style={[
                      styles.modalContent,
                      {
                        backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
                        paddingBottom: insets.bottom + 20,
                      },
                    ]}
                    onPress={(e) => e.stopPropagation()}
                  >
                    {/* Handle */}
                    <YStack alignItems="center" paddingVertical="$2">
                      <YStack
                        width={40}
                        height={4}
                        borderRadius="$2"
                        backgroundColor={isDarkMode ? '#444' : '#ccc'}
                      />
                    </YStack>

                    {/* Title */}
                    <Text
                      fontSize="$6"
                      fontWeight="bold"
                      textAlign="center"
                      marginBottom="$3"
                      color={isDarkMode ? '#fff' : '#000'}
                    >
                      {t('priorityList')}
                    </Text>

                    {/* Options */}
                    <ScrollView style={styles.scrollView}>
                      <YStack gap="$2" paddingVertical="$2">
                        {priorityOptions.map((option) => {
                          const isSelected = value === option.value;
                          return (
                            <TouchableOpacity
                              key={option.value}
                              onPress={() => {
                                onChange(option.value);
                                setModalVisible(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <XStack
                                backgroundColor={isSelected ? '$blue2' : 'transparent'}
                                borderWidth={isSelected ? 1 : 0}
                                borderColor={isSelected ? '$blue10' : 'transparent'}
                                borderRadius="$3"
                                paddingHorizontal="$4"
                                paddingVertical="$3"
                                alignItems="center"
                                justifyContent="space-between"
                              >
                                <Text fontSize="$5" color={isDarkMode ? '#fff' : '#000'}>
                                  {option.label}
                                </Text>
                                {isSelected && <Check size={16} color="$blue10" />}
                              </XStack>
                            </TouchableOpacity>
                          );
                        })}
                      </YStack>
                    </ScrollView>
                  </Pressable>
                </Animated.View>
              </Pressable>
            </Modal>
          </>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  safeArea: {
    width: '100%',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: 400,
  },
  scrollView: {
    maxHeight: 300,
  },
});

export default TalepOncelik;
