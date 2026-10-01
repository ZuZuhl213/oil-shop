import React, { Suspense } from 'react';
import { render, fireEvent, screen, waitFor, act } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CartProvider } from '@/context/CartContext';
import { clearQuoteDraft, readQuoteDraft } from '@/lib/checkout-storage';
import { categories, product } from '@/test/catalog-fixtures';
import Home from './page';
import Products from './products/page';
import Detail from './products/[slug]/page';
import ProductNotFound from './products/[slug]/not-found';
import { ProductCard, ProductCardBySlug } from '@/components/product/ProductCard';
import { toUiProduct } from '@/lib/catalog-adapter';

const navigation = vi.hoisted(() => ({ query: '', replace: vi.fn(), push: vi.fn() }));
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(navigation.query),
  useRouter: () => ({replace:navigation.replace,push:navigation.push}),
  usePathname: () => '/products',
  notFound: () => { throw new Error('NEXT_HTTP_ERROR_FALLBACK;404'); },
}));
beforeEach(() => {localStorage.clear();sessionStorage.clear();clearQuoteDraft();navigation.query='';navigation.replace.mockReset();navigation.push.mockReset();});
afterEach(() => {clearQuoteDraft();vi.unstubAllGlobals();});
class NotFoundBoundary extends React.Component<{children:React.ReactNode},{error:Error|null}> {
  state: {error:Error|null} = {error:null};
  static getDerivedStateFromError(error:Error) { return {error}; }
  render() {
    if (this.state.error?.message === 'NEXT_HTTP_ERROR_FALLBACK;404') return <ProductNotFound/>;
    if (this.state.error) throw this.state.error;
    return this.props.children;
  }
}
function renderPage(page: React.ReactNode) {return render(<NotFoundBoundary><CartProvider>{page}</CartProvider></NotFoundBoundary>);}
async function renderDetail(slug='dau-lac-nguyen-chat') {
  const params=Promise.resolve({slug});
  await act(async () => {renderPage(<Suspense fallback="Loading"><Detail params={params}/></Suspense>);});
}
function catalogApi(detail=product) {
  const calls: URL[]=[];
  vi.stubGlobal('fetch',vi.fn(async (path: string) => {
    const url=new URL(path,'http://localhost');calls.push(url);
    if(url.pathname.endsWith('/categories')) return Response.json(categories);
    if(url.pathname.endsWith('/products')) return Response.json({content:[product],page:Number(url.searchParams.get('page')),size:12,totalElements:25,totalPages:3});
    return Response.json(detail);
  }));
  return calls;
}
it('shows loading then an explicit empty catalog on home', async () => {
  let resolve!: (response: Response) => void;
  vi.stubGlobal('fetch', vi.fn((path: string) => path.endsWith('/categories')
    ? Promise.resolve(Response.json(categories))
    : new Promise<Response>((done) => { resolve = done; })));
  renderPage(<Home/>);
  expect(screen.getByRole('status')).toHaveTextContent('Đang tải sản phẩm');
  await act(async () => resolve(Response.json({content:[],page:0,size:12,totalElements:0,totalPages:0})));
  expect(await screen.findByText('Chưa có sản phẩm trong danh mục này.')).toBeVisible();
});
it('loads the chosen home category from the API instead of filtering the first twelve products', async () => {
  const calls=catalogApi(); renderPage(<Home/>);
  fireEvent.click(await screen.findByRole('button',{name:'Nguyên liệu'}));
  await waitFor(()=>expect(calls.some(url=>url.pathname.endsWith('/products') && url.searchParams.get('category')==='nguyen-lieu')).toBe(true));
});
it('allows adding a zero-price fixed variant and displays zero VND', () => {
  const free = {...product, variants:[{...product.variants[0],price:0}]};
  renderPage(<ProductCard product={toUiProduct(free)}/>);
  expect(screen.getByText('0 ₫')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Chọn mua Dầu lạc API'}));
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!).items[0]).toMatchObject({variantId:'41',price:0});
});
it('changes displayed price and SKU with the selected variant', async () => {
  catalogApi(); await renderDetail('dau-lac-api');
  expect(await screen.findByText('SKU: API-1L')).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'Can 5L'}));
  expect(screen.getByText('SKU: API-5L')).toBeVisible();
  expect(screen.getByText('400.000 ₫')).toBeVisible();
});
it('disables both purchase actions when no variant is sellable', async () => {
  catalogApi({...product, variants:[]}); await renderDetail('dau-lac-api');
  expect(await screen.findByRole('button',{name:'Đặt Mua Ngay'})).toBeDisabled();
  expect(screen.getByRole('button',{name:'+ Giỏ Hàng'})).toBeDisabled();
});
it('shows quote pricing without zero VND', async () => {
  catalogApi({...product,saleType:'QUOTE',variants:[{...product.variants[0],price:null}]});
  await renderDetail('dau-lac-api');
  expect(await screen.findByText('Liên hệ báo giá sỉ')).toBeVisible();
  expect(screen.queryByText('0 ₫')).not.toBeInTheDocument();
});
it('reports an unknown category instead of showing unfiltered products', async () => {
  navigation.query='category=missing'; catalogApi(); renderPage(<Products/>);
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy danh mục');
  expect(screen.queryByRole('button',{name:'Chọn mua Dầu lạc API'})).not.toBeInTheDocument();
});
it('does not show purchasable demo products on home when the API fails', async () => {
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));renderPage(<Home/>);
  await screen.findByRole('alert');
  expect(screen.queryByRole('button',{name:'Chọn mua Dầu Phộng Ép Lạnh Cối Đá'})).not.toBeInTheDocument();
});
it('related article product cards only show a purchasable product returned by the API', async () => {
  catalogApi();renderPage(<ProductCardBySlug slug="dau-lac-api"/>);
  expect(await screen.findByRole('button',{name:'Chọn mua Dầu lạc API'})).toBeVisible();
  expect(screen.queryByRole('button',{name:'Chọn mua Dầu Phộng Ép Lạnh Cối Đá'})).not.toBeInTheDocument();
});
it('shows a retryable listing error without demo products', async () => {
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));renderPage(<Products/>);
  expect(await screen.findByRole('button',{name:'Thử lại'})).toBeVisible();
  expect(screen.queryByRole('button',{name:'Chọn mua Dầu Phộng Ép Lạnh Cối Đá'})).not.toBeInTheDocument();
});
it('does not allow buying a demo product after the API returns 404', async () => {
  vi.spyOn(console,'error').mockImplementation(()=>{});
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json({code:'NOT_FOUND',message:'Product not found',fieldErrors:{}},{status:404})));
  await renderDetail();
  expect(await screen.findByRole('alert')).toHaveTextContent('Không tìm thấy sản phẩm');
  expect(screen.queryByRole('button',{name:'Đặt Mua Ngay'})).not.toBeInTheDocument();
});
it('sends URL category, keyword and page to the API and exposes pagination', async () => {
  navigation.query='category=dau-thuc-vat&q=lac&page=2';const calls=catalogApi();renderPage(<Products/>);
  await screen.findByRole('heading',{name:'Dầu lạc API'});
  const url=calls.find((url)=>url.pathname.endsWith('/products'))!;
  expect(url.searchParams.get('category')).toBe('dau-thuc-vat');
  expect(url.searchParams.get('keyword')).toBe('lac');
  expect(url.searchParams.get('page')).toBe('2');
  expect(screen.getByRole('button',{name:'Trang trước'})).toBeEnabled();
  expect(screen.getByRole('button',{name:'Trang sau'})).toBeDisabled();
});
it('resets page and preserves keyword in the URL when category changes', async () => {
  navigation.query='category=dau-thuc-vat&q=lac&page=2';catalogApi();renderPage(<Products/>);
  fireEvent.click(await screen.findByRole('button',{name:'Nguyên liệu'}));
  const url=new URL(window.location.href);
  expect(url.searchParams.get('category')).toBe('nguyen-lieu');
  expect(url.searchParams.get('page')).toBe('0');
  expect(url.searchParams.get('q')).toBe('lac');
});
it('keeps typed search text visible while the URL update is pending', async () => {
  catalogApi();
  renderPage(<Products/>);
  const input = await screen.findByRole('textbox', { name: 'Tìm kiếm sản phẩm' });

  fireEvent.change(input, { target: { value: 'd' } });

  expect(input).toHaveValue('d');
});
it('resets quantity to the selected variant minimum', async () => {
  catalogApi();await renderDetail('dau-lac-api');
  fireEvent.click(await screen.findByRole('button',{name:'Can 5L'}));
  expect(screen.getByText('2',{selector:'.qty-number'})).toBeVisible();
  fireEvent.click(screen.getByRole('button',{name:'+ Giỏ Hàng'}));
  const cart=JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!);
  expect(cart.items[0]).toMatchObject({variantId:'42',quantity:2});
});
it('saves the selected quote quantity in a draft and starts separate checkout', async () => {
  const fixedCart={version:1,saleType:'FIXED_PRICE',items:[{productId:'1',productName:'Dầu lạc',productSlug:'dau-lac',variantId:'15',variantName:'1L',price:90000,quantity:1,minQuantity:1,quantityStep:1,saleType:'FIXED_PRICE',thumbnailType:'peanut'}]};
  localStorage.setItem('hm_naturals_cart_v1',JSON.stringify(fixedCart));
  const quote={...product,saleType:'QUOTE' as const,variants:[{...product.variants[0],price:null,minQuantity:0.5,quantityStep:0.5}]};
  catalogApi(quote);await renderDetail('dau-lac-api');
  fireEvent.click(await screen.findByRole('button',{name:'Tăng theo quy cách'}));
  fireEvent.click(screen.getByRole('button',{name:'Gửi Yêu Cầu Báo Giá'}));
  expect(readQuoteDraft()).toMatchObject({variantId:'41',quantity:1});
  expect(JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!)).toEqual(fixedCart);
  expect(navigation.push).toHaveBeenCalledWith('/checkout?mode=quote');
});
