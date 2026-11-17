import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { colors, radius } from '@/theme';

export const fonts = { body: 'DMSans_400Regular', strong: 'DMSans_600SemiBold', title: 'InstrumentSerif_400Regular' };

export function Heading({ children }: PropsWithChildren) {
  return <Text accessibilityRole="header" style={styles.heading}>{children}</Text>;
}

export function Title({ children }: PropsWithChildren) {
  return <Text accessibilityRole="header" style={styles.title}>{children}</Text>;
}

export function Copy({ children, muted = false }: PropsWithChildren<{ muted?: boolean }>) {
  return <Text style={[styles.copy, muted && { color: colors.muted }]}>{children}</Text>;
}

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function Row({ children }: PropsWithChildren) {
  return <View style={styles.row}>{children}</View>;
}

export function Button({ label, onPress, secondary, disabled, danger }: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  danger?: boolean;
}) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }}
    disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.button, secondary && styles.secondary, danger && styles.danger,
      (disabled || pressed) && { opacity: disabled ? 0.5 : 0.8 }]}>
    <Text style={[styles.buttonText, secondary && { color: colors.accent }]}>{label}</Text>
  </Pressable>;
}

export function Field({ label, multiline, ...input }: TextInputProps & { label: string }) {
  return <View style={{ gap: 5 }}>
    <Text style={styles.label}>{label}</Text>
    <TextInput {...input} accessibilityLabel={label} multiline={multiline}
      placeholderTextColor={colors.muted} style={[styles.input, multiline && styles.multiline]} />
  </View>;
}

export function Notice({ children, error = false }: PropsWithChildren<{ error?: boolean }>) {
  return <Text accessibilityRole={error ? 'alert' : undefined} accessibilityLiveRegion="polite"
    style={[styles.notice, error && { backgroundColor: colors.dangerSurface, color: colors.danger }]}>
    {children}
  </Text>;
}

export function Loading() {
  return <ActivityIndicator accessibilityLabel="Carregando" size="large" color={colors.accent}
    style={{ padding: 24 }} />;
}

export const styles = StyleSheet.create({
  heading: { color: colors.ink, fontFamily: fonts.title, fontSize: 48, lineHeight: 52 },
  title: { color: colors.ink, fontFamily: fonts.strong, fontSize: 19, lineHeight: 25 },
  copy: { color: colors.ink, fontFamily: fonts.body, fontSize: 15, lineHeight: 23 },
  label: { color: colors.ink, fontFamily: fonts.strong, fontSize: 14 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.card, padding: 18, gap: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' },
  button: { backgroundColor: colors.accent, borderRadius: radius.field, minHeight: 44,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 8,
    borderWidth: 1, borderColor: colors.accent },
  secondary: { backgroundColor: colors.surface, borderColor: colors.border },
  danger: { backgroundColor: colors.danger, borderColor: colors.danger },
  buttonText: { color: colors.accentText, fontSize: 14, fontFamily: fonts.strong },
  input: { backgroundColor: colors.surface, minHeight: 46, padding: 10, borderRadius: radius.field,
    borderWidth: 1, borderColor: colors.border, color: colors.ink, fontFamily: fonts.body, fontSize: 16 },
  multiline: { minHeight: 84, textAlignVertical: 'top' },
  notice: { color: colors.sageInk, backgroundColor: colors.sage, padding: 12,
    borderRadius: radius.field, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
});
