import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Form, readForm, type FormField } from '@/components/form';
import { Page } from '@/components/layout';
import { DataState } from '@/components/resource';
import { Button, Card, Copy, Heading, Notice, Row, Title, styles } from '@/components/ui';
import { leadTimeChoices, pixDemoCode, purchaseAmounts, type LeadDays } from '@/domain/checkout';
import { useLocalSession } from '@/features/access/session';
import { amount, nameField, notes, reference } from '@/features/business/fields';
import { useAction, useData } from '@/hooks/use-data';
import { formatPhone } from '@/local/identity';
import { confirmDemoDeposit, getOrderOptions, prepareDeposit, type DepositQuote, type OrderReceipt } from '@/services/orders';
import { dateLabel, money } from '@/utils/format';
import { DemoQr } from './demo-qr';

export default function RequestScreen() {
  const { account } = useLocalSession();
  const customer = account?.role === 'customer';
  const { produto, projeto } = useLocalSearchParams<{ produto?: string; projeto?: string }>();
  const [values, setValues] = useState<Record<string, string>>({
    piece: typeof projeto === 'string' ? 'project:' + projeto : typeof produto === 'string' ? 'product:' + produto : '',
    quantity: '1',
    leadDays: '14',
  });
  const [quote, setQuote] = useState<DepositQuote | null>(null);
  const [receipt, setReceipt] = useState<OrderReceipt | null>(null);
  const state = useData(getOrderOptions);
  const action = useAction();
  const options = state.data ?? [];
  const selected = options.find((item) => item.key === values.piece);
  const count = Number(values.quantity);
  const preview = selected && Number.isInteger(count) && count > 0 && count <= 100
    ? purchaseAmounts(selected.price, count) : null;
  const fields: FormField[] = [
    reference('piece', 'Peça', options.map((item) => ({ value: item.key, label: item.name + ' · ' + money(item.price) })), true),
    nameField, { key: 'email', label: 'E-mail (opcional)', max: 254, type: 'email' },
    ...(!customer ? [{ key: 'phone', label: 'Telefone ou WhatsApp', max: 40 }] : []),
    { ...amount('quantity', 'Quantidade', true), places: 0, min: 1, max: 100 },
    reference('leadDays', 'Prazo desejado após confirmar o sinal', leadTimeChoices, true),
    { key: 'color', label: 'Cor (opcional)', max: 120 },
    notes('notes', 'Detalhes da encomenda'),
  ];

  return <Page narrow>
    <Heading>Encomendar</Heading>
    {!!action.error && <Notice error>{action.error}</Notice>}
    {receipt ? <Card>
      <Title>Encomenda confirmada</Title>
      <Copy>Referência {receipt.id.slice(0, 8).toUpperCase()} · Sinal de teste confirmado em {dateLabel(receipt.confirmedAt)}</Copy>
      <Copy>Prazo desejado {dateLabel(receipt.desired)} · Data máxima {dateLabel(receipt.maximum)}</Copy>
      <Button label="Fazer outra encomenda" secondary onPress={() => {
        setReceipt(null);
        setQuote(null);
        setValues({ quantity: '1', leadDays: '14' });
      }} />
      {customer ? <Link href="/projetos" style={styles.copy}>Voltar aos projetos</Link>
        : <Link href="/atelie/encomendas" style={styles.copy}>Ver encomendas</Link>}
    </Card> : quote ? <Card>
      <Title>Pix de teste</Title>
      <Copy>{quote.piece.name} · {quote.input.quantity} unidade(s)</Copy>
      <Copy>Total {money(quote.total)} · Saldo após o sinal {money(quote.balance)}</Copy>
      <Title>Sinal de 50% · {money(quote.deposit)}</Title>
      <DemoQr value={pixDemoCode(quote.id, quote.deposit)} />
      <Notice>QR de demonstração, sem cobrança. Use o botão abaixo para simular o pagamento.</Notice>
      <Row>
        <Button label={action.busy ? 'Confirmando…' : 'Simular pagamento e confirmar'} disabled={action.busy}
          onPress={() => void action.run(async () => {
            if (!account) throw new Error('Entre para fazer sua encomenda.');
            setReceipt(await confirmDemoDeposit(quote, account.phone));
          })} />
        <Button label="Voltar ao pedido" secondary disabled={action.busy} onPress={() => setQuote(null)} />
      </Row>
    </Card> : <>
      <DataState {...state} retry={state.reload} />
      {state.data && (options.length ? <Card>
        {customer && account && <Copy muted>WhatsApp do pedido: {formatPhone(account.phone)}</Copy>}
        <Form fields={fields} value={values} setValue={setValues} />
        {preview && <Copy>Total {money(preview.total)} · Sinal {money(preview.deposit)}</Copy>}
        <Button label={action.busy ? 'Preparando…' : 'Gerar QR Pix de teste'} disabled={action.busy}
          onPress={() => void action.run(async () => {
            if (!account) throw new Error('Entre para fazer sua encomenda.');
            const input = readForm(fields, values);
            setQuote(await prepareDeposit({ piece: String(input.piece), name: String(input.name),
              email: input.email as string | null, phone: (input.phone ?? null) as string | null,
              quantity: Number(input.quantity), color: input.color as string | null,
              leadDays: Number(input.leadDays) as LeadDays, notes: input.notes as string | null }, account.phone));
          })} />
      </Card> : <Notice>Ainda não há peças disponíveis para encomenda.</Notice>)}
    </>}
  </Page>;
}
