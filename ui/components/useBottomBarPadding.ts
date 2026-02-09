/**
 * Returns a small bottom padding value for content screens.
 * Since the tab bar is now a standard (non-floating) bottom tab bar,
 * content is automatically placed above it by the navigation system.
 * This hook provides only a minimal buffer for visual spacing.
 */
export const useBottomBarPadding = (): number => {
  return 16;
};
