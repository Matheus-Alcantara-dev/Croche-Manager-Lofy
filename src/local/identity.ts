export type LocalAccount = { phone: string; role: 'admin' | 'customer' };
export type LocalAccess = { accounts: Record<string, LocalAccount>; activePhone: string | null };

export const adminPhone = '5511900000001';
export const customerPhone = '5511900000002';
export const demoPin = '1234';
export const brandName = "Lofy's";

export function initialAccess(): LocalAccess {
  return {
    accounts: {
      [adminPhone]: { phone: adminPhone, role: 'admin' },
      [customerPhone]: { phone: customerPhone, role: 'customer' },
    },
    activePhone: null,
  };
}

export function normalizePhone(input: string) {
  if (!/^[+\d\s().-]+$/.test(input)) throw new Error('Informe um WhatsApp com DDD.');
  const digits = input.replace(/\D/g, '');
  const local = digits.length >= 12 && digits.startsWith('55') ? digits.slice(2) : digits;
  if (!/^[1-9]\d[2-9]\d{7,8}$/.test(local)) throw new Error('Informe um WhatsApp brasileiro com DDD.');
  return '55' + local;
}

export function formatPhone(phone: string) {
  const local = phone.slice(2);
  return '(' + local.slice(0, 2) + ') ' + local.slice(2, -4) + '-' + local.slice(-4);
}

export function activeAccount(access?: LocalAccess) {
  return access?.activePhone ? access.accounts[access.activePhone] ?? null : null;
}

export function signIn(access: LocalAccess, value: string, pin?: string) {
  const phone = normalizePhone(value);
  if (pin !== undefined && (phone !== adminPhone || pin !== demoPin)) {
    throw new Error('Número ou PIN de administrador incorreto.');
  }
  if (phone === adminPhone && pin === undefined) throw new Error('Use a entrada de administrador para esse número.');
  const account: LocalAccount = access.accounts[phone] ?? { phone, role: 'customer' };
  access.accounts[phone] = account;
  access.activePhone = phone;
  return account;
}

export function requireAdmin(access?: LocalAccess) {
  if (activeAccount(access)?.role !== 'admin') throw new Error('Esta área é exclusiva do administrador.');
}
