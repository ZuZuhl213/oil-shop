import type { Metadata } from 'next';
import { UnlabeledBottle } from '@/components/home/UnlabeledBottle';

export const metadata: Metadata = {
  title: 'Câu chuyện thương hiệu — Về HM NATURALS',
  description:
    'HM NATURALS — Gìn giữ hạt nông sản thuần bản địa và phương pháp ép nhiệt cơ học nguyên bản từ nông hộ Việt Nam.',
};

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}
function IconSeedling() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22V12" />
      <path d="M12 12C12 7 7 4 2 5c0 5 3 9 10 7Z" />
      <path d="M12 12c0-5 5-8 10-7-1 5-4 9-10 7Z" />
    </svg>
  );
}
function IconBottle() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3h6M10 3v2.5a4 4 0 0 0-2 3.5v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V9a4 4 0 0 0-2-3.5V3" />
      <line x1="8" y1="13" x2="16" y2="13" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="about-view-container desktop-about-container">
      {/* ── 1. Hero / Brand Intro ── */}
      <section className="about-hero-section desktop-about-hero" aria-labelledby="aboutHeroTitle">
        <span className="about-hero-eyebrow">
          <span>Câu Chuyện Thương Hiệu</span>
        </span>
        <h1 className="about-hero-title" id="aboutHeroTitle">
          Gìn Giữ Hạt Nông Sản Thuần Bản Địa
        </h1>
        <p className="about-hero-lead">
          Chúng tôi không tìm kiếm sự hào nhoáng công nghiệp, mà kiên định đồng hành cùng người nông dân giữ gìn giống hạt bản địa và phương pháp ép nhiệt cơ học truyền thống.
        </p>
      </section>

      {/* ── 2. Two-Column Asymmetric Story Section ── */}
      <section className="about-story-section desktop-about-story" aria-labelledby="storyHeading">
        {/* Left Column: Story narrative */}
        <div className="about-story-text">
          <span className="about-story-eyebrow">Tâm huyết xưởng ép</span>
          <h2 className="about-story-title" id="storyHeading">
            Từ Vạt Đất Phù Sa Đến Gian Bếp Ấm Lành
          </h2>
          <p className="about-story-p">
            HM NATURALS ra đời tại vùng bãi bồi sông Đáy nơi đất cát pha màu mỡ nuôi dưỡng những mẻ lạc sẻ đỏ vỏ mỏng, giàu dầu và nức tiếng thơm bùi.
          </p>
          <p className="about-story-p">
            Nhận thấy người tiêu dùng ngày càng lo ngại trước dầu ăn công nghiệp tinh luyện nhiều hóa chất, xưởng chọn con đường ép nhiệt cơ học nguyên chất — giữ nguyên độ sánh, sắc vàng tự nhiên và hương vị mộc chân thật nhất.
          </p>
          <div className="about-tags-row">
            <span className="about-tag-pill">Ép nhiệt cơ học</span>
            <span className="about-tag-pill">Lắng lọc vải mộc</span>
            <span className="about-tag-pill">Chai thủy tinh tối màu</span>
          </div>
        </div>

        {/* Right Column: Premium Showcase Bottle Card */}
        <div className="about-bottle-card">
          <div className="about-bottle-glow" aria-hidden="true" />

          {/* Approved Unlabeled Clear Glass Bottle Artwork */}
          <div className="py-2 flex items-center justify-center">
            <UnlabeledBottle
              type="peanut"
              className="w-[180px] h-[240px] drop-shadow-lg"
              ariaLabel="Chai dầu thủy tinh không nhãn minh họa HM NATURALS"
            />
          </div>

          <div className="about-bottle-caption">500ml • Chai Thủy Tinh Mộc</div>
          <div className="about-quote-box">
            &ldquo;Mỗi giọt dầu là kết tinh của mùa vụ bản địa và bàn tay người ép mộc.&rdquo;
          </div>
        </div>
      </section>

      {/* ── 3. Three Core Values Section ── */}
      <section className="about-values-section desktop-about-values" aria-labelledby="valuesHeading">
        <div className="about-values-head">
          <span className="about-values-eyebrow">Cam kết phẩm chất</span>
          <h2 className="about-values-title" id="valuesHeading">
            Ba Giá Trị Cốt Lõi
          </h2>
          <p className="about-values-desc">
            Nền tảng định hình mọi quyết định của xưởng, từ khâu chọn hạt đến lúc đóng chai.
          </p>
        </div>

        <div className="about-values-grid">
          {/* Value: Trung Thực */}
          <div className="about-value-card">
            <div className="about-value-card-head">
              <div className="about-value-icon"><IconShield /></div>
            </div>
            <h3 className="about-value-name">Trung Thực</h3>
            <p className="about-value-text">
              100% nguyên chất từ hạt mộc. Tuyệt đối không pha trộn dầu cọ rẻ tiền, không chất bảo quản, không phụ gia khử mùi hay chất tạo màu hóa học.
            </p>
          </div>

          {/* Value: Bản Địa */}
          <div className="about-value-card">
            <div className="about-value-card-head">
              <div className="about-value-icon"><IconSeedling /></div>
            </div>
            <h3 className="about-value-name">Bản Địa</h3>
            <p className="about-value-text">
              Thu mua nông sản trực tiếp từ bà con nông dân với giá bao tiêu công bằng, góp phần bảo tồn các giống hạt bản địa như lạc sẻ đỏ, mè đen nương đồi.
            </p>
          </div>

          {/* Value: Chỉn Chu */}
          <div className="about-value-card">
            <div className="about-value-card-head">
              <div className="about-value-icon"><IconBottle /></div>
            </div>
            <h3 className="about-value-name">Chỉn Chu Từng Sản Phẩm</h3>
            <p className="about-value-text">
              Tỉ mỉ trong từng công đoạn từ khâu chọn hạt nông sản, kiểm soát nhiệt độ ép, đến lắng lọc tự nhiên qua vải mộc và đóng chai thủy tinh tối màu giúp bảo quản chất lượng nguyên bản.
            </p>
          </div>
        </div>

        {/* Content Transparency Notice */}
        <div
          style={{
            marginTop: 28,
            padding: '12px 18px',
            background: '#FAF6EE',
            borderRadius: 12,
            border: '1px solid var(--soft-sand)',
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          <strong>Quy chuẩn thông tin trung thực:</strong> Các thông số kỹ thuật sản xuất chi tiết (nhiệt độ ép cụ thể, thời gian lắng lọc theo mùa vụ) được công bố dựa trên nhật ký vận hành thực tế của xưởng ép và luôn minh bạch với khách hàng.
        </div>
      </section>
    </div>
  );
}
