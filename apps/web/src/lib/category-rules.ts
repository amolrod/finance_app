export type CategoryRuleMatch = 'contains' | 'startsWith' | 'endsWith';
export type CategoryRuleType = 'ALL' | 'INCOME' | 'EXPENSE';

export interface CategoryRule {
  id: string;
  name: string;
  keyword: string;
  match: CategoryRuleMatch;
  categoryId: string;
  type: CategoryRuleType;
  createdAt: string;
}

const STORAGE_KEY = 'financeapp.categoryRules';

export const normalizeText = (value: string) => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const loadCategoryRules = (): CategoryRule[] => {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as CategoryRule[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveCategoryRules = (rules: CategoryRule[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
};

export const applyCategoryRules = (
  rules: CategoryRule[],
  description: string | null | undefined,
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
) => {
  if (!description) return undefined;
  const normalized = normalizeText(description);
  return rules.find((rule) => {
    if (rule.type !== 'ALL' && rule.type !== type) return false;
    const keyword = normalizeText(rule.keyword);
    if (!keyword) return false;
    if (rule.match === 'startsWith') return normalized.startsWith(keyword);
    if (rule.match === 'endsWith') return normalized.endsWith(keyword);
    return normalized.includes(keyword);
  })?.categoryId;
};
