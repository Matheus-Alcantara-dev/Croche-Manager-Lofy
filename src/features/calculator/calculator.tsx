import { useCallback, useState } from 'react';
import { Form, formValues, readForm } from '@/components/form';
import { Page } from '@/components/layout';
import { DataState } from '@/components/resource';
import { Button, Card, Copy, Heading, Notice, Row, Title } from '@/components/ui';
import { hourlyRate } from '@/domain/work-time';
import { localOwner } from '@/local/seed';
import { amount, nameField, reference } from '@/features/business/fields';
import { useAction, useData } from '@/hooks/use-data';
import { orderName } from '@/services/orders';
import { choices, ownList, save } from '@/services/store';
import { money } from '@/utils/format';
import { calculatePrice, zeroPrice, type PriceInput } from './price';

const groups = [
  { title: 'Materiais', fields: [
    amount('skeins', 'Quantidade de novelos'), amount('skeinPrice', 'Valor de cada novelo (R$)'),
    amount('otherMaterials', 'Outros materiais (R$)'), amount('packaging', 'Embalagem (R$)'),
    amount('accessories', 'Acessórios (R$)'),
  ] },
  { title: 'Mão de obra', fields: [amount('hours', 'Horas trabalhadas')] },
  { title: 'Custos adicionais', fields: [
    amount('energy', 'Energia (R$)'), amount('transport', 'Transporte (R$)'),
    amount('fees', 'Taxas (R$)'), amount('otherCosts', 'Outros custos (R$)'),
  ] },
  { title: 'Margem e desconto', fields: [
    { ...amount('marginPercent', 'Margem desejada (%)'), places: 4, max: 99.9999 },
    amount('discount', 'Desconto (R$)'),
  ] },
];
const fields = groups.flatMap((group) => group.fields);
const linkTypes = [
  { value: 'project_id', label: 'Projeto' }, { value: 'product_id', label: 'Produto' }, { value: 'order_id', label: 'Encomenda' },
];

export default function Calculator() {
  const owner = localOwner;
  const [values, setValues] = useState(formValues(fields));
  const [metadata, setMetadata] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ input: PriceInput; price: ReturnType<typeof calculatePrice> }>();
  const calculation = useAction();
  const persistence = useAction();
  const query = useCallback(async () => {
    const [saved, projects, products, orders, customers] = await Promise.all([
      ownList('price_calculations', owner), ownList('projects', owner), ownList('products', owner),
      ownList('orders', owner), ownList('customers', owner),
    ]);
    const names = new Map(customers.map((customer) => [customer.id, customer.name]));
    return { saved, links: {
      project_id: choices(projects), product_id: choices(products),
      order_id: orders.map((row) => ({ value: row.id, label: orderName(row, names) + ' · ' + row.id.slice(0, 8) })),
    } };
  }, [owner]);
  const state = useData(query);
  const linkFields = [nameField, reference('link', 'Vincular a', linkTypes)];
  const link = metadata.link as keyof NonNullable<typeof state.data>['links'];
  if (state.data && state.data.links[link]) linkFields.push(reference('target', 'Registro', state.data.links[link], true));

  return <Page narrow>
    <Heading>Calculadora de preços</Heading>
    <Copy muted>Calcule o preço de venda com margem sobre o preço. Campos vazios valem zero.</Copy>
    {groups.map((group) => <Card key={group.title}>
      <Title>{group.title}</Title>
      {group.title === 'Mão de obra' && <Copy muted>Valor fixo de {money(hourlyRate)} por hora.</Copy>}
      <Form fields={group.fields} value={values} setValue={(next) => { setValues(next); setResult(undefined); }} />
    </Card>)}
    {!!calculation.error && <Notice error>{calculation.error}</Notice>}
    <Button label="Calcular preço" disabled={calculation.busy} onPress={() => void calculation.run(async () => {
      setResult(undefined);
      const parsed = readForm(fields, values);
      const input = { ...zeroPrice };
      for (const key of Object.keys(input) as (keyof PriceInput)[]) input[key] = Number(parsed[key] ?? 0);
      input.hourly = hourlyRate;
      setResult({ input, price: calculatePrice(input) });
    })} />
    {result && <Card>
      <Title>Preço sugerido {money(result.price.suggested)}</Title>
      <Copy>Materiais {money(result.price.materials)} · Mão de obra {money(result.price.labor)}</Copy>
      <Copy>Custos adicionais {money(result.price.overhead)} · Custo total {money(result.price.cost)}</Copy>
      {result.price.discount > 0 && <Copy>Com desconto {money(result.price.finalPrice)}</Copy>}
      <Copy>Lucro estimado {money(result.price.profit)}</Copy>
      {state.data && <>
        <Form fields={linkFields} value={metadata} setValue={(next) =>
          setMetadata(next.link !== metadata.link ? { ...next, target: '' } : next)} />
        {!!persistence.error && <Notice error>{persistence.error}</Notice>}
        {!!persistence.success && <Notice>{persistence.success}</Notice>}
        <Button label="Salvar cálculo" disabled={persistence.busy} onPress={() => void persistence.run(async () => {
          const form = readForm(linkFields, metadata);
          const { materials, labor, overhead, margin, discount } = result.price;
          await save('price_calculations', owner, {
            name: form.name, input: result.input, materials, labor, overhead, margin, discount,
            suggested: result.price.suggested, project_id: null, product_id: null, order_id: null,
            ...(link ? { [link]: form.target } : {}),
          });
          setMetadata({});
          state.reload();
        }, 'Cálculo salvo.')} />
      </>}
    </Card>}
    <Title>Cálculos salvos</Title>
    <DataState {...state} retry={state.reload} />
    {state.data?.saved.length === 0 && <Copy muted>Nenhum cálculo salvo.</Copy>}
    {state.data?.saved.map((row) => <Card key={row.id}>
      <Row><Title>{row.name}</Title><Copy>{money(row.suggested - row.discount)}</Copy></Row>
      <Button label="Carregar valores" secondary onPress={() => {
        setValues(formValues(fields, row.input));
        setResult(undefined);
      }} />
    </Card>)}
  </Page>;
}
