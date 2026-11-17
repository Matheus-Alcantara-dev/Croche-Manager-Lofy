const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const money = (value: number) => brl.format(value);
const localDate = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function dateLabel(date: string | null | undefined) {
  if (!date) return 'Sem data';
  if (date.length === 10) return date.split('-').reverse().join('/');
  return localDate.format(new Date(date));
}

export function today(date = new Date()) {
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value && !value.startsWith('0000');
}

export const validEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;

export function decimal(value: string, label: string, max = 9_999_999_999.99, places = 2) {
  const plain = value.trim().replace(',', '.');
  const pattern = places === 0 ? /^\d+$/ : new RegExp('^\\d+(?:\\.\\d{1,' + places + '})?$');
  if (!pattern.test(plain) || Number(plain) > max) {
    throw new Error(label + ' deve ser um número válido com até ' + places + ' casas decimais.');
  }
  return Number(plain);
}
