import { useState } from 'react';
import { View } from 'react-native';
import type { Choice, Values } from '@/services/store';
import { decimal, validDate, validEmail } from '@/utils/format';
import BooleanInput from './boolean-input';
import { Button, Copy, Field, Row } from './ui';

export type FormValues = Record<string, string>;
export type FormField = {
  key: string;
  label: string;
  type?: 'number' | 'date' | 'email' | 'multiline' | 'boolean' | 'choice';
  choices?: Choice[];
  required?: boolean;
  default?: string;
  max?: number;
  min?: number;
  places?: number;
};

export function formValues(fields: FormField[], row?: Record<string, unknown>): FormValues {
  return Object.fromEntries(fields.map(({ key, default: fallback }) =>
    [key, row?.[key] == null ? fallback ?? '' : String(row[key])]));
}

export function readForm(fields: FormField[], data: FormValues): Values {
  const values: Values = {};
  for (const field of fields) {
    const { key, label, required, type, max, min, places } = field;
    const value = data[key]?.trim() ?? '';
    if (type === 'boolean') {
      values[key] = value === 'true';
    } else if (!value) {
      if (required) throw new Error('Preencha ' + label.toLowerCase() + '.');
      values[key] = null;
    } else if (type === 'number') {
      const amount = decimal(value, label, max, places);
      if (amount < (min ?? 0)) throw new Error(label + ' deve ser no mínimo ' + min + '.');
      values[key] = amount;
    } else {
      if (type === 'date' && !validDate(value)) throw new Error(label + ' deve usar AAAA-MM-DD.');
      if (type === 'email' && !validEmail(value)) throw new Error('Informe um e-mail válido.');
      if (type === 'choice' && !field.choices?.some((option) => option.value === value)) {
        throw new Error('Selecione uma opção válida para ' + label.toLowerCase() + '.');
      }
      if (max && value.length > max) throw new Error(label + ' excede o limite de caracteres.');
      values[key] = value;
    }
  }
  return values;
}

export function Select({ label, options, value, onChange, optional = false }: {
  label: string; options: Choice[]; value: string; onChange: (value: string) => void; optional?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const visible = options.filter((option) => option.label.toLocaleLowerCase('pt-BR')
    .includes(query.trim().toLocaleLowerCase('pt-BR')));

  function choose(next: string) {
    onChange(next);
    setExpanded(false);
    setQuery('');
  }

  return <View style={{ gap: 6, alignItems: 'flex-start' }}>
    <Copy>{label}</Copy>
    <Button label={selected?.label ?? (optional ? 'Nenhum selecionado' : 'Selecione')} secondary
      onPress={() => setExpanded(!expanded)} />
    {expanded && <>
      {options.length > 8 && <Field label={'Buscar em ' + label.toLowerCase()} value={query} onChangeText={setQuery} />}
      <Row>
        {optional && <Button label="Limpar seleção" secondary onPress={() => choose('')} />}
        {visible.slice(0, 25).map((option) => <Button key={option.value} label={option.label}
          secondary={value !== option.value} onPress={() => choose(option.value)} />)}
      </Row>
      {!visible.length && <Copy muted>Nenhuma opção disponível.</Copy>}
      {visible.length > 25 && <Copy muted>Refine a busca para mostrar mais opções.</Copy>}
    </>}
  </View>;
}

export function Form({ fields, value, setValue }: {
  fields: FormField[]; value: FormValues; setValue: (value: FormValues) => void;
}) {
  return <>{fields.map((field) => {
    const { key, label, type, required } = field;
    const update = (text: string) => setValue({ ...value, [key]: text });
    if (type === 'boolean') return <Row key={key}>
      <Copy>{label}</Copy>
      <BooleanInput label={label} value={value[key] === 'true'} onChange={(next) => update(String(next))} />
    </Row>;
    if (type === 'choice') return <Select key={key} label={label} value={value[key]} optional={!required}
      options={field.choices ?? []} onChange={update} />;
    return <Field key={key} label={label + (required ? ' *' : '')} value={value[key] ?? ''} onChangeText={update}
      multiline={type === 'multiline'} maxLength={type === 'number' ? 18 : field.max}
      autoCapitalize={type === 'email' ? 'none' : 'sentences'}
      keyboardType={type === 'number' ? 'decimal-pad' : type === 'email' ? 'email-address' : 'default'}
      placeholder={type === 'date' ? 'AAAA-MM-DD' : undefined} />;
  })}</>;
}
