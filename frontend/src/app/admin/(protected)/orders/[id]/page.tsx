import { OrderDetail } from '@/features/admin/orders/OrderDetail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <OrderDetail key={id} id={id} />; }
