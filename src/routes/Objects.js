import "../css/Objects.css";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { IoIosArrowDown } from "react-icons/io";
import { Link, useNavigate } from "react-router-dom";
import { useFavs } from "../context/FavContext";
import { addToCart, parsePriceKRW } from "../utils/cart"; // ✅ 추가

/* ───── 가격 포매터: "₩22,000", "22000", 22000 모두 처리 ───── */
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

export default function Objects() {
  const heroRef = useRef(null);
  const [active, setActive] = useState(0);

  const images = useMemo(
    () =>
      Array.from(
        { length: 4 },
        (_, i) => `https://00anuyh.github.io/SouvenirImg/O_ban1img${i + 1}.png`
      ),
    []
  );

  const heroMap = [0, 1, 2, 3];
  const triggersConf = useMemo(
    () =>
      Array.from({ length: 4 }, (_, i) => {
        const num = Math.floor(i / 2) + 1;
        const cls = i % 2 === 0 ? `decor decor-${num}` : `square square-${num}`;
        return {
          cls,
          src: `https://00anuyh.github.io/SouvenirImg/O_ban2img${i + 1}.png`,
          hero: heroMap[i],
        };
      }),
    []
  );

  useEffect(() => {
    const scope = heroRef.current;
    if (!scope) return;

    let order = Array.from(scope.querySelectorAll(".decor, .square"));

    const BASE_RIGHT = 800;
    const CC_GAP = 60;

    const applyPositions = () => {
      const widths = order.map((el) => el.getBoundingClientRect().width);
      let r = BASE_RIGHT;

      order.forEach((el, i) => {
        if (i !== 0) {
          r += widths[i - 1] / 2 + widths[i] / 2 + CC_GAP;
        }
        el.style.position = "absolute";
        el.style.top = "50%";
        el.style.left = `${r}px`;
      });
    };

    applyPositions();

    const onClick = (e) => {
      const btn = e.target.closest(".decor, .square");
      if (!btn || !scope.contains(btn)) return;
      e.preventDefault();

      const to = Number(btn.dataset.hero);
      setActive((prev) =>
        Number.isNaN(to)
          ? (prev + 1) % images.length
          : ((to % images.length) + images.length) % images.length
      );

      order = Array.from(scope.querySelectorAll(".decor, .square")).sort(
        (a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0)
      );

      const idx = order.indexOf(btn);
      if (idx === -1) return;

      order = order.slice(idx).concat(order.slice(0, idx));
      applyPositions();
    };

    const onResize = () => {
      order = Array.from(scope.querySelectorAll(".decor, .square")).sort(
        (a, b) => Number(a.dataset.order ?? 0) - Number(b.dataset.order ?? 0)
      );
      applyPositions();
    };

    scope.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);
    return () => {
      scope.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
    };
  }, [images.length]);

  return (
    <>
      <section className="hero" ref={heroRef}>
        <div className="container hero-grid">
          <figure className="hero-main">
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`hero ${i + 1}`}
                className={i === active ? "is-active" : ""}
              />
            ))}
          </figure>

          {triggersConf.map((t, i) => (
            <div key={i} className={t.cls} data-hero={t.hero}>
              <img src={t.src} alt="" />
            </div>
          ))}
        </div>
      </section>
      <ProductList />
    </>
  );
}

function ProductList() {
  const navigate = useNavigate();

  // 디테일 페이지가 준비된 상품 id(슬러그) 예시
  const DETAIL_SLUGS = ["ovject-item-001", "ovject-item-002"];

  const items = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => {
      const slug = DETAIL_SLUGS[i % DETAIL_SLUGS.length];
      return {
        id: `objects-${slug}-${i + 1}`, // ✅ 장바구니/즐겨찾기용 고유 id
        slug,
        name: i % 2 ? "앰버 램프" : "우드 토이",
        price: i % 2 ? "₩49,000" : "₩29,000",
        src: `https://00anuyh.github.io/SouvenirImg/O_sec1img${(i % 9) + 1}.png`,
        soldout: i === 3 || i === 8 || i === 18 || i === 36,
      };
    });
  }, []);

  const STEP = 8;
  const [showing, setShowing] = useState(STEP);

  // ✅ 즐겨찾기 컨텍스트
  const { hasFav, toggleFav } = useFavs();

  // ✅ 토스트(즐겨찾기용 유지)
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1200);
    return () => clearTimeout(t);
  }, [toast]);

  // ✅ 장바구니 모달
  const [showModal, setShowModal] = useState(false);

  // ✅ 장바구니 담기 핸들러 (상품 전달형)
  const handleAdd = (p) => (e) => {
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
        thumb: p.src,
        delivery: 0,
      },
      1
    );

    // 토스트 대신 모달 표시
    setShowModal(true);
  };

  const visible = items.slice(0, showing);

  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">OBJECTS</h2>
        <div className="section-line"></div>

        <ul className="product-grid">
          {visible.map((p) => {
            const isFav = hasFav(p.id);

            return (
              <li className="product-card" key={p.id}>
                {/* 라우트 파라미터로 슬러그 전달 */}
                <Link to={`/detail/${p.slug}`} className="product-media">
                  <img src={p.src} alt={p.name} loading="lazy" />
                  {p.soldout && <span className="badge soldout" aria-hidden="true" />}

                  {/* 텍스트 캡션 */}
                  <div className="product-caption">
                    <span className="product-name">{p.name}</span>
                    <span className="product-price">{formatPrice(p.price)}</span>
                  </div>
                </Link>

                {/* 찜 */}
                <button
                  className="icon-btn like"
                  type="button"
                  aria-pressed={isFav ? "true" : "false"}
                  aria-label={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  title={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFav(p); // p.id로 고유하게 동작
                    setToast(isFav ? "즐겨찾기를 해제했어요" : "즐겨찾기에 추가했어요");
                  }}
                >
                  {/* 아이콘 */}
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M12.1 21s-6.4-4.2-9-6.8A5.8 5.8 0 0 1 12 6a5.8 5.8 0 0 1 8.9 8.3c-2.6 2.7-8.8 6.7-8.8 6.7z"
                      fill={isFav ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>

                {/* 장바구니 */}
                <button
                  className="icon-btn cart"
                  type="button"
                  aria-label="장바구니 담기"
                  title="장바구니 담기"
                  onClick={handleAdd(p)} // ★ 상품 전달
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 8h12l-1.2 12H7.2L6 8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
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

      {/* ✅ 장바구니 모달 (리스트 밖에서 1번만 렌더) */}
      {showModal && (
        <div
          className="cart-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          onClick={() => setShowModal(false)} // 바깥 클릭 닫기
        >
          <div
            className="cart-modal-content"
            onClick={(e) => e.stopPropagation()} // 내부 클릭은 전파 막기
          >
            <p id="cart-modal-title">장바구니에 담았어요!</p>
            <div className="actions">
              <button
                className="btn-primary"
                onClick={() => {
                  setShowModal(false);
                  navigate("/cart");
                }}
              >
                장바구니로 이동
              </button>
              <button className="btn-ghost" onClick={() => setShowModal(false)}>
                쇼핑 계속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ 토스트(즐겨찾기) */}
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          left:"50%",
          bottom: "50%",
          transform: `translate(-50%, ${toast ? "-50%" : "calc(-50% + 6px)"})`,
          background: "#5e472f",
          color: "#fff",
          padding: "10px 14px",
          borderRadius: 8,
          boxShadow: "0 6px 16px rgba(0,0,0,.2)",
          opacity: toast ? 1 : 0,
          transition: "opacity .2s ease, transform .2s ease",
          pointerEvents: "none",
          zIndex: 9999,
        }}
      >
        {toast}
      </div>
    </section>
  );
}