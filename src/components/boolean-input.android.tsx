import { Host, Switch } from '@expo/ui/jetpack-compose';
import { semantics } from '@expo/ui/jetpack-compose/modifiers';
import { colors } from '@/theme';

export default function BooleanInput({ value, onChange, label }: {
  value: boolean; onChange: (value: boolean) => void; label: string;
}) {
  return <Host matchContents>
    <Switch value={value} onCheckedChange={onChange} colors={{ checkedTrackColor: colors.accent }}
      modifiers={[semantics({ contentDescription: label })]} />
  </Host>;
}
