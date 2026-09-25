import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Về chúng tôi — Câu chuyện thương hiệu',
  description: 'HM Naturals — Gìn giữ hạt nông sản thuần bản địa và phương pháp ép mộc cối đá cổ truyền.',
};

export default function AboutPage() {
  return (
    <div className="about-view-container desktop-about-container">
      {/* Hero / Brand Intro */}
      <div className="about-hero-section desktop-about-hero">
        <span className="about-hero-eyebrow">
          <span>🌿</span>
          <span>Câu Chuyện Thương Hiệu</span>
        </span>
        <h1 className="about-hero-title">Gìn Giữ Hạt Nông Sản Thuần Bản Địa</h1>
        <p className="about-hero-lead">
          Chúng tôi không tìm kiếm sự hào nhoáng công nghiệp, mà kiên định đồng hành cùng người nông dân giữ gìn giống hạt bản địa và phương pháp ép mộc cối đá cổ truyền.
        </p>
      </div>

      {/* 2-Column Asymmetric Story Section */}
      <div className="about-story-section desktop-about-story">
        {/* Left Column: Story narrative */}
        <div className="about-story-text">
          <span className="about-story-eyebrow">TÂM HUYẾT XƯỞNG ÉP</span>
          <h2 className="about-story-title">Từ Vạt Đất Phù Sa Đến Gian Bếp Ấm Lành</h2>
          <p className="about-story-p">
            HM Naturals ra đời tại vùng bãi bồi sông Đáy nơi đất cát pha màu mỡ nuôi dưỡng những mẻ lạc sẻ đỏ vỏ mỏng, giàu dầu và nức tiếng thơm bùi.
          </p>
          <p className="about-story-p">
            Nhận thấy người tiêu dùng ngày càng lo ngại trước dầu ăn công nghiệp tinh luyện nhiều hóa chất, xưởng chọn con đường ép cơ học chậm tự nhiên — giữ nguyên độ sánh, sắc vàng mật ong và hương vị mộc chân thật nhất.
          </p>
          <div className="about-tags-row">
            <span className="about-tag-pill">🌱 Ép cơ học chậm</span>
            <span className="about-tag-pill">🪨 Lọc vải mộc 48h</span>
            <span className="about-tag-pill">🏺 Chai thủy tinh hổ phách</span>
          </div>
        </div>

        {/* Right Column: Premium Showcase Bottle Card */}
        <div className="about-bottle-card">
          <div className="about-bottle-glow" />
          <svg className="about-bottle-svg" viewBox="180 50 240 370" xmlns="http://www.w3.org/2000/svg">
            <radialGradient id="aboutDeskG" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#FFE8C2" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#E8CEB0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F2EADF" stopOpacity="0" />
            </radialGradient>
            <ellipse cx="300" cy="400" rx="90" ry="16" fill="#3D3024" opacity="0.22" />
            <path
              d="M245 105 h110 v35 l30 55 v180 c0 16 -12 28 -28 28 h-114 c-16 0 -28 -12 -28 -28 v-180 l30 -55 z"
              fill="#8C4E15"
            />
            <path
              d="M252 195 h96 v170 c0 12 -10 22 -22 22 h-52 c-12 0 -22 -10 -22 -22 z"
              fill="#D98A2B"
              opacity="0.95"
            />
            <path d="M256 198 v165" stroke="#FFFFFF" strokeWidth="6" opacity="0.45" strokeLinecap="round" />
            <path d="M344 205 v158" stroke="#FFE7BA" strokeWidth="3.5" opacity="0.4" strokeLinecap="round" />
            <rect x="268" y="65" width="64" height="42" rx="5" fill="#422915" />
            <rect x="272" y="70" width="56" height="8" rx="2" fill="#C88B3A" opacity="0.85" />
            <rect x="256" y="220" width="88" height="135" rx="4" fill="#FAF6EE" stroke="#D9CDBF" />
            <text
              x="300"
              y="246"
              fontFamily="'Playfair Display', serif"
              fontSize="10.5"
              fontWeight="bold"
              fill="#26402F"
              textAnchor="middle"
              letterSpacing="1"
            >
              HM NATURALS
            </text>
            <line x1="268" y1="254" x2="332" y2="254" stroke="#C88B3A" strokeWidth="1.2" />
            <circle cx="300" cy="278" r="14" fill="#F0E5D4" stroke="#7A4B13" strokeWidth="1" />
            <text x="300" y="283" fontFamily="sans-serif" fontSize="12" textAnchor="middle">
              🥜
            </text>
            <text
              x="300"
              y="310"
              fontFamily="'Playfair Display', serif"
              fontSize="9"
              fontWeight="bold"
              fill="#221A14"
              textAnchor="middle"
            >
              DẦU ĐẬU PHỘNG
            </text>
            <text
              x="300"
              y="324"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="7"
              fontWeight="600"
              fill="#474E2B"
              textAnchor="middle"
              letterSpacing="1"
            >
              ÉP CƠ HỌC MỘC
            </text>
            <text
              x="300"
              y="340"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="7"
              fill="#7A4B13"
              textAnchor="middle"
            >
              500ml • Chai Thủy Tinh
            </text>
          </svg>
          <div className="about-bottle-caption">500ml • Chai Thủy Tinh Hổ Phách</div>
          <div className="about-quote-box">
            &ldquo;Mỗi giọt dầu là kết tinh của mùa vụ bản địa và bàn tay người ép mộc.&rdquo;
          </div>
        </div>
      </div>

      {/* 3 Core Values Section */}
      <div className="about-values-section desktop-about-values">
        <div className="about-values-head">
          <span className="about-values-eyebrow">CAM KẾT PHẨM CHẤT</span>
          <h2 className="about-values-title">Ba Giá Trị Cốt Lõi</h2>
          <p className="about-values-desc">
            Nền tảng định hình mọi quyết định của xưởng, từ khâu chọn hạt đến lúc đóng chai.
          </p>
        </div>

        <div className="about-values-grid">
          <div className="about-value-card">
            <div className="about-value-card-head">
              <div className="about-value-icon">🛡️</div>
              <span className="about-value-num">01</span>
            </div>
            <h3 className="about-value-name">Trung Thực</h3>
            <p className="about-value-text">
              100% nguyên chất từ hạt mộc. Tuyệt đối không pha trộn dầu cọ rẻ tiền, không chất bảo quản, không phụ gia khử mùi hay chất tạo màu hóa học.
            </p>
          </div>

          <div className="about-value-card">
            <div className="about-value-card-head">
              <div className="about-value-icon">🌾</div>
              <span className="about-value-num">02</span>
            </div>
            <h3 className="about-value-name">Bản Địa</h3>
            <p className="about-value-text">
              Thu mua nông sản trực tiếp từ bà con nông dân với giá bao tiêu công bằng, góp phần bảo tồn các giống hạt bản địa như lạc sẻ đỏ, mè đen nương đồi.
            </p>
          </div>

          <div className="about-value-card">
            <div className="about-value-card-head">
              <div className="about-value-icon">🌿</div>
              <span className="about-value-num">03</span>
            </div>
            <h3 className="about-value-name">Bền Vững</h3>
            <p className="about-value-text">
              Tôn trọng môi trường từ khâu đóng chai thủy tinh sẫm màu tái sử dụng được, đến việc tận dụng phụ phẩm bã đậu làm thức ăn gia súc và phân bón hữu cơ.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
