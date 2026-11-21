import { useColorScheme } from 'react-native';

const light = {
  background: '#F6F7F5',
  card: '#FFFFFF',
  text: '#16211C',
  muted: '#66736C',
  border: '#E2E6E3',
  primary: '#0F7B5F',
  primaryText: '#FFFFFF',
  credit: '#C2410C',
  creditSoft: '#FDEDE4',
  payment: '#15803D',
  paymentSoft: '#E3F5E8',
  danger: '#B91C1C',
  whatsapp: '#25D366',
};

export type Palette = typeof light;

const dark: Palette = {
  background: '#0E1412',
  card: '#18211E',
  text: '#ECF2EF',
  muted: '#93A29A',
  border: '#26322D',
  primary: '#2BB58C',
  primaryText: '#04150F',
  credit: '#FB923C',
  creditSoft: '#3A2418',
  payment: '#4ADE80',
  paymentSoft: '#15301F',
  danger: '#F87171',
  whatsapp: '#25D366',
};

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}
