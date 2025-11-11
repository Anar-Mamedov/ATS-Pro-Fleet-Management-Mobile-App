import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Keep these in sync with app/(tabs)/_layout.tsx
export const BOTTOM_BAR_HEIGHT = 60;
export const BOTTOM_BAR_BOTTOM_SPACING = 12;

export const useBottomBarPadding = (): number => {
  const insets = useSafeAreaInsets();
  // Tab bar already reserves its own height, so we just need a tiny
  // buffer to keep scrollable content from touching it directly.
  return Math.max(insets.bottom, BOTTOM_BAR_BOTTOM_SPACING) + 8;
};
