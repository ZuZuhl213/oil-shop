import { expect, test, type Page, type Route } from '@playwright/test';
import { categories, product } from '../src/test/catalog-fixtures';
import type { CreateOrderRequest, OrderReceipt, ProductDto } from '../src/lib/api/contracts/types';

const cartLine = {
  productId:product.id,productName:product.name,productSlug:product.slug,
  variantId:'41',variantName:'Chai 1L',price:90000,quantity:1,minQuantity:1,quantityStep:1,
  saleType:'FIXED_PRICE',thumbnailType:'peanut',
};
const receipt: OrderReceipt = {
  orderCode:'DH-E2E-1',orderType:'ORDER',status:'NEW',subtotal:90000,discountAmount:0,totalAmount:90000,createdAt:'2026-09-26T00:00:00Z',
};
async function seedCart(page: Page) {
  await page.addInitScript((line) => {
    if (!localStorage.getItem('hm_naturals_cart_v1')) localStorage.setItem('hm_naturals_cart_v1',JSON.stringify({version:1,saleType:'FIXED_PRICE',items:[line]}));
  },cartLine);
}
async function fixtureApi(page: Page, options: {detail?:ProductDto;order?:(route:Route)=>Promise<void>;missing?:boolean} = {}) {
  await page.route('**/api/v1/**',async (route)=>{
    const url=new URL(route.request().url());
    if (url.pathname.endsWith('/categories')) return route.fulfill({json:categories});
    if (url.pathname.endsWith('/csrf')) return route.fulfill({json:{token:'csrf-e2e',headerName:'X-CSRF-TOKEN'}});
    if (url.pathname.endsWith('/orders')) {
      if (options.order) return options.order(route);
      return route.fulfill({status:201,json:receipt});
    }
    if (url.pathname.endsWith('/products')) {
      const currentPage=Number(url.searchParams.get('page')??0);
      return route.fulfill({json:{
        content:[{...product,name:currentPage===1?'Dầu trang hai API':product.name}],
        page:currentPage,size:12,totalElements:25,totalPages:3,
      }});
    }
    if (options.missing) return route.fulfill({status:404,json:{code:'NOT_FOUND',message:'Product not found',fieldErrors:{}}});
    return route.fulfill({json:options.detail??product});
  });
}
async function fillCustomer(page: Page) {
  await page.getByPlaceholder('Ví dụ: Nguyễn Văn An').fill('Nguyen Van A');
  await page.getByPlaceholder('0912345678 hoặc +84912345678').fill('0912345678');
}

test('category links resolve to the shared listing and unknown categories show an error', async ({page}) => {
  await fixtureApi(page);
  await page.goto('/categories/nguyen-lieu');
  await expect(page).toHaveURL(/products\?category=nguyen-lieu&page=0/);
  await expect(page.getByRole('button',{name:'Nguyên liệu',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.goto('/categories/missing');
  await expect(page.getByRole('alert').filter({hasText:'Không tìm thấy danh mục'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Chọn mua/})).toHaveCount(0);
});

test('catalog filters and variants work from the keyboard', async ({page}) => {
  await fixtureApi(page);
  await page.goto('/products');
  const search = page.getByRole('textbox',{name:'Tìm kiếm sản phẩm'});
  await search.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Tất Cả',exact:true})).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Dầu thực vật',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/category=dau-thuc-vat/);
  const card=page.getByRole('link').filter({has:page.getByRole('heading',{name:product.name})});
  await card.focus(); await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/products\/dau-lac-api/);
  await page.getByRole('button',{name:'Chai 1L',exact:true}).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button',{name:'Can 5L',exact:true})).toBeFocused();
  await page.keyboard.press('Space');
  await expect(page.getByText('SKU: API-5L')).toBeVisible();
  await expect(page.getByText('400.000 ₫',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Can 5L',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('search preserves all keystrokes when URL navigation is slow', async ({page}) => {
  await fixtureApi(page); await page.goto('/products');
  await page.route('**/products?*', async route => {
    if (new URL(route.request().url()).searchParams.has('_rsc')) await new Promise(resolve=>setTimeout(resolve,300));
    await route.continue();
  });
  const search=page.getByRole('textbox',{name:'Tìm kiếm sản phẩm'});
  await search.pressSequentially('dau lac',{delay:70});
  await expect(search).toHaveValue('dau lac');
  await expect(page).toHaveURL(/q=dau\+lac/);
});

test('catalog consumes API filters and pagination through the URL',async ({page})=>{
  await fixtureApi(page);
  await page.goto('/products');
  await expect(page.getByRole('heading',{name:product.name})).toBeVisible();
  await page.getByRole('button',{name:'Trang sau'}).click();
  await expect(page).toHaveURL(/page=1/);
  await expect(page.getByRole('heading',{name:'Dầu trang hai API'})).toBeVisible();
  await page.getByRole('button',{name:'Nguyên liệu'}).click();
  await expect(page).toHaveURL(/category=nguyen-lieu/);
  await expect(page).toHaveURL(/page=0/);
  const request=page.waitForRequest((request)=>{
    const url=new URL(request.url());return url.pathname==='/api/v1/products'&&url.searchParams.get('keyword')==='lac';
  });
  await page.getByRole('textbox',{name:'Tìm kiếm sản phẩm'}).fill('lac');
  const url=new URL((await request).url());
  expect(url.searchParams.get('category')).toBe('nguyen-lieu');
  expect(url.searchParams.get('page')).toBe('0');
  await page.reload();
  await expect(page.getByRole('textbox',{name:'Tìm kiếm sản phẩm'})).toHaveValue('lac');
});

test('offline catalog has retry and never exposes purchasable demo products',async ({page})=>{
  let offline=true;
  await fixtureApi(page);
  await page.route('**/api/v1/products?*',async(route)=>offline?route.abort():route.fallback());
  await page.goto('/products');
  await expect(page.getByRole('alert').filter({hasText:'Không tải được'})).toBeVisible();
  await expect(page.getByRole('button',{name:/Chọn mua/})).toHaveCount(0);
  offline=false;
  await page.getByRole('button',{name:'Thử lại',exact:true}).click();
  await expect(page.getByRole('heading',{name:product.name})).toBeVisible();
});

test('a mock slug returning 404 cannot be purchased',async ({page})=>{
  await fixtureApi(page,{missing:true});
  await page.goto('/products/dau-lac-nguyen-chat');
  await expect(page.getByRole('alert').filter({hasText:'Không tìm thấy sản phẩm'})).toBeVisible();
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Đặt Mua Ngay'})).toHaveCount(0);
});

test('selected variant resets the quantity displayed and stored in cart',async ({page})=>{
  await fixtureApi(page);await page.goto('/products/dau-lac-api');
  await page.getByRole('button',{name:'Can 5L',exact:true}).click();
  await expect(page.locator('.qty-number')).toHaveText('2');
  await page.getByRole('button',{name:'+ Giỏ Hàng',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('hm_naturals_cart_v1')??'{}').items)).toMatchObject([{variantId:'42',quantity:2}]);
});

test('timeout then reload retries the exact payload and key for one order',async ({page})=>{
  const requests:{key:string;payload:CreateOrderRequest}[]=[];
  const committed=new Map<string,OrderReceipt>();
  await seedCart(page);
  await fixtureApi(page,{order:async(route)=>{
    const key=route.request().headers()['idempotency-key'];
    expect(route.request().headers()['x-csrf-token']).toBe('csrf-e2e');
    requests.push({key,payload:route.request().postDataJSON()});
    if(!committed.has(key)) committed.set(key,receipt);
    if(requests.length===1) return route.abort();
    return route.fulfill({status:200,json:committed.get(key)});
  }});
  await page.goto('/checkout');await fillCustomer(page);
  await page.getByRole('button',{name:'Xem lại thông tin'}).click();
  await page.getByRole('button',{name:'Xác nhận và gửi yêu cầu'}).click();
  await expect(page.getByRole('alert').filter({hasText:'Chưa xác định'})).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading',{name:'Kiểm tra lại yêu cầu'})).toBeVisible();
  await expect(page.getByText('Nguyen Van A')).toBeVisible();
  await page.getByRole('button',{name:'Thử lại với cùng mã gửi',exact:true}).click();
  await expect(page).toHaveURL(/orders\/DH-E2E-1/);
  await expect(page.getByRole('heading',{name:'Biên Nhận Đặt Hàng'})).toBeVisible();
  expect(requests).toHaveLength(2);expect(requests[1]).toEqual(requests[0]);expect(committed.size).toBe(1);
});

test('quote mode with missing draft cannot submit the retail cart',async ({page})=>{
  await seedCart(page);await fixtureApi(page);await page.goto('/checkout?mode=quote');
  await expect(page.getByRole('heading',{name:'Chưa có sản phẩm báo giá'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Gửi Yêu Cầu Đặt Hàng',exact:true})).toHaveCount(0);
});

test('quote cart and successful receipt survive blocked session storage in memory',async ({page})=>{
  let sent:CreateOrderRequest|undefined;
  await seedCart(page);
  await page.addInitScript(()=>{
    Object.defineProperty(sessionStorage,'setItem',{value:()=>{throw new Error('quota');}});
    Object.defineProperty(sessionStorage,'getItem',{value:()=>{throw new Error('blocked');}});
  });
  await fixtureApi(page,{
    detail:{...product,saleType:'QUOTE',variants:[{...product.variants[0],price:null,minQuantity:0.5,quantityStep:0.5}]},
    order:async(route)=>{
      sent=route.request().postDataJSON();
      return route.fulfill({status:201,json:{...receipt,orderCode:'BG-E2E-1',orderType:'QUOTE_REQUEST',subtotal:null,totalAmount:null}});
    },
  });
  await page.goto('/products/dau-lac-api');
  await page.getByRole('button',{name:'Tăng theo quy cách'}).click();
  await page.getByRole('button',{name:'Gửi Yêu Cầu Báo Giá',exact:true}).click();
  await expect(page).toHaveURL(/\/checkout\?mode=quote$/);await fillCustomer(page);
  await page.getByRole('button',{name:'Xem lại thông tin'}).click();
  await page.getByRole('button',{name:'Xác nhận và gửi yêu cầu báo giá'}).click();
  await expect(page.getByRole('heading',{name:'Biên Nhận Yêu Cầu Báo Giá'})).toBeVisible();
  expect(sent).toMatchObject({orderType:'QUOTE_REQUEST',items:[{variantId:'41',quantity:1}]});
  expect(sent?.voucherCode).toBeUndefined();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('hm_naturals_cart_v1')!))).toMatchObject({
    saleType: 'FIXED_PRICE', items: [cartLine],
  });
});
