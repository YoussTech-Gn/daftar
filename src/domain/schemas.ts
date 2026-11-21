import { z } from 'zod';

import { parseAmount } from '@/domain/currency';
import { PRODUCT_UNITS } from '@/domain/types';
import type { TranslationKey } from '@/i18n/translations';

/**
 * Form schemas (decision 0010). Error messages are translation keys; screens translate them with t().
 * Amount fields stay strings in the form and are converted with parseAmount() for the shop currency.
 */

const msg = (key: TranslationKey) => ({ message: key });

const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\+?[\d\s\-().]{6,20}$/.test(v), msg('phoneInvalid'));

export const customerSchema = z.object({
  name: z.string().trim().min(1, msg('nameRequired')).max(80),
  phone: optionalPhone,
  note: z.string().trim().max(120),
});
export type CustomerFormValues = z.input<typeof customerSchema>;

export function productSchema(currency: string) {
  return z.object({
    name: z.string().trim().min(1, msg('nameRequired')).max(60),
    price: z.string().refine((v) => parseAmount(v, currency) !== null, msg('priceRequired')),
    unit: z.enum(PRODUCT_UNITS),
  });
}
export type ProductFormValues = z.input<ReturnType<typeof productSchema>>;

export const shopSchema = z.object({
  shopName: z.string().trim().max(60),
  countryCode: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{1,4}$/.test(v), msg('invalidCountryCode')),
});
export type ShopFormValues = z.input<typeof shopSchema>;
