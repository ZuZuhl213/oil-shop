import { apiFetch } from './client';
import type { CategoryDto } from './contracts/types';

export function getCategories(): Promise<CategoryDto[]> {
  return apiFetch<CategoryDto[]>('/categories');
}
