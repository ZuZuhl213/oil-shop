import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/config/site';
import { ShieldCheck, Heart, Sparkles, MapPin, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Về chúng tôi',
  description: 'Câu chuyện về HM Naturals — từ đồng ruộng bãi bồi Bắc Bộ đến bàn ăn Việt.',
};

export default function AboutPage() {
  return (
    <div className="site-container py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-green/10 text-forest-green text-xs font-semibold tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-peanut-gold" />
          <span>Câu chuyện thương hiệu</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-forest-green leading-tight">
          Gìn Giữ Hạt Nông Sản<br className="hidden sm:inline" /> Thuần Bản Địa
        </h1>
        <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-2xl">
          Chúng tôi không tìm kiếm sự hào nhoáng công nghiệp, mà kiên định đồng hành cùng người nông dân giữ gìn giống hạt bản địa và phương pháp ép mộc cối đá cổ truyền.
        </p>
      </div>

      {/* Brand Hero Card */}
      <div className="bg-forest-green text-warm-cream rounded-3xl p-8 sm:p-12 space-y-5 shadow-lg relative overflow-hidden">
        {/* Decorative accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-peanut-gold/8 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="max-w-2xl space-y-4 relative z-10">
          <span className="inline-block text-[11px] uppercase tracking-[0.2em] text-peanut-gold font-bold">
            Tâm huyết xưởng ép
          </span>
          <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-warm-cream leading-snug">
            Từ Vạt Đất Phù Sa<br className="hidden sm:inline" /> Đến Gian Bếp Ấm Lành
          </h2>
          <p className="text-sm text-warm-cream/80 leading-relaxed">
            HM Naturals ra đời tại vùng bãi bồi sông Đáy nơi đất cát pha màu mỡ nuôi dưỡng những mẻ lạc sẻ đỏ vỏ mỏng, giàu dầu và nức tiếng thơm bùi. Nhận thấy người tiêu dùng ngày càng lo ngại trước dầu ăn công nghiệp tinh luyện nhiều hóa chất, xưởng chọn con đường ép cơ học chậm tự nhiên — giữ nguyên độ sánh, sắc vàng mật ong và hương vị mộc chân thật nhất.
          </p>
        </div>
      </div>

      {/* 3 Core Values */}
      <div className="space-y-6">
        <h2 className="font-display font-bold text-xl sm:text-2xl text-forest-green">
          Ba Giá Trị Cốt Lõi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              icon: ShieldCheck,
              iconBg: 'bg-forest-green/10',
              iconColor: 'text-forest-green',
              title: 'Trung Thực',
              desc: '100% nguyên chất từ hạt mộc. Tuyệt đối không pha trộn dầu cọ rẻ tiền, không chất bảo quản, không phụ gia khử mùi hay chất tạo màu hóa học.',
            },
            {
              icon: Heart,
              iconBg: 'bg-peanut-gold/15',
              iconColor: 'text-peanut-bark',
              title: 'Bản Địa',
              desc: 'Thu mua nông sản trực tiếp từ bà con nông dân với giá bao tiêu công bằng, góp phần bảo tồn các giống hạt bản địa như lạc sẻ đỏ, mè đen nương đồi.',
            },
            {
              icon: Sparkles,
              iconBg: 'bg-deep-olive/12',
              iconColor: 'text-deep-olive',
              title: 'Bền Vững',
              desc: 'Tôn trọng môi trường từ khâu đóng chai thủy tinh sẫm màu tái sử dụng được, đến việc tận dụng phụ phẩm bã đậu làm thức ăn gia súc và phân bón hữu cơ.',
            },
          ].map(({ icon: Icon, iconBg, iconColor, title, desc }) => (
            <div
              key={title}
              className="p-6 rounded-2xl bg-white border border-soft-sand/60 space-y-3 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`w-11 h-11 rounded-xl ${iconBg} grid place-items-center ${iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-forest-green">{title}</h3>
              <p className="text-[13px] text-text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Workshop Location & CTA */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-soft-sand/60 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <MapPin className="w-4 h-4 text-peanut-gold" />
            <h3 className="font-display font-bold text-lg text-forest-green">
              Ghé Thăm Cơ Sở Sản Xuất
            </h3>
          </div>
          <p className="text-[13px] text-text-muted max-w-md leading-relaxed">
            Chúng tôi luôn rộng cửa đón tiếp khách hàng và đối tác đến tham quan quy trình ép cối đá và kiểm chứng chất lượng dầu tại xưởng.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/contact"
            className="px-5 py-2.5 rounded-xl bg-forest-green hover:bg-forest-green-dark text-warm-cream font-semibold text-[13px] transition-colors no-underline shadow-sm inline-flex items-center gap-1.5"
          >
            Liên Hệ Đặt Lịch
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-xl bg-warm-cream border border-soft-sand hover:border-forest-green/40 text-dark-cocoa font-semibold text-[13px] transition-colors no-underline"
          >
            Xem Cửa Hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
