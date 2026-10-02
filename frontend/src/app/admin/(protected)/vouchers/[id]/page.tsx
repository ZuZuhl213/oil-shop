import { VoucherDetail } from '@/features/admin/vouchers/VoucherDetail';
export default async function Page({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <VoucherDetail key={id} id={id} />; }
