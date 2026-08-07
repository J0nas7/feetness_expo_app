export type TranslationValue = string | TranslationTree;
export type TranslationTree = { readonly [key: string]: TranslationValue };
export type SupportedLocale = 'da' | 'en';

