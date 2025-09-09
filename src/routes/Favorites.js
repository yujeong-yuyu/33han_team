import styled from "styled-components";
import "../css/favorite.css";
import React from "react";
import { Link } from "react-router-dom";
import { useFavs } from "../context/FavContext";

function formatPrice(value, { withSymbol = true } = {}) {
  if (value == null) return withSymbol ? "₩0" : "0";
  const num =
    typeof value === "number"
      ? value
      : Number(String(value).replace(/[^\d.-]/g, ""));
  if (!Number.isFinite(num)) return withSymbol ? "₩0" : "0";
  if (withSymbol) {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(num);
  }
  return num.toLocaleString("ko-KR", { maximumFractionDigits: 0 });
}

const LikeBox = styled.div``; // 필요하면 스타일 추가

const Favorites = () => {
  const { favs, toggleFav, hasFav } = useFavs();

  // ICONS
  const HEART = (filled = false) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12.1 21s-6.4-4.2-9-6.8A5.8 5.8 0 0 1 12 6a5.8 5.8 0 0 1 8.9 8.3c-2.6 2.7-8.8 6.7-8.8 6.7z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const BAG = (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 8h12l-1.2 12H7.2L6 8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );

  // 장바구니 클릭 핸들러 (프로젝트에 Cart 컨텍스트가 있으면 여기서 연결해줘)
  const addToCart = (p) => {
    // TODO: useCart().add(p) 등으로 연결
    console.log("장바구니 담기!", p.id, p.slug);
  };

  return (
    <LikeBox>
      <div className="fav-wrap">
        <div className="fav-container">
          <div className="toptitle">
            <div className="titleleft" />
            <h2>Favorites</h2>
            <div className="titleright" />
          </div>

          {favs.length === 0 ? (
            <p style={{ padding: "24px 0" }}>
              즐겨찾기한 상품이 없어요. 카테고리에서 ♥ 를 눌러 추가해보세요.
            </p>
          ) : (
            <ul className="product-grid">
              {favs.map((p) => {
                const isFav = hasFav(p.id);

                return (
                  <li className="product-card" key={p.id}>
                    <Link to={`/detail/${p.slug}`} className="product-media">
                      <img src={p.src} alt={p.name} loading="lazy" />
                      {p.soldout && <span className="badge soldout" aria-hidden="true" />}

                      {/* 텍스트 캡션 */}
                      <div className="product-caption">
                        <span className="product-name">{p.name}</span>
                        <span className="product-price">{formatPrice(p.price)}</span>
                      </div>
                    </Link>

                    {/* ♥ 즐겨찾기 토글 */}
                    <button
                      className="icon-btn like"
                      type="button"
                      aria-pressed={isFav ? "true" : "false"}
                      aria-label={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                      title={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleFav(p);
                      }}
                    >
                      {HEART(isFav)}
                    </button>

                    {/* 🛍 장바구니 담기 */}
                    <button
                      className="icon-btn cart"
                      type="button"
                      aria-label="장바구니 담기"
                      title="장바구니 담기"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        addToCart(p);
                      }}
                    >
                      {BAG}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </LikeBox>
  );
};

export default Favorites;
