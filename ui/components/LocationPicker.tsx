import React, { useState, useEffect, useCallback } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { Modal, Pressable, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { Button } from '@tamagui/button';
import { Text, View } from '@tamagui/core';
import { XStack, YStack } from '@tamagui/stacks';
import { Search, ChevronRight, ChevronDown, X } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/apiService';
import { useThemeController } from '@/config/theme';

interface LocationData {
  locationId: number;
  location: string;
  fullLocationPath: string;
  hasChild: boolean;
  children?: LocationData[];
  expanded?: boolean;
  level?: number;
  key?: string;
}

export interface LocationPickerProps<T extends FieldValues> {
  /** React Hook Form control object */
  control: Control<T>;
  /** Field name from the form */
  name: Path<T>;
  /** Label text */
  label?: string;
  /** Placeholder text when no location is selected */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Multi-select mode */
  multiSelect?: boolean;
  /** Callback when location is selected */
  onSubmit?: (data: LocationData | LocationData[] | null) => void;
  /** Selected location ID(s) */
  selectedId?: number | number[];
}

export function LocationPicker<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  error,
  required = false,
  multiSelect = false,
  onSubmit,
  selectedId,
}: LocationPickerProps<T>) {
  const { t } = useTranslation();
  const { themeName } = useThemeController();
  const isDarkMode = themeName === 'dark';
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [treeData, setTreeData] = useState<LocationData[]>([]);
  const [flatData, setFlatData] = useState<LocationData[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
  };

  // Format API data
  const formatDataForTable = useCallback((data: any[]): LocationData[] => {
    return data.map((item) => ({
      locationId: item.locationId,
      location: item.location,
      fullLocationPath: item.fullLocationPath,
      hasChild: item.hasChild,
      children: item.hasChild ? [] : undefined,
      expanded: false,
      level: 0,
    }));
  }, []);

  // Fetch data from API
  const fetchData = useCallback(
    async (parameter = '') => {
      setLoading(true);
      try {
        const data = await apiService.getChildLocationListByParentId(0, parameter);
        const tree = formatDataForTable(data);
        setTreeData(tree);
        setFlatData(tree);
      } catch (error) {
        console.error('API Error:', error);
      } finally {
        setLoading(false);
      }
    },
    [formatDataForTable]
  );

  // Search handler
  const handleSearch = () => {
    fetchData(searchTerm);
  };

  // Initialize modal
  useEffect(() => {
    if (isModalVisible) {
      setSelectedKeys(
        multiSelect
          ? Array.isArray(selectedId)
            ? selectedId
            : []
          : selectedId
          ? [selectedId as number]
          : []
      );
      setSearchTerm('');
      fetchData('');
    }
  }, [isModalVisible, selectedId, multiSelect, fetchData]);

  // Flatten tree for FlatList with unique path for keys
  const flattenTree = useCallback((data: LocationData[], level = 0, parentPath = ''): LocationData[] => {
    let result: LocationData[] = [];
    data.forEach((item, index) => {
      const itemPath = parentPath ? `${parentPath}-${index}` : `${index}`;
      result.push({ ...item, level, key: `${item.locationId}-${itemPath}` });
      if (item.expanded && item.children && item.children.length > 0) {
        result = result.concat(flattenTree(item.children, level + 1, itemPath));
      }
    });
    return result;
  }, []);

  // Update flat data when tree changes
  useEffect(() => {
    setFlatData(flattenTree(treeData));
  }, [treeData, flattenTree]);

  // Toggle expand/collapse
  const toggleExpand = async (item: LocationData) => {
    if (!item.hasChild) return;

    const updateTreeExpand = (data: LocationData[]): LocationData[] => {
      return data.map((node) => {
        if (node.locationId === item.locationId) {
          return { ...node, expanded: !node.expanded };
        }
        if (node.children) {
          return { ...node, children: updateTreeExpand(node.children) };
        }
        return node;
      });
    };

    // If not expanded and children not loaded, fetch children
    if (!item.expanded && item.children?.length === 0) {
      setLoading(true);
      try {
        // Always fetch children without search parameter to get all direct children
        const data = await apiService.getChildLocationListByParentId(item.locationId, '');
        const childrenData = formatDataForTable(data);

        const updateTreeWithChildren = (data: LocationData[]): LocationData[] => {
          return data.map((node) => {
            if (node.locationId === item.locationId) {
              return { ...node, children: childrenData, expanded: true };
            }
            if (node.children) {
              return { ...node, children: updateTreeWithChildren(node.children) };
            }
            return node;
          });
        };

        setTreeData((prev) => updateTreeWithChildren(prev));
      } catch (error) {
        console.error('API Error:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setTreeData((prev) => updateTreeExpand(prev));
    }
  };

  // Find item in tree
  const findItemInTree = (id: number, tree: LocationData[]): LocationData | null => {
    for (const item of tree) {
      if (item.locationId === id) return item;
      if (item.children) {
        const found = findItemInTree(id, item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // Find multiple items in tree
  const findItemsInTree = (ids: number[], tree: LocationData[]): LocationData[] => {
    return ids.map((id) => findItemInTree(id, tree)).filter((item): item is LocationData => item !== null);
  };

  // Handle selection
  const handleSelect = (item: LocationData) => {
    if (multiSelect) {
      setSelectedKeys((prev) =>
        prev.includes(item.locationId)
          ? prev.filter((key) => key !== item.locationId)
          : [...prev, item.locationId]
      );
    } else {
      setSelectedKeys([item.locationId]);
    }
  };

  // Handle modal confirm
  const handleModalOk = (onChange: (value: any) => void) => {
    if (multiSelect) {
      const selectedData = findItemsInTree(selectedKeys, treeData);
      if (selectedData.length > 0) {
        onSubmit?.(selectedData);
        const locationNames = selectedData.map((item) => item.location).join(', ');
        onChange(locationNames);
      }
    } else {
      const selectedData = findItemInTree(selectedKeys[0], treeData);
      if (selectedData) {
        onSubmit?.(selectedData);
        onChange(selectedData.location);
      }
    }
    setIsModalVisible(false);
  };

  // Handle clear
  const handleClear = (onChange: (value: any) => void) => {
    onChange('');
    onSubmit?.(null);
  };

  // Render item
  const renderItem = ({ item }: { item: LocationData }) => {
    const isSelected = selectedKeys.includes(item.locationId);
    const paddingLeft = 16 + (item.level || 0) * 24;

    return (
      <Pressable onPress={() => handleSelect(item)}>
        <XStack
          paddingVertical="$3.5"
          paddingHorizontal="$4"
          paddingLeft={paddingLeft}
          backgroundColor={isSelected ? '$blue2' : 'transparent'}
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
          alignItems="center"
          gap="$3"
        >
          {item.hasChild ? (
            <Pressable onPress={() => toggleExpand(item)} hitSlop={15}>
              <View width={20} height={20} alignItems="center" justifyContent="center">
                {item.expanded ? (
                  <ChevronDown size={18} color="$gray11" />
                ) : (
                  <ChevronRight size={18} color="$gray11" />
                )}
              </View>
            </Pressable>
          ) : (
            <View width={20} />
          )}

          <YStack flex={1} gap="$1.5">
            <Text fontSize="$4" fontWeight="500" color="$color">
              {item.location}
            </Text>
            {item.fullLocationPath && (
              <Text fontSize="$2" color="$gray10" numberOfLines={1}>
                {item.fullLocationPath}
              </Text>
            )}
          </YStack>

          {multiSelect ? (
            <View
              width={22}
              height={22}
              borderRadius={5}
              borderWidth={2}
              borderColor={isSelected ? '$blue10' : '$gray8'}
              backgroundColor={isSelected ? '$blue10' : 'transparent'}
              alignItems="center"
              justifyContent="center"
            >
              {isSelected && <Text color="white" fontSize="$3" fontWeight="bold">✓</Text>}
            </View>
          ) : (
            isSelected && (
              <View
                width={22}
                height={22}
                borderRadius={11}
                backgroundColor="$blue10"
                alignItems="center"
                justifyContent="center"
              >
                <View width={10} height={10} borderRadius={5} backgroundColor="white" />
              </View>
            )
          )}
        </XStack>
      </Pressable>
    );
  };

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <YStack gap="$2">
          {label && (
            <Text fontSize="$3" fontWeight="600">
              {label}
              {required && (
                <Text color="$red10" marginLeft="$1">
                  *
                </Text>
              )}
            </Text>
          )}

          <Pressable onPress={() => setIsModalVisible(true)}>
            <View pointerEvents="none">
              <TextInput
                value={value || ''}
                placeholder={placeholder || (multiSelect ? t('lokasyonlarSec') : t('lokasyonSec'))}
                editable={false}
                placeholderTextColor={isDarkMode ? '#888' : '#999'}
                style={{
                  backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                  color: isDarkMode ? '#ffffff' : '#000000',
                  borderColor: error ? '#ff0000' : isDarkMode ? '#333' : '#ddd',
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 16,
                }}
              />
            </View>
          </Pressable>

          {value && (
            <Pressable
              onPress={() => handleClear(onChange)}
              style={{ position: 'absolute', right: 10, top: label ? 32 : 8 }}
            >
              <X size={20} color="$gray10" />
            </Pressable>
          )}

          {error && (
            <Text color="$red10" fontSize="$2">
              {error}
            </Text>
          )}

          <Modal
            visible={isModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <YStack flex={1} backgroundColor="$background" paddingTop="$2">
              {/* Header */}
              <XStack
                paddingVertical="$4"
                paddingHorizontal="$5"
                borderBottomWidth={1}
                borderBottomColor="$borderColor"
                alignItems="center"
                justifyContent="space-between"
              >
                <Text fontSize="$7" fontWeight="bold" color="$color">
                  {multiSelect ? t('lokasyonlar') : t('lokasyon')}
                </Text>
                <Pressable onPress={() => setIsModalVisible(false)} hitSlop={15}>
                  <View
                    width={32}
                    height={32}
                    borderRadius={16}
                    backgroundColor="$gray3"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <X size={20} color="$gray11" />
                  </View>
                </Pressable>
              </XStack>

              {/* Search */}
              <YStack padding="$4" paddingBottom="$3">
                <View>
                  <TextInput
                    value={searchTerm}
                    onChangeText={handleSearchChange}
                    placeholder={t('aramaYap')}
                    placeholderTextColor={isDarkMode ? '#888' : '#999'}
                    returnKeyType="search"
                    onSubmitEditing={handleSearch}
                    style={{
                      backgroundColor: isDarkMode ? '#1a1a1a' : '#f5f5f5',
                      color: isDarkMode ? '#ffffff' : '#000000',
                      borderColor: isDarkMode ? '#333' : '#ddd',
                      borderWidth: 1,
                      borderRadius: 10,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      fontSize: 16,
                    }}
                  />
                  <View style={{ position: 'absolute', right: 12, top: 12 }}>
                    <Search size={20} color={isDarkMode ? '#888' : '#999'} />
                  </View>
                </View>
              </YStack>

              {/* List */}
              {loading && !flatData.length ? (
                <YStack flex={1} alignItems="center" justifyContent="center">
                  <ActivityIndicator size="large" />
                </YStack>
              ) : (
                <FlatList
                  data={flatData}
                  renderItem={renderItem}
                  keyExtractor={(item) => item.key || `location-${item.locationId}`}
                  contentContainerStyle={{ paddingBottom: 100 }}
                />
              )}

              {/* Footer */}
              <XStack
                padding="$4"
                paddingBottom="$6"
                borderTopWidth={1}
                borderTopColor="$borderColor"
                gap="$3"
                backgroundColor="$background"
              >
                <Button
                  flex={1}
                  variant="outlined"
                  onPress={() => setIsModalVisible(false)}
                  borderColor="$gray8"
                  height={50}
                  borderRadius="$4"
                >
                  <Text fontSize="$4" fontWeight="600" color="$gray11">{t('cancel')}</Text>
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$blue10"
                  onPress={() => handleModalOk(onChange)}
                  disabled={selectedKeys.length === 0}
                  opacity={selectedKeys.length === 0 ? 0.5 : 1}
                  height={50}
                  borderRadius="$4"
                >
                  <Text fontSize="$4" fontWeight="600" color="white">{t('confirm')}</Text>
                </Button>
              </XStack>
            </YStack>
          </Modal>
        </YStack>
      )}
    />
  );
}

export default LocationPicker;
