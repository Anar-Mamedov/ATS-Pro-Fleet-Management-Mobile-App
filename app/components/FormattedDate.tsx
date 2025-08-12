import { Text } from '@tamagui/core';
import React, { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs, { setDayjsLocaleFromI18n } from '../../config/dayjs';

export interface FormattedDateProps {
  /** Date value to format. Accepts Date, ISO string, or timestamp. */
  value: Date | string | number;
  /** Day.js format string. Defaults to localized long date (LL). */
  format?: string;
  /** Text props passthrough for Tamagui Text (e.g., color, fontSize). */
  textProps?: React.ComponentProps<typeof Text>;
}

function FormattedDateComponent({ value, format = 'LL', textProps }: FormattedDateProps) {
  const { i18n } = useTranslation();

  useEffect(() => {
    setDayjsLocaleFromI18n(i18n.language);
  }, [i18n.language]);

  const dateInstance = dayjs(value);
  const output = dateInstance.isValid() ? dateInstance.format(format) : '';

  return <Text {...textProps}>{output}</Text>;
}

export const FormattedDate = memo(FormattedDateComponent);
export default FormattedDate;
