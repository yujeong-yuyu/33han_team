// src/routes/Detail.js
import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import "../css/Detail.css";

import { IoSearch, IoHeartOutline, IoCartOutline } from "react-icons/io5";
import { HiOutlineUser } from "react-icons/hi";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoMdClose } from "react-icons/io";
import { AiOutlineMinus } from "react-icons/ai";
import { GoPlus } from "react-icons/go";

import catalog from "../data/detailData.json";
import { NavLink, useParams, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Search from "../components/Search.js";
import KakaoMap from "../components/KakaoMap";

// 🛒 장바구니
import { addToCart } from "../utils/cart";

// 🎁 보상 포인트/쿠폰
import { getRewards, LS_REWARDS } from "../utils/rewards";
import { SESSION_KEY } from "../utils/localStorage";

export default function Detail() {
  // ---------- Auth ----------
  const { isLoggedIn, logoutAll, user } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logoutAll();
    navigate("/", { replace: true });
  };
  const isAuthed = !!isLoggedIn?.local;

  // ---------- Refs ----------
  const headerRef = useRef(null);
  const navRef = useRef(null);
  const gridRef = useRef(null);
  const rightRef = useRef(null);
  const buybarRef = useRef(null);

  const imgRef = useRef(null);
  const parcelRef = useRef(null);
  const refundRef = useRef(null);
  const sellerRef = useRef(null);
  const reviewRef = useRef(null);
  const rvModalRef = useRef(null);

  // ---------- State ----------
  const [navOpen, setNavOpen] = useState(false);
  const [optOpen, setOptOpen] = useState(false);
  const [open, setOpen] = useState(false); // 검색 모달
  const [reviewModal, setReviewModal] = useState({
    open: false,
    name: "",
    stars: "",
    score: "",
    text: "",
    thumb: "",
  });

  // ⭐ 별점 상태
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  // 🛒 장바구니 모달
  const [showModal, setShowModal] = useState(false);

  // 🎁 보상
  const [uid, setUid] = useState(null);
  const [couponCount, setCouponCount] = useState(0);
  const [points, setPoints] = useState(0);

  // ---------- Router ----------
  const { slug, id } = useParams();
  const key = slug ?? id ?? null;
  const location = useLocation();
  const alertedRef = useRef(false);

  // ---------- Helpers ----------
  const img = useCallback((p) => {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    return process.env.NODE_ENV === "production"
      ? `https://00anuyh.github.io/SouvenirImg${p}`
      : `${process.env.PUBLIC_URL}${p}`;
  }, []);

  // ✅ slug/id로 active 찾기
  const active = useMemo(() => {
    const fromState = location.state?.product || location.state;
    if (fromState?.id || fromState?.slug || fromState?.product?.slug) {
      return fromState;
    }
    const list = Array.isArray(catalog)
      ? catalog
      : catalog?.items
      ? catalog.items
      : catalog && typeof catalog === "object"
      ? Object.values(catalog)
      : [];
    const k = key ? String(key) : null;
    const found = list.find((item) => {
      const iid = String(item.id ?? item.product?.id ?? "");
      const islug = String(item.slug ?? item.product?.slug ?? "");
      return k && (islug === k || iid === k);
    });
    return found || null;
  }, [key, location.state]);

  // 안전 접근
  const product = active?.product ?? active ?? {};

  const gallery = useMemo(() => (active?.gallery ?? []).map(img), [active, img]);
  const tabLabels = useMemo(
    () => active?.tabs ?? ["상품이미지", "배송안내", "교환/환불안내", "판매자정보", "리뷰"],
    [active]
  );
  const targets = useMemo(() => [imgRef, parcelRef, refundRef, sellerRef, reviewRef], []);

  // 🔧 판매자 주소 추출 (사업장소재지)
  const sellerAddr = useMemo(() => {
    const rows = active?.seller || [];
    const hit = rows.find(([th]) => th === "사업장소재지");
    return hit?.[1] || "";
  }, [active]);

  // ---------- 스크롤/레이아웃 ----------
  useEffect(() => {
    document.body.style.overflow = navOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  const scrollToTarget = useCallback(
    (idx) => {
      const headerH = headerRef.current?.offsetHeight || 0;
      const t = targets[idx]?.current;
      if (!t) return;
      const top = t.getBoundingClientRect().top + window.pageYOffset - headerH - 10;
      window.scrollTo({ top, behavior: "smooth" });
    },
    [targets]
  );

  const openReviewModal = useCallback((itemEl) => {
    if (!itemEl) return;
    const name = itemEl.querySelector(".rv-name")?.textContent?.trim() || "";
    const stars = itemEl.querySelector(".rv-stars-static")?.textContent?.trim() || "";
    const score = itemEl.querySelector(".rv-score")?.textContent?.trim() || "";
    const thumb = itemEl.querySelector(".rv-thumb")?.getAttribute("src") || "";
    const copy = itemEl.querySelector(".rv-excerpt")?.cloneNode(true);
    copy?.querySelector(".rv-more")?.remove();
    const text = copy?.textContent?.trim() || "";
    setReviewModal({ open: true, name, stars, score, text, thumb });
  }, []);

  // 구매바/푸터 보정
  const recalcBuybar = useCallback(() => {
    const buy = buybarRef.current;
    if (!buy) return;
    const h = buy.offsetHeight || 64;
    document.documentElement.style.setProperty("--buybar-h", `${h}px`);
    const footer = document.querySelector("footer");
    if (footer) {
      const st = window.pageYOffset || document.documentElement.scrollTop || 0;
      const vh = window.innerHeight || 0;
      const ft = footer.getBoundingClientRect().top + window.pageYOffset;
      const overlap = Math.max(0, st + vh - ft);
      buy.style.transform = `translate3d(0, ${-overlap}px, 0)`;
    } else {
      buy.style.transform = "translate3d(0,0,0)";
    }
  }, []);

  useEffect(() => {
    recalcBuybar();
    const onScrollResize = () => requestAnimationFrame(recalcBuybar);
    window.addEventListener("scroll", onScrollResize);
    window.addEventListener("resize", onScrollResize);
    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
    };
  }, [recalcBuybar]);

  useLayoutEffect(() => {
    const r1 = requestAnimationFrame(recalcBuybar);
    const r2 = requestAnimationFrame(recalcBuybar);
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, [optOpen, recalcBuybar]);

  useEffect(() => {
    if (!buybarRef.current) return;
    const ro = new ResizeObserver(() => recalcBuybar());
    ro.observe(buybarRef.current);
    return () => ro.disconnect();
  }, [recalcBuybar]);

  // ESC로 닫기(사이드/리뷰/장바구니모달)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setNavOpen(false);
        setReviewModal((prev) => ({ ...prev, open: false }));
        setShowModal(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // 오른쪽 패널 멈춤 보정
  const clampAside = useCallback(() => {
    const aside = rightRef.current;
    const seller = sellerRef.current;
    if (!aside || !seller) return;

    const topStr = window.getComputedStyle(aside).top;
    let topOffset = parseFloat(topStr) || 0;
    if (/%$/.test(topStr)) {
      topOffset = (parseFloat(topStr) / 100) * window.innerHeight;
    }

    const asideH = aside.offsetHeight || 0;
    const sellerBottom = seller.getBoundingClientRect().bottom + window.pageYOffset;

    const st = window.pageYOffset || 0;
    const desiredTop = st + topOffset;
    const overflow = Math.max(0, desiredTop + asideH - sellerBottom);

    aside.style.transform = `translateY(${-overflow}px)`;
  }, []);

  useEffect(() => {
    clampAside();
    const onScrollResize = () => requestAnimationFrame(clampAside);
    window.addEventListener("scroll", onScrollResize);
    window.addEventListener("resize", onScrollResize);

    const imgs = Array.from(document.querySelectorAll(".detail-left img"));
    const onImgLoad = () => clampAside();
    imgs.forEach((imgEl) => {
      if (imgEl.complete) return;
      imgEl.addEventListener("load", onImgLoad, { once: true });
    });

    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      imgs.forEach((imgEl) => imgEl.removeEventListener?.("load", onImgLoad));
    };
  }, [clampAside]);

  // ---------- 보상 포인트/쿠폰 ----------
  const getUid = useCallback(() => {
    try {
      const s = JSON.parse(localStorage.getItem(SESSION_KEY));
      return s?.username ?? s?.userid ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setUid(getUid());
  }, [isLoggedIn, getUid]);

  useEffect(() => {
    if (!uid) {
      setCouponCount(0);
      setPoints(0);
      return;
    }
    const r = getRewards(uid);
    setCouponCount(r.coupons || 0);
    setPoints(r.points || 0);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const keyToWatch = `${LS_REWARDS}:${uid}`;
    const onStorage = (e) => {
      if (e.key === keyToWatch) {
        const r = getRewards(uid);
        setCouponCount(r.coupons || 0);
        setPoints(r.points || 0);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [uid]);

  // ===== 수량/총합 & 장바구니/바로구매 =====
  const parsePriceKRWLocal = (v) =>
    Number(String(v ?? 0).replace(/[^\d.-]/g, "")) || 0;

  const formatKRW = (n) =>
    new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(n);

  const basePrice = useMemo(() => parsePriceKRWLocal(product.price), [product.price]);
  const [qty, setQty] = useState(1);
  const total = useMemo(() => basePrice * qty, [basePrice, qty]);

  const decQty = useCallback(() => setQty((q) => Math.max(1, q - 1)), []);
  const incQty = useCallback(() => setQty((q) => q + 1), []);
  const onQtyInput = useCallback((e) => {
    const onlyNum = e.target.value.replace(/[^\d]/g, "");
    setQty(onlyNum === "" ? 1 : Math.max(1, Number(onlyNum)));
  }, []);

  const handleAddToCart = useCallback(() => {
    const orderItem = {
      id: active?.id ?? product?.id ?? product?.slug ?? String(key ?? ""),
      slug: active?.slug ?? product?.slug ?? String(key ?? ""),
      name: product?.name ?? "",
      price: basePrice,
      basePrice,
      optionId: null,
      optionLabel: "기본 구성",
      thumb: gallery?.[0] ?? "",
      delivery: 0,
    };
    addToCart(orderItem, qty);
    setShowModal(true);
  }, [active?.id, active?.slug, basePrice, gallery, key, product?.id, product?.name, product?.slug, qty]);

  const handleBuyNow = useCallback(() => {
    const checkoutItem = {
      id: active?.id ?? product?.id ?? product?.slug ?? String(key ?? ""),
      slug: active?.slug ?? product?.slug ?? String(key ?? ""),
      name: product?.name ?? "",
      price: basePrice,
      quantity: qty,
      lineTotal: basePrice * qty,
      optionId: null,
      optionLabel: "기본 구성",
      thumb: gallery?.[0] ?? "",
      delivery: 0,
    };
    navigate("/payment", {
      state: {
        items: [checkoutItem],
        subtotal: basePrice * qty,
        delivery: 0,
        total: basePrice * qty,
        from: "detail",
      },
    });
  }, [active?.id, active?.slug, basePrice, gallery, key, navigate, product?.id, product?.name, product?.slug, qty]);

  // ---------- active 없을 때: 알럿 + 이동 ----------
  useEffect(() => {
    if (!active && !alertedRef.current) {
      alertedRef.current = true;
      alert("등록된 페이지가 없습니다.");
      navigate(-1);
    }
  }, [active, navigate]);

  if (!active) return null;

  // ---------- Render ----------
  return (
    <div className="detail-warp1">
      <header id="detail-header" ref={headerRef}>
        <div id="header-left">
          <button
            id="hamburger"
            type="button"
            aria-expanded={navOpen}
            aria-label={navOpen ? "메뉴 닫기" : "메뉴 열기"}
            onClick={() => setNavOpen((v) => !v)}
          >
            {navOpen ? <IoMdClose size={22} /> : <GiHamburgerMenu size={22} />}
          </button>

          <div id="detail-tap" className="detail-tabs">
            {tabLabels.map((t, idx) => (
              <button type="button" key={`tab-${t}-${idx}`} onClick={() => scrollToTarget(idx)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <NavLink to="/" className={({ isActive }) => (isActive ? "active" : undefined)} id="detail-logo">
          <img src="/img/logo.png" alt="logo" />
        </NavLink>

        <div id="header-right">
          <NavLink
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setOpen(true);
            }}
            className={({ isActive }) => (isActive ? "active" : undefined)}
            aria-label="검색 열기"
          >
            <IoSearch size={22} />
          </NavLink>

          <NavLink to="/MyPage" className={({ isActive }) => (isActive ? "active" : undefined)}>
            <HiOutlineUser />
          </NavLink>
          <NavLink to="/Favorites" className={({ isActive }) => (isActive ? "active" : undefined)}>
            <IoHeartOutline />
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => (isActive ? "active" : undefined)}>
            <IoCartOutline />
          </NavLink>

          {isAuthed ? (
            <button
              type="button"
              className="login_btn"
              onClick={handleLogout}
              aria-label="로그아웃"
              title="로그아웃"
            >
              <p>로그아웃</p>
            </button>
          ) : (
            <div className="login_btn_li">
              <NavLink to="/Login" className={({ isActive }) => (isActive ? "active" : undefined)}>
                로그인
              </NavLink>
            </div>
          )}
        </div>
      </header>

      {/* SIDE NAV */}
      <nav id="detail-nav" className={navOpen ? "open" : ""} ref={navRef}>
        <ul id="detail-menu1">
          <li className="hamprofile">
            <p>
              <span>{isLoggedIn?.local ? `${user?.name}님` : "회원님"}</span>
            </p>
            <p>
              적립금 <span>{points} p</span>
            </p>
            <p>
              사용 가능 쿠폰 : <span>{couponCount}장</span>
            </p>
          </li>
          <li>
            <NavLink to="/lifestyle" className={({ isActive }) => (isActive ? "active" : undefined)}>
              LIFESTYLE
            </NavLink>
          </li>
          <li>
            <NavLink to="/lighting" className={({ isActive }) => (isActive ? "active" : undefined)}>
              LIGHTING
            </NavLink>
          </li>
          <li>
            <NavLink to="/Objects" className={({ isActive }) => (isActive ? "active" : undefined)}>
              OBJECTS
            </NavLink>
          </li>
          <li>
            <NavLink to="/Community" className={({ isActive }) => (isActive ? "active" : undefined)}>
              COMMUNITY
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* MAIN */}
      <main id="detailPage">
        <div className="detail-grid" ref={gridRef}>
          {/* 왼쪽 */}
          <section className="detail-left">
            <div className="detail-img" ref={imgRef}>
              {gallery.map((src, i) => (
                <img key={`g-${i}`} src={src} alt={`detail-${i + 1}`} />
              ))}
            </div>

            <div className="detail-inpo detail-parcel" ref={parcelRef}>
              <h3 className="detail-info-title">배송</h3>
              <table className="detail-info-table">
                <tbody>
                  {(active.shipping || []).map(([th, td]) => (
                    <tr key={`ship-${th}`}>
                      <th>{th}</th>
                      <td>{td}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="detail-inpo detail-refund" ref={refundRef}>
              <h3 className="detail-info-title">교환/환불</h3>
              <table className="detail-info-table">
                <tbody>
                  {(active.refund || []).map(([th, td]) => (
                    <tr key={`refund-${th}`}>
                      <th>{th}</th>
                      <td>{td}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h4 className="detail-info-subtitle">반품/교환 사유에 따른 요청 가능 기간</h4>
              <ol className="detail-info-list">
                {(active.refundGuides?.period || []).map((li, idx) => (
                  <li key={`period-${idx}`}>{li}</li>
                ))}
              </ol>

              <h4 className="detail-info-subtitle">반품/교환 불가 사유</h4>
              <ol className="detail-info-list">
                {(active.refundGuides?.notAllowed || []).map((li, idx) => (
                  <li key={`na-${idx}`}>{li}</li>
                ))}
              </ol>
            </div>

            <div className="detail-inpo seller" ref={sellerRef}>
              <h3 className="detail-info-title">판매자 정보</h3>
              <table className="detail-info-table">
                <tbody>
                  {(active.seller || []).map(([th, td], i) => {
                    if (td === "지도가져오기") {
                      return (
                        <tr key={`map-${i}`} className="seller-map-row">
                          <td colSpan={2} className="seller-map-cell">
                            <KakaoMap
                              className="seller-map"
                              address={sellerAddr}
                              level={3}
                              markerTitle="사업장 위치"
                              style={{ height: "300px" }}
                            />
                          </td>
                        </tr>
                      );
                    }
                    if (!th && !td) return null;
                    return (
                      <tr key={`${th || "row"}-${i}`}>
                        <th>{th}</th>
                        <td>{td}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="detail-inpo detail-review" id="review" ref={reviewRef}>
              <h3 className="detail-info-title">리뷰</h3>

              <form className="rv-form" onSubmit={(e) => e.preventDefault()}>
                <div className="rv-top">
                  <div className="rv-avatar lg" aria-hidden="true" />
                  <div className="rv-meta">
                    <p className="rv-nick">{isLoggedIn?.local ? `${user?.name}님` : "회원님"}</p>

                    {/* ⭐ 별점 입력 */}
                    <div className="rv-stars" role="radiogroup" aria-label="별점 선택">
                      {[1, 2, 3, 4, 5].map((v) => {
                        const display = hover || rating;
                        const filled = display >= v;
                        return (
                          <button
                            type="button"
                            key={`star-${v}`}
                            className={`star ${filled ? "on" : ""}`}
                            role="radio"
                            aria-checked={rating === v}
                            aria-label={`${v}점`}
                            onMouseEnter={() => setHover(v)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => setRating(v)}
                            onKeyDown={(e) => {
                              if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                                e.preventDefault();
                                setRating((r) => Math.min(5, (r || 0) + 1));
                              } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                                e.preventDefault();
                                setRating((r) => Math.max(1, (r || 1) - 1));
                              }
                            }}
                          >
                            {filled ? "★" : "☆"}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="rv-photo-btn">
                    <input type="file" accept="image/*" hidden />
                    <span>사진첨부하기</span>
                  </label>
                </div>

                <textarea className="rv-text" placeholder="솔직한 후기를 작성해주세요. (최소 10자)" />
                <button className="rv-submit" type="submit">
                  등록하기
                </button>
              </form>

              <div className="rv-filter">
                <button className="detail-on" type="button">
                  최신순
                </button>
                <button type="button">평점 높은순</button>
                <button type="button">평점 낮은순</button>
                <button type="button">사진 리뷰만 보기</button>
              </div>

              <ul className="rv-list">
                {(active.reviews || []).map((rv, idx) => (
                  <li className="rv-item" key={`rv-${idx}`}>
                    <div className="rv-head">
                      <div className="rv-avatar" aria-hidden="true" />
                      <div>
                        <p className="rv-name">{rv.name}</p>
                        <p className="rv-starline">
                          <span className="rv-stars-static">{rv.stars}</span>
                          <span className="rv-score">{rv.score}</span>
                        </p>
                      </div>
                    </div>
                    <div className="rv-body">
                      <img
                        className="rv-thumb"
                        src={img(rv.thumb)}
                        alt="리뷰 사진"
                        onClick={(e) => openReviewModal(e.currentTarget.closest(".rv-item"))}
                      />
                      <p className="rv-excerpt">
                        {rv.excerpt}
                        <a
                          href="#none"
                          className="rv-more"
                          onClick={(e) => {
                            e.preventDefault();
                            openReviewModal(e.currentTarget.closest(".rv-item"));
                          }}
                        >
                          [더보기]
                        </a>
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 오른쪽 패널 */}
          <aside className="detail-right" ref={rightRef}>
            <div className="detail-text">
              <div className="detail-brand">{product.brand}</div>
              <h1 className="detail-name">{product.name}</h1>
              <div className="detail-price">{product.price}</div>
              <p className="detail-desc">{product.desc}</p>
              <h4 className="detail-subhead">Details</h4>
              <ul className="detail-list">
                {(product.details || []).map((d) => (
                  <li key={`d-${d.label}`}>
                    <strong>{d.label}</strong>: {d.value}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {/* 구매바 */}
        <div id="detail-buybar" className="detail-buybar" ref={buybarRef}>
          <div className="detail-buybar-box">
            <div className="db-left">
              <p className="detail-buybar-title">{product.name}</p>
              <p className="detail-buybar-price">{product.price}</p>

              <div className="detail-option" style={{ display: optOpen ? "block" : "none" }}>
                <div className="detail-actions">
                  {/* CART → 모달 */}
                  <button className="detail-cartBtn" type="button" onClick={handleAddToCart}>
                    CART
                  </button>
                  {/* BUY → 체크아웃 */}
                  <button className="detail-buyBtn" type="button" onClick={handleBuyNow}>
                    BUY
                  </button>
                </div>
              </div>
            </div>

            <div className="detail-buybar-right">
              <button
                className="detail-buybar-actions"
                type="button"
                aria-expanded={optOpen}
                onClick={() => {
                  setOptOpen((v) => !v);
                  requestAnimationFrame(recalcBuybar);
                }}
              >
                <p className="caret">
                  <span className="caretSpan">OPTION</span>
                  {optOpen ? "▼" : "▲"}
                </p>
              </button>

              <div className="detail-option" style={{ display: optOpen ? "block" : "none" }}>
                <div className="detail-qty">
                  <button className="qty-btn" type="button" onClick={decQty}>
                    <AiOutlineMinus />
                  </button>

                  <input
                    className="qty-input"
                    type="text"
                    inputMode="numeric"
                    value={qty}
                    onChange={onQtyInput}
                  />

                  <button className="qty-btn" type="button" onClick={incQty}>
                    <GoPlus />
                  </button>
                </div>

                <p className="detail-total">
                  총합 {"\u00A0\u00A0"} {formatKRW(total)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 리뷰 모달 */}
      <aside
        id="rv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rvm-title"
        ref={rvModalRef}
        style={{ display: reviewModal.open ? "block" : "none" }}
      >
        <button
          type="button"
          className="rvm-close"
          aria-label="닫기"
          onClick={() => setReviewModal((p) => ({ ...p, open: false }))}
        >
          ×
        </button>
        <div className="rvm-hero-wrap">
          {reviewModal.thumb ? <img className="rvm-hero" src={reviewModal.thumb} alt="리뷰 이미지" /> : null}
        </div>
        <div className="rvm-head">
          <div className="rvm-avatar" aria-hidden="true" />
          <div className="rvm-meta">
            <h4 id="rvm-title" className="rvm-name">{reviewModal.name}</h4>
            <p className="rvm-starline">
              <span className="rvm-stars">{reviewModal.stars} {reviewModal.score}</span>
            </p>
          </div>
        </div>
        <div className="rvm-body">
          <p className="rvm-text">{reviewModal.text}</p>
        </div>
      </aside>

      {/* 사이드메뉴 배경 */}
      {navOpen && <div className="nav-backdrop" aria-hidden="true" onClick={() => setNavOpen(false)} />}

      {/* 🔔 장바구니 모달 */}
      {showModal && (
        <div
          className="cart-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cart-modal-title"
          onClick={() => setShowModal(false)}
        >
          <div
            className="cart-modal-content"
            onClick={(e) => e.stopPropagation()}
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

      {/* 검색 모달 */}
      <Search open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
