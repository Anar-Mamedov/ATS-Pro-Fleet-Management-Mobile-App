import { Text } from '@tamagui/core';
import React, { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs, { setDayjsLocaleFromI18n } from '../../config/dayjs';

export interface FormattedTimeProps {
  /** Time value to format. Accepts HH:mm:ss string or ISO string. */
  value: string;
  /** Day.js format string. Defaults to localized time (LT). */
  format?: string;
  /** Text props passthrough for Tamagui Text (e.g., color, fontSize). */
  textProps?: React.ComponentProps<typeof Text>;
}

function FormattedTimeComponent({ value, format = 'LT', textProps }: Readonly<FormattedTimeProps>) {
  const { i18n } = useTranslation();

  useEffect(() => {
    setDayjsLocaleFromI18n(i18n.language);
  }, [i18n.language]);

  // Handle "HH:mm:ss" format by prepending a dummy date for dayjs
  const normalizedValue = value.includes('T') || value.includes('-') ? value : `1970-01-01T${value}`;
  const dateInstance = dayjs(normalizedValue);
  const output = dateInstance.isValid() ? dateInstance.format(format) : '';

  return <Text {...textProps}>{output}</Text>;
}

export const FormattedTime = memo(FormattedTimeComponent);
export default FormattedTime;
