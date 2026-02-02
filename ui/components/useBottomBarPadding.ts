import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Keep these in sync with app/(tabs)/_layout.tsx
// Floating navigation bar dimensions
export const NAV_BAR_HEIGHT = 70;
export const NAV_BAR_CONTAINER_PADDING_TOP = 8;
export const NAV_BAR_CONTAINER_PADDING_HORIZONTAL = 20;
export const NAV_BAR_CONTAINER_PADDING_BOTTOM_MIN = 20;

export const useBottomBarPadding = (): number => {
  const insets = useSafeAreaInsets();
  // Floating nav bar is absolutely positioned, so we need to add
  // its full height + container padding as bottom padding for content
  const containerPaddingBottom = Math.max(insets.bottom, NAV_BAR_CONTAINER_PADDING_BOTTOM_MIN);
  return NAV_BAR_HEIGHT + NAV_BAR_CONTAINER_PADDING_TOP + containerPaddingBottom + 16; // +16 for extra buffer
};
