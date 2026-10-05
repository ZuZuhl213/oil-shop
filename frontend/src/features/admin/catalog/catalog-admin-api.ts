import { apiFetch, mutationHeaders } from '@/lib/api/client';
import type { CategoryDto, PageDto, ProductDto, VariantDto } from '@/lib/api/contracts/types';

export type CategoryWrite = Omit<CategoryDto, 'id'>;
export type ProductWrite = Omit<ProductDto, 'id' | 'variants' | 'images' | 'imagesRevision'> & { imageUrls: string[]; expectedImagesRevision?: number };
export type VariantWrite = Omit<VariantDto, 'id' | 'productId'>;
export type MediaUpload = { url: string; objectKey: string };

async function write<T>(path: string, method: 'POST' | 'PUT' | 'PATCH', body: unknown) {
  return apiFetch<T>(path, { method, headers: await mutationHeaders({ 'Content-Type': 'application/json' }), body: JSON.stringify(body) });
}
const idPath = (id: string) => encodeURIComponent(id);
export const listCategories = () => apiFetch<CategoryDto[]>('/admin/categories');
export async function listProducts(): Promise<ProductDto[]> {
  const products: ProductDto[] = [];
  let page = 0;
  while (true) {
    const result = await apiFetch<PageDto<ProductDto>>(`/admin/products?page=${page}&size=100`);
    products.push(...result.content);
    if (++page >= result.totalPages) return products;
  }
}
export const getProduct = (id: string) => apiFetch<ProductDto>('/admin/products/' + idPath(id));
export const saveCategory = (body: CategoryWrite, id?: string) => write<CategoryDto>('/admin/categories' + (id ? '/' + idPath(id) : ''), id ? 'PUT' : 'POST', body);
export const setCategoryActive = (id: string, isActive: boolean) => write<CategoryDto>(`/admin/categories/${idPath(id)}/status`, 'PATCH', { isActive });
export const saveProduct = (body: ProductWrite, id?: string) => write<ProductDto>('/admin/products' + (id ? '/' + idPath(id) : ''), id ? 'PUT' : 'POST', body);
export const setProductActive = (id: string, active: boolean) => write<ProductDto>(`/admin/products/${idPath(id)}/status`, 'PATCH', { status: active ? 'ACTIVE' : 'INACTIVE' });
export const saveVariant = (productId: string, body: VariantWrite, id?: string) => write<VariantDto>(id ? `/admin/variants/${idPath(id)}` : `/admin/products/${idPath(productId)}/variants`, id ? 'PUT' : 'POST', body);
export const setVariantActive = (id: string, isActive: boolean) => write<VariantDto>(`/admin/variants/${idPath(id)}/status`, 'PATCH', { isActive });
export async function uploadThumbnail(file: File) {
  const body = new FormData(); body.append('file', file);
  return apiFetch<MediaUpload>('/admin/media', { method: 'POST', headers: await mutationHeaders(), body });
}
