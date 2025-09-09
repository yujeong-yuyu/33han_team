// src/pages/Best.jsx
import React, { useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

import "../css/Best.css";

import { IoIosArrowDown } from "react-icons/io";
import { IoHeartOutline, IoHeart, IoCartOutline } from "react-icons/io5";

// ✅ 컨텍스트/유틸 (LifeStyle과 동일)
import { useFavs } from "../context/FavContext";
import { addToCart, parsePriceKRW } from "../utils/cart";

// ✅ detailData.json 직접 사용
import products from "../data/detailData.json";

export default function Best() {
  const STEP = 12;
  const navigate = useNavigate();

  // 즐겨찾기 컨텍스트
  const { hasFav, toggleFav } = useFavs();

  // 노출 개수
  const [showing, setShowing] = useState(STEP);

  // 즐겨찾기 토스트(중앙)
  const [toast, setToast] = useState("");

  // 장바구니 모달
  const [showModal, setShowModal] = useState(false);

  const slides = [1, 2, 3, 4];

  const resolveImg = (src) => {
    if (!src) return "/img/placeholder.png";
    if (/^https?:\/\//i.test(src)) return src;
    return src.startsWith("/")
      ? src
      : `${process.env.PUBLIC_URL}/${src.replace(/^\.?\//, "")}`;
  };

  // detailData.json → 베스트 카드에 필요한 형태로 매핑
  const items = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.map((it, idx) => ({
      id: it.id ?? String(idx + 1),
      slug: it.id ?? String(idx + 1), // /detail/:slug 에서 사용
      name: it.product?.name ?? "",
      price: it.product?.price ?? "", // 문자열이면 그대로 노출
      image: resolveImg(it.gallery?.[0]),
      soldout: !!it.soldout, // 필드 없으면 false
    }));
  }, []);

  const visible = useMemo(() => items.slice(0, showing), [items, showing]);

  const formatPrice = (price, currency = "KRW") =>
    typeof price === "string"
      ? price
      : new Intl.NumberFormat("ko-KR", { style: "currency", currency }).format(
          price ?? 0
        );

  const HEART = (on) => (on ? <IoHeart /> : <IoHeartOutline />);
  const BAG = <IoCartOutline />;

  // ✅ 장바구니 담기 (LifeStyle과 동일 패턴)
  const handleAdd = useCallback(
    (p) => (e) => {
      e.preventDefault();
      e.stopPropagation();

      const basePrice = parsePriceKRW(p.price);
      addToCart(
        {
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: basePrice,
          basePrice,
          optionId: null,
          optionLabel: "기본 구성",
          thumb: p.image,
          delivery: 0,
        },
        1
      );

      setShowModal(true);
    },
    []
  );

  // ✅ 즐겨찾기 클릭 (LifeStyle 방식: 토스트만)
  const handleLike = useCallback(
    (p, isFav) => (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleFav(p); // p.id 기준으로 토글됨
      setToast(isFav ? "즐겨찾기를 해제했어요" : "즐겨찾기에 추가했어요");
      // 1.2초 뒤 토스트 자동 닫힘
      setTimeout(() => setToast(""), 1200);
    },
    [toggleFav]
  );

  return (
    <>
      <div className="bestBanner">
        <Swiper
          className="mySwiper"
          modules={[Pagination, Autoplay]}
          pagination={{ clickable: true }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          loop
          speed={700}
        >
          {slides.map((n) => (
            <SwiperSlide key={n} className={`bstimg${n}`}>
              {/* 필요시 텍스트 추가 */}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="toptitle">
        <div className="titleleft" />
        <h2>Best</h2>
        <div className="titleright" />
      </div>

      <div className="bestList">
        <ul className="product-grid">
          {visible.map((p, i) => {
            const liked = hasFav(p.id);
            const rank = i + 1;

            return (
              <li className="product-card" key={p.id}>
                {/* 순위 배지(선택) */}
                <span className="rank-badge" aria-hidden="true">
                  {rank}
                </span>

                <Link to={`/detail/${p.slug}`} className="product-media">
                  <img src={p.image} alt={p.name} loading="lazy" />
                  {p.soldout && (
                    <span className="badge soldout" aria-hidden="true">
                      SOLD OUT
                    </span>
                  )}

                  {/* 캡션 */}
                  <div className="product-caption">
                    <span className="product-name">{p.name}</span>
                    <span className="product-price">{formatPrice(p.price)}</span>
                  </div>
                </Link>

                {/* 찜 */}
                <button
                  className="icon-btn like"
                  type="button"
                  aria-pressed={liked ? "true" : "false"}
                  aria-label={liked ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  title={liked ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  onClick={handleLike(p, liked)}
                >
                  {HEART(liked)}
                </button>

                {/* 장바구니 */}
                <button
                  className="icon-btn cart"
                  type="button"
                  aria-label="장바구니 담기"
                  title="장바구니 담기"
                  onClick={handleAdd(p)}
                >
                  {BAG}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="more">
          {showing < items.length && (
            <button
              className="btn-more"
              type="button"
              onClick={() => setShowing((s) => Math.min(s + STEP, items.length))}
            >
              more <IoIosArrowDown className="IoIosArrowDown" />
            </button>
          )}
        </div>
      </div>

      {/* ✅ 장바구니 모달 (LifeStyle과 동일) */}
      {showModal && (
        <div
          className="cart-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            className="cart-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: "20px 22px",
              minWidth: 280,
              maxWidth: "85vw",
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
              textAlign: "center",
            }}
          >
            <p id="cart-modal-title" style={{ fontWeight: 700, marginBottom: 12 }}>
              장바구니에 담았어요!
            </p>
            <div className="actions" style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate("/cart");
                }}
                style={{
                  background: "#5e472f",
                  color: "#fff",
                  border: 0,
                  padding: "10px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                장바구니로 이동
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowModal(false)}
                style={{
                  background: "transparent",
                  color: "#5e472f",
                  border: "1px solid #5e472f",
                  padding: "10px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                쇼핑 계속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 즐겨찾기 토스트 (중앙 정렬, LifeStyle과 동일 규칙) */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, ${toast ? "-50%" : "calc(-50% + 6px)"})`,
          background: "#5e472f",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          boxShadow: "0 6px 16px rgba(0,0,0,.2)",
          opacity: toast ? 1 : 0,
          transition: "opacity .2s ease, transform .2s ease",
          pointerEvents: "none",
          zIndex: 9998,
          textAlign: "center",
          minWidth: 220,
        }}
      >
        {toast}
      </div>
    </>
  );
}
