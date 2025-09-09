// src/components/NewsCard.jsx
import React from "react";

export default function NewsCard({
  img,
  source,
  time,
  title,
  subtitle = "",
  index = 0,
  total = 1,
  onPrev,
  onNext,
}) {
  const sub = (subtitle || "").trim();
  const canNavigate = total > 1;

  return (
    <div
      className="newsCard-min"
      style={{ display: "flex", alignItems: "center", gap: 16 }}
    >
      {/* 이미지 엘리먼트로 렌더 */}
      <img
        className="news-card-img"
        src={img}
        alt={title || "news"}
        loading="lazy"
        style={{ width: 620, height: 311, objectFit: "cover", borderRadius: 10 }}
      />

      {/* 텍스트 영역 */}
      <div className="newsText" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* 매체/시간 */}
        {(source || time) && (
          <div className="news-meta" style={{ fontSize: 12, opacity: 0.7 }}>
            {source && <span>{source}</span>}
            {source && time && <span style={{ margin: "0 6px" }}>·</span>}
            {time && <span>{time}</span>}
          </div>
        )}

        {/* 제목 */}
        <h3 className="news-title" style={{ fontSize: "1.1rem", fontWeight: 600, lineHeight: 1.35, margin: 0, color: "#5E472F" }}>
          {title || ""}
        </h3>

        {/* 서브멘트: 150px에서 말줄임 */}
        <p
          className="news-sub"
          title={sub}
          style={{
            width: 150,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            fontSize: 13,
            lineHeight: 1.3,
            color: "#5E472F",
            opacity: 0.8,
            margin: 0,
          }}
        >
          {sub}
        </p>

        {/* 좌우 네비 + 인덱스 */}
        {canNavigate && (
          <div className="newsNav" style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
            {onPrev && (
              <button
                type="button"
                className="nav prev"
                aria-label="이전"
                onClick={onPrev}
                style={{ background: "transparent", border: "1px solid #C2C4B6", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
              >
                ‹
              </button>
            )}
            {onNext && (
              <button
                type="button"
                className="nav next"
                aria-label="다음"
                onClick={onNext}
                style={{ background: "transparent", border: "1px solid #C2C4B6", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
              >
                ›
              </button>
            )}
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              {String(index + 1).padStart(2, "0")}/{String(total).padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
