import React from 'react';
import { Controller, Control } from 'react-hook-form';
import { Select } from '@tamagui/select';
import { Adapt } from '@tamagui/adapt';
import { Sheet } from '@tamagui/sheet';
import { YStack } from '@tamagui/stacks';
import { Text } from '@tamagui/core';
import { Check, ChevronDown } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

interface TalepOncelikProps {
  control: Control<any>;
  name: string;
  rules?: any;
  placeholder?: string;
}

const TalepOncelik: React.FC<TalepOncelikProps> = ({
  control,
  name,
  rules,
  placeholder,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const priorityOptions = [
    { value: 'dusuk', label: t('priorityLow') },
    { value: 'orta', label: t('priorityMedium') },
    { value: 'yuksek', label: t('priorityHigh') },
    { value: 'acil', label: t('priorityUrgent') },
  ];
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field: { onChange, value } }) => (
        <Select value={value} onValueChange={onChange} open={open} onOpenChange={setOpen}>
          <Select.Trigger width="100%" iconAfter={ChevronDown}>
            <Select.Value placeholder={placeholder || t('selectPriority')} />
          </Select.Trigger>

          <Adapt when="sm" platform="touch">
            <Sheet
              native
              modal
              dismissOnSnapToBottom
              snapPointsMode="percent"
              snapPoints={[40]}
              animationConfig={{
                type: 'spring',
                damping: 20,
                mass: 1.2,
                stiffness: 250,
              }}
            >
              <Sheet.Frame padding="$4">
                <Text fontSize="$6" fontWeight="bold" textAlign="center" marginBottom="$3">
                  {t('priorityList')}
                </Text>
                <Sheet.ScrollView>
                  <YStack gap="$2" paddingVertical="$2">
                    {priorityOptions.map((option) => {
                      const isSelected = value === option.value;
                      return (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            onChange(option.value);
                            setOpen(false);
                          }}
                        >
                          <YStack
                            backgroundColor={isSelected ? '$blue2' : '$background'}
                            borderWidth={isSelected ? 1 : 0}
                            borderColor={isSelected ? '$blue10' : 'transparent'}
                            borderRadius="$3"
                            paddingHorizontal="$4"
                            paddingVertical="$3"
                            flexDirection="row"
                            alignItems="center"
                            justifyContent="space-between"
                          >
                            <Text fontSize="$5">{option.label}</Text>
                            {isSelected && <Check size={16} color="$blue10" />}
                          </YStack>
                        </Pressable>
                      );
                    })}
                  </YStack>
                </Sheet.ScrollView>
              </Sheet.Frame>
              <Sheet.Overlay
                animation="lazy"
                enterStyle={{ opacity: 0 }}
                exitStyle={{ opacity: 0 }}
              />
            </Sheet>
          </Adapt>

          <Select.Content zIndex={200000}>
            <Select.ScrollUpButton
              alignItems="center"
              justifyContent="center"
              position="relative"
              width="100%"
              height="$3"
            >
              <YStack zIndex={10}>
                <ChevronDown size={20} />
              </YStack>
            </Select.ScrollUpButton>

            <Select.Viewport minWidth={200}>
              <Select.Group>
                {priorityOptions.map((option, index) => {
                  const isSelected = value === option.value;
                  return (
                    <Select.Item
                      key={option.value}
                      index={index}
                      value={option.value}
                      backgroundColor={isSelected ? '$blue2' : 'transparent'}
                      borderWidth={isSelected ? 1 : 0}
                      borderColor={isSelected ? '$blue10' : 'transparent'}
                      borderRadius="$3"
                      marginVertical="$1"
                      paddingHorizontal="$3"
                      paddingVertical="$3"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <Select.ItemIndicator marginLeft="auto">
                        <Check size={16} color="$blue10" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  );
                })}
              </Select.Group>
            </Select.Viewport>

            <Select.ScrollDownButton
              alignItems="center"
              justifyContent="center"
              position="relative"
              width="100%"
              height="$3"
            >
              <YStack zIndex={10}>
                <ChevronDown size={20} />
              </YStack>
            </Select.ScrollDownButton>
          </Select.Content>
        </Select>
      )}
    />
  );
};

export default TalepOncelik;
