import { Stack, Text } from '@tamagui/core';
import React from 'react';

interface RecordBadgeProps {
  label: string;
  color: string;
}

// Liste kartlarında durum / öncelik gibi kısa etiketler için renkli rozet.
export function RecordBadge({ label, color }: RecordBadgeProps) {
  return (
    <Stack backgroundColor={`${color}1F`} borderRadius={6} paddingHorizontal={8} paddingVertical={3}>
      <Text fontSize="$2" fontWeight="600" color={color} numberOfLines={1}>
        {label}
      </Text>
    </Stack>
  );
}
