import type { FormField } from '@/components/form';
import type { Choice } from '@/services/store';

export const nameField: FormField = { key: 'name', label: 'Nome', required: true, max: 120 };
export const description: FormField = { key: 'description', label: 'Descrição', type: 'multiline', max: 3000 };
export const notes = (key = 'notes', label = 'Observações'): FormField => ({ key, label, type: 'multiline', max: 2000 });
export const reference = (key: string, label: string, choices: Choice[], required = false): FormField =>
  ({ key, label, type: 'choice', choices, required });
export const amount = (key: string, label: string, required = false, defaultValue?: string): FormField =>
  ({ key, label, type: 'number', required, default: defaultValue });
export const date = (key: string, label: string, initial?: string): FormField =>
  ({ key, label, type: 'date', max: 10, default: initial });
