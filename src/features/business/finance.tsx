import { useCallback, useState } from 'react';
import { Page } from '@/components/layout';
import { DataState, Resource } from '@/components/resource';
import { Card, Copy, Field, Heading, Notice, Row, Title } from '@/components/ui';
import { localOwner } from '@/local/seed';
import { useData } from '@/hooks/use-data';
import { ownList, remove, save } from '@/services/store';
import { dateLabel, money, today, validDate } from '@/utils/format';
import { amount, date, nameField, reference } from './fields';

const kinds = [{ value: 'income', label: 'Receita' }, { value: 'expense', label: 'Despesa' }];

export default function Finance() {
  const owner = localOwner;
  const [start, setStart] = useState(today().slice(0, 8) + '01');
  const [end, setEnd] = useState('');
  const validPeriod = (!start || validDate(start)) && (!end || validDate(end)) && (!start || !end || start <= end);
  const query = useCallback(() => ownList('financial_transactions', owner), [owner]);
  const state = useData(query);
  const rows = validPeriod ? state.data?.filter((row) =>
    (!start || row.transaction_date >= start) && (!end || row.transaction_date <= end)) ?? [] : [];
  const income = rows.reduce((sum, row) => sum + (row.kind === 'income' ? row.amount : 0), 0);
  const expense = rows.reduce((sum, row) => sum + (row.kind === 'expense' ? row.amount : 0), 0);

  return <Page>
    <Heading>Financeiro</Heading>
    <DataState {...state} retry={state.reload} />
    <Card>
      <Title>Resumo por período</Title>
      <Row>
        <Field label="Início (AAAA-MM-DD)" value={start} onChangeText={setStart} maxLength={10} />
        <Field label="Fim (AAAA-MM-DD)" value={end} onChangeText={setEnd} maxLength={10} />
      </Row>
      {!validPeriod && <Notice error>Informe datas válidas e uma data final igual ou posterior à inicial.</Notice>}
      {validPeriod && state.data && <Row>
        <Copy>Receitas {money(income)}</Copy>
        <Copy>Despesas {money(expense)}</Copy>
        <Copy>Saldo {money(income - expense)}</Copy>
      </Row>}
    </Card>
    {validPeriod && state.data && <>
      <Resource singular="movimentação avulsa" title="Receitas e despesas avulsas"
        rows={rows.filter((row) => !row.order_id)}
        fields={[nameField, { ...reference('kind', 'Tipo', kinds, true), default: 'expense' },
          { key: 'category', label: 'Categoria', max: 80, required: true },
          { ...amount('amount', 'Valor (R$)', true), min: 0.01 },
          { ...date('transaction_date', 'Data da movimentação', today()), required: true }]}
        label={(row) => row.name} searchText={(row) => row.category}
        filter={{ options: kinds, value: (row) => row.kind }}
        summary={(row) => <Copy muted>{row.kind === 'income' ? 'Receita' : 'Despesa'} · {money(row.amount)} · {row.category} · {dateLabel(row.transaction_date)}</Copy>}
        save={(values, row) => save('financial_transactions', owner, values, row)}
        remove={(row) => remove('financial_transactions', owner, row)} refresh={state.reload} />
      <Card>
        <Title>Receitas de encomendas</Title>
        <Copy muted>Registre e ajuste pagamentos nos detalhes de cada encomenda.</Copy>
        {rows.filter((row) => row.order_id).map((row) => <Copy key={row.id}>
          {row.name} · {money(row.amount)} · {dateLabel(row.transaction_date)}
        </Copy>)}
      </Card>
    </>}
  </Page>;
}
