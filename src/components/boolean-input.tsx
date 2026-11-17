import { Switch } from 'react-native';
import { colors } from '@/theme';

export default function BooleanInput({ value, onChange, label }: {
  value: boolean; onChange: (value: boolean) => void; label: string;
}) {
  return <Switch value={value} onValueChange={onChange} accessibilityLabel={label}
    trackColor={{ false: colors.border, true: colors.accent }} />;
}
