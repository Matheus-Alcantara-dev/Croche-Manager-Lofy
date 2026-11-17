import { useState, type ReactNode } from 'react';
import { useWindowDimensions, View } from 'react-native';
import { useAction } from '@/hooks/use-data';
import type { Choice, Values } from '@/services/store';
import { Form, formValues, readForm, type FormField } from './form';
import { Button, Card, Copy, Field, Heading, Loading, Notice, Row, Title } from './ui';

type Config<T extends { id: string }> = {
  title?: string;
  grid?: boolean;
  openAfterCreate?: boolean;
  singular: string;
  fields: FormField[] | ((entry?: T) => FormField[]);
  rows: T[];
  label: (entry: T) => string;
  summary?: (entry: T) => ReactNode;
  searchText?: (entry: T) => string;
  filter?: { options: Choice[]; value: (entry: T) => string; initial?: string };
  details?: (entry: T) => ReactNode;
  save: (values: Values, entry?: T) => Promise<unknown>;
  remove?: (entry: T) => Promise<unknown>;
  refresh: () => void;
};

export function DataState({ loading, error, retry }: { loading: boolean; error?: string; retry: () => void }) {
  return <>{loading && <Loading />}
    {!!error && <Card><Notice error>{error}</Notice><Button label="Tentar novamente" secondary onPress={retry} /></Card>}
  </>;
}

export function Resource<T extends { id: string }>(config: Config<T>) {
  const { width } = useWindowDimensions();
  const grid = config.grid && width >= 680;
  const [editing, setEditing] = useState<T | 'new' | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(config.filter?.initial ?? '');
  const [details, setDetails] = useState('');
  const [confirm, setConfirm] = useState('');
  const [limit, setLimit] = useState(20);
  const action = useAction();

  const fieldsFor = (entry?: T) => typeof config.fields === 'function' ? config.fields(entry) : config.fields;
  const previous = editing && editing !== 'new' ? editing : undefined;
  const fields = fieldsFor(previous);

  function edit(entry?: T) {
    setEditing(entry ?? 'new');
    setValues(formValues(fieldsFor(entry), entry));
    setDetails('');
    setConfirm('');
  }

  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const filtered = config.rows.filter((entry) => (!filter || config.filter?.value(entry) === filter)
    && normalize(config.label(entry) + ' ' + (config.searchText?.(entry) ?? ''))
      .includes(normalize(search.trim())));

  return <View style={{ gap: 14 }}>
    {config.title && <Heading>{config.title}</Heading>}
    {!!action.error && <Notice error>{action.error}</Notice>}
    {!!action.success && <Notice>{action.success}</Notice>}
    {editing ? <Card>
      <Title>{(editing === 'new' ? 'Novo registro · ' : 'Editar · ') + config.singular}</Title>
      <Form fields={fields} value={values} setValue={setValues} />
      <Row>
        <Button label={action.busy ? 'Salvando…' : 'Salvar'} disabled={action.busy}
          onPress={() => void action.run(async () => {
            const saved = await config.save(readForm(fields, values), previous);
            if (!previous && config.openAfterCreate && saved && typeof saved === 'object' && 'id' in saved
              && typeof saved.id === 'string') setDetails(saved.id);
            setEditing(null);
            config.refresh();
          }, 'Registro salvo.')} />
        <Button label="Voltar à lista" secondary disabled={action.busy} onPress={() => setEditing(null)} />
      </Row>
    </Card> : <>
      <View style={{ alignItems: 'flex-start' }}><Button label={'Adicionar ' + config.singular}
        disabled={action.busy} onPress={() => edit()} /></View>
      {!!config.rows.length && <Field label="Buscar" value={search} onChangeText={setSearch} />}
      {config.filter && <Row>
        {[{ label: 'Todos', value: '' }, ...config.filter.options].map((option) =>
          <Button key={option.value} label={option.label} secondary={filter !== option.value}
            onPress={() => setFilter(option.value)} />)}
      </Row>}
      {!filtered.length && <Copy muted>{config.rows.length ? 'Nenhum resultado para os filtros.' : 'Nenhum registro cadastrado.'}</Copy>}
      <View style={{ flexDirection: grid ? 'row' : 'column', flexWrap: grid ? 'wrap' : 'nowrap', gap: 12 }}>
      {filtered.slice(0, limit).map((entry) => <View key={entry.id}
        style={{ width: grid && details !== entry.id ? (Math.min(width, 1120) - 44) / 2 : '100%' }}>
      <Card>
        <Title>{config.label(entry)}</Title>
        {config.summary?.(entry)}
        <Row>
          <Button label="Editar" secondary disabled={action.busy} onPress={() => edit(entry)} />
          {config.details && <Button label={details === entry.id ? 'Fechar detalhes' : 'Ver detalhes'} secondary
            onPress={() => setDetails(details === entry.id ? '' : entry.id)} />}
          {config.remove && <Button label="Excluir" secondary disabled={action.busy} onPress={() => setConfirm(entry.id)} />}
        </Row>
        {confirm === entry.id && config.remove && <View style={{ gap: 8 }}>
          <Notice>Excluir este registro permanentemente?</Notice>
          <Row>
            <Button label="Confirmar exclusão" danger disabled={action.busy}
              onPress={() => void action.run(async () => {
                await config.remove?.(entry);
                setConfirm('');
                config.refresh();
              }, 'Registro excluído.')} />
            <Button label="Cancelar" secondary onPress={() => setConfirm('')} disabled={action.busy} />
          </Row>
        </View>}
        {details === entry.id && config.details?.(entry)}
      </Card></View>)}
      </View>
      {filtered.length > limit && <Button label="Mostrar mais" secondary onPress={() => setLimit(limit + 20)} />}
    </>}
  </View>;
}
