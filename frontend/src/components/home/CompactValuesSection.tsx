import React from 'react';

export function CompactValuesSection() {
  return (
    <section className="compact-values-section" id="desktopHomeValues" aria-label="Ba giá trị cốt lõi">
      <div className="compact-values-grid">
        <div className="compact-val-card">
          <div className="compact-val-icon" aria-hidden="true">🌱</div>
          <div className="compact-val-body">
            <h3 className="compact-val-title">Nguyên Liệu Nông Sản</h3>
            <p className="compact-val-desc">
              Thu mua chọn lọc từ nguồn đậu phộng sẻ và mè bản địa của nông hộ Việt Nam.
            </p>
          </div>
        </div>

        <div className="compact-val-card">
          <div className="compact-val-icon" aria-hidden="true">⚙️</div>
          <div className="compact-val-body">
            <h3 className="compact-val-title">Quy Trình Ép Nhiệt</h3>
            <p className="compact-val-desc">
              Quy trình ép cơ học có kiểm soát nhiệt độ giúp dậy mùi thơm mộc và vắt kiệt dầu tự nhiên.
            </p>
          </div>
        </div>

        <div className="compact-val-card">
          <div className="compact-val-icon" aria-hidden="true">🏺</div>
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
