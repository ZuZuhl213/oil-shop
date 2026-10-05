import type { CategoryDto, ProductDto } from '@/lib/api/contracts/types';

export const categories: CategoryDto[] = [
  {id:'21',name:'Dầu thực vật',slug:'dau-thuc-vat',description:null,sortOrder:0,isActive:true},
  {id:'22',name:'Nguyên liệu',slug:'nguyen-lieu',description:null,sortOrder:1,isActive:true},
];
export const product: ProductDto = {
  id:'31',categoryId:'21',name:'Dầu lạc API',slug:'dau-lac-api',shortDescription:'Dầu từ API',description:'Mô tả thật',
  thumbnailUrl:null,images:[],imagesRevision:0,saleType:'FIXED_PRICE',status:'ACTIVE',sortOrder:0,
  variants:[
    {id:'41',productId:'31',name:'Chai 1L',sku:'API-1L',price:90000,minQuantity:1,quantityStep:1,isActive:true,sortOrder:0},
    {id:'42',productId:'31',name:'Can 5L',sku:'API-5L',price:400000,minQuantity:2,quantityStep:2,isActive:true,sortOrder:1},
  ],
};
