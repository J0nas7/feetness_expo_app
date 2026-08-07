import { getLocales } from 'expo-localization';
import da from './da';
import en from './en';
import type { SupportedLocale, TranslationTree, TranslationValue } from './types';

const translations: Record<SupportedLocale, TranslationTree> = { da, en };
export const locale: SupportedLocale = getLocales()[0]?.languageCode === 'da' ? 'da' : 'en';

export function t(key: string, values: Record<string, string | number> = {}): string {
  const lookup = (tree: TranslationTree): TranslationValue | undefined =>
    key.split('.').reduce<TranslationValue | undefined>((value, part) =>
      value && typeof value !== 'string' ? value[part] : undefined, tree);
  const translated = lookup(translations[locale]) ?? lookup(translations.en) ?? key;
  if (typeof translated !== 'string') return key;
  return translated.replace(/{{(\w+)}}/g, (_, name: string) => String(values[name] ?? `{{${name}}}`));
}

export function activityName(activity: string): string {
  const activities = new Set(['cycling', 'running', 'walking']);
  return t(`common.activity.${activities.has(activity) ? activity : 'unknown'}`);
}
