export const maxPrice = 9_999_999_999.99;

export type PriceInput = {
  skeins: number; skeinPrice: number; otherMaterials: number; packaging: number; accessories: number;
  hours: number; hourly: number; energy: number; transport: number; fees: number; otherCosts: number;
  marginPercent: number; discount: number;
};

export const zeroPrice: PriceInput = {
  skeins: 0, skeinPrice: 0, otherMaterials: 0, packaging: 0, accessories: 0, hours: 0, hourly: 0,
  energy: 0, transport: 0, fees: 0, otherCosts: 0, marginPercent: 0, discount: 0,
};

const cents = (value: number) => BigInt(Math.round(value * 100));
const currency = (value: bigint) => Number(value) / 100;
const roundDivide = (numerator: bigint, denominator: bigint) => (numerator + denominator / 2n) / denominator;

export function calculatePrice(input: PriceInput) {
  if (Object.values(input).some((value) => !Number.isFinite(value) || value < 0 || value > maxPrice)) {
    throw new Error('Informe valores válidos e não negativos.');
  }
  const marginMillionths = Math.round(input.marginPercent * 10_000);
  if (input.marginPercent >= 100 || marginMillionths >= 1_000_000) {
    throw new Error('A margem deve ficar entre 0% e 99,9999%.');
  }
  const materials = roundDivide(cents(input.skeins) * cents(input.skeinPrice), 100n)
    + cents(input.otherMaterials) + cents(input.packaging) + cents(input.accessories);
  const labor = roundDivide(cents(input.hours) * cents(input.hourly), 100n);
  const overhead = cents(input.energy) + cents(input.transport) + cents(input.fees) + cents(input.otherCosts);
  const cost = materials + labor + overhead;
  const suggested = roundDivide(cost * 1_000_000n, BigInt(1_000_000 - marginMillionths));
  if (suggested > cents(maxPrice)) throw new Error('O valor calculado excede o limite em reais.');
  const discount = cents(input.discount);
  if (discount > suggested) throw new Error('O desconto deve ser igual ou menor que o preço sugerido.');
  const finalPrice = suggested - discount;

  return {
    materials: currency(materials), labor: currency(labor), overhead: currency(overhead),
    cost: currency(cost), margin: marginMillionths / 1_000_000, suggested: currency(suggested),
    discount: currency(discount), finalPrice: currency(finalPrice), profit: currency(finalPrice - cost),
  };
}
