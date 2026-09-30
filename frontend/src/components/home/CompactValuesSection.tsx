import React from 'react';

/* SVG icons scoped to compact-val-icon — no emoji */
function IconSeedling() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22V12" />
      <path d="M12 12C12 7 7 4 2 5c0 5 3 9 10 7Z" />
      <path d="M12 12c0-5 5-8 10-7-1 5-4 9-10 7Z" />
    </svg>
  );
}
function IconPress() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
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

export function CompactValuesSection() {
  return (
    <section className="compact-values-section" id="desktopHomeValues" aria-label="Ba giá trị cốt lõi">
      <div className="compact-values-grid">
        <div className="compact-val-card">
          <div className="compact-val-icon"><IconSeedling /></div>
          <div className="compact-val-body">
            <h3 className="compact-val-title">Nguyên Liệu Nông Sản</h3>
            <p className="compact-val-desc">
              Thu mua chọn lọc từ nguồn đậu phộng sẻ và mè bản địa của nông hộ Việt Nam.
            </p>
          </div>
        </div>

        <div className="compact-val-card">
          <div className="compact-val-icon"><IconPress /></div>
          <div className="compact-val-body">
            <h3 className="compact-val-title">Quy Trình Ép Nhiệt</h3>
            <p className="compact-val-desc">
              Quy trình ép cơ học có kiểm soát nhiệt độ giúp dậy mùi thơm mộc và vắt kiệt dầu tự nhiên.
            </p>
          </div>
        </div>

        <div className="compact-val-card">
          <div className="compact-val-icon"><IconBottle /></div>
          <div className="compact-val-body">
            <h3 className="compact-val-title">Chỉn Chu Trong Từng Sản Phẩm</h3>
            <p className="compact-val-desc">
              Lắng lọc tự nhiên qua vải mộc, đóng chai thủy tinh tối màu giúp bảo quản chất lượng nguyên bản.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
