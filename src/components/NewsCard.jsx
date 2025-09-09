// components/NewsCard.jsx
import React from "react";
import "./NewsCard.css";

export default function NewsCard({
  img,
  source = "중앙일보",
  time = "21시간",
  title = "제목",
  likes = 0,
  comments = 0,
  isSaved = false,
  /** 슬라이드 제어(옵션) */
  onPrev,
  onNext,
  /** 도트 */
  index = 1,
  total = 5,
}) {
  const dots = Array.from({ length: total }, (_, i) => i);

  return (
    <article className="news-card" style={{ ["--img"]: `url(${img})` }}>
      {/* 좌우 내비 */}
      <button className="nav prev" aria-label="이전" onClick={onPrev}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button className="nav next" aria-label="다음" onClick={onNext}>
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* 매체/시간 */}
      <div className="news-meta">
        <span className="logo" aria-hidden="true" />
        <span>{source}</span>
        <span className="sep">·</span>
        <span>{time}</span>
      </div>

      {/* 제목 */}
      <h3 className="news-title">{title}</h3>

      {/* 도트 */}
      <div className="dots" aria-hidden="true">
        {dots.map((d) => (
          <span key={d} className={`dot ${d === index ? "active" : ""}`} />
        ))}
      </div>

      {/* 좌하단 액션 */}
      <div className="news-actions">
        <button className="btn" type="button" aria-label={`좋아요 ${likes}개`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M7 22h-2a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h2m5-5l1 4h7a2 2 0 0 1 2 2v1.5a2 2 0 0 1-.4 1.2l-4.2 5.6a2 2 0 0 1-1.6.7h-7V7a3 3 0 0 1 3-3z" />
          </svg>
          <span>{likes}</span>
        </button>
        <button className="btn" type="button" aria-label={`댓글 ${comments}개`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15a4 4 0 0 1-4 4H7l-4 4V5a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
          </svg>
          <span>{comments}</span>
        </button>
        <button className="btn" type="button" aria-label={isSaved ? "저장됨" : "저장"}>
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* 우하단 배지 */}
      <span className="badge-hot">인기</span>

      {/* 접근성용 */}
      <span className="sr-only">뉴스 카드</span>
    </article>
  );
}
