import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Keep these in sync with app/(tabs)/_layout.tsx
export const BOTTOM_BAR_HEIGHT = 65;
export const BOTTOM_BAR_BOTTOM_SPACING = 16;

export const useBottomBarPadding = (): number => {
  const insets = useSafeAreaInsets();
  return BOTTOM_BAR_HEIGHT + Math.max(insets.bottom, BOTTOM_BAR_BOTTOM_SPACING) + 12;
};
