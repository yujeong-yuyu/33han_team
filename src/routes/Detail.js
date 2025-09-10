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

// 📝 로컬 리뷰 유틸 (수정/삭제 포함)
import {
  getReviewsFor,
  addReviewFor,
  updateReviewFor,
  deleteReviewFor,
  getAuthorId,
} from "../utils/reviews";

export default function Detail() {
  // ---------- Auth ----------
  const { isLoggedIn, logoutAll, user, isAdmin: isAdminFn } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => {
    await logoutAll();
    navigate("/", { replace: true });
  };
  const isAuthed = !!isLoggedIn?.local;

  // ✅ 관리자 여부
  const isAdmin = useMemo(() => {
    try {
      if (typeof isAdminFn === "function") return !!isAdminFn();
    } catch {}
    return !!(
      user?.role === "admin" ||
      user?.isAdmin === true ||
      isLoggedIn?.role === "admin" ||
      isLoggedIn?.admin === true
    );
  }, [isAdminFn, user, isLoggedIn]);

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

  // ⭐ 별점 상태(작성 폼)
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  // 🛒 장바구니 모달
  const [showModal, setShowModal] = useState(false);

  // 🎁 보상
  const [uid, setUid] = useState(null);
  const [couponCount, setCouponCount] = useState(0);
  const [points, setPoints] = useState(0);

  // ✅ 삭제 확인 모달 상태
  const [confirmState, setConfirmState] = useState({
    open: false,
    message: "",
    onConfirm: null,
  });
  // 호출 헬퍼
  const askConfirm = useCallback((message, onYes) => {
    setConfirmState({ open: true, message, onConfirm: onYes });
  }, []);

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

  // ESC로 닫기(사이드/리뷰/장바구니모달/수정모달/확인모달)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setNavOpen(false);
        setReviewModal((prev) => ({ ...prev, open: false }));
        setShowModal(false);
        setEditState((s) => ({ ...s, open: false }));
        setConfirmState((s) => ({ ...s, open: false, onConfirm: null }));
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
  const incQty = useCallback(() => setQty((q) => q + 1), []); // ✅
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

  // ✅ BUY NOW → Payment로 이동
  const handleBuyNow = useCallback(() => {
    const lineItem = {
      id: active?.id ?? product?.id ?? product?.slug ?? String(key ?? ""),
      slug: active?.slug ?? product?.slug ?? String(key ?? ""),
      name: product?.name ?? "",
      unitPrice: basePrice,
      qty,
      delivery: 0,
      thumb: gallery?.[0] ?? product?.image ?? "",
      brand: product?.brand ?? "",
      optionLabel: "기본 구성",
    };

    navigate("/payment", {
      state: {
        lineItems: [lineItem],
        coupon: 0,
        from: "detail",
      },
    });
  }, [basePrice, navigate, product?.name, qty, active?.id, active?.slug, product?.id, product?.slug, key, gallery]);

  // ---------- active 없을 때: 알럿 + 이동 ----------
  useEffect(() => {
    if (!active && !alertedRef.current) {
      alertedRef.current = true;
      alert("등록된 페이지가 없습니다.");
      navigate(-1);
    }
  }, [active, navigate]);

  // ================================
  //         리뷰 작성/표시/수정/삭제
  // ================================
  // 현재 작성자 식별자(로그인 uid 있으면 uid, 없으면 디바이스ID)
  const authorId = useMemo(() => uid || getAuthorId(), [uid]);

  // 작성 폼
  const [rvText, setRvText] = useState("");
  const [rvPhoto, setRvPhoto] = useState(""); // dataURL
  // 정렬/필터 상태
  const [rvSort, setRvSort] = useState("new"); // 'new' | 'high' | 'low'
  const [rvOnlyPhoto, setRvOnlyPhoto] = useState(false);
  // 사용자 저장 리뷰
  const [userReviews, setUserReviews] = useState([]);

  // 이 상품의 key
  const productKey = useMemo(
    () => String(product?.slug || product?.id || key || ""),
    [product?.slug, product?.id, key]
  );

  // 🔒 내장(builtin) 리뷰 숨김 로컬스토리지
  const HIDE_KEY = "builtinHiddenReviews";
  const getHiddenBuiltin = useCallback((k) => {
    try {
      const raw = localStorage.getItem(`${HIDE_KEY}:${k}`);
      const a = JSON.parse(raw || "[]");
      return Array.isArray(a) ? a : [];
    } catch {
      return [];
    }
  }, []);
  const hideBuiltin = useCallback((k, idx) => {
    const a = getHiddenBuiltin(k);
    if (!a.includes(idx)) {
      const next = [...a, idx];
      localStorage.setItem(`${HIDE_KEY}:${k}`, JSON.stringify(next));
    }
  }, [getHiddenBuiltin]);
  const [hiddenTick, setHiddenTick] = useState(0); // 숨김 변경 트리거

  // 로딩
  useEffect(() => {
    setUserReviews(getReviewsFor(productKey));
  }, [productKey]);

  // 파일 -> dataURL (작성 폼)
  const onPickPhoto = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return setRvPhoto("");
    const reader = new FileReader();
    reader.onload = () => setRvPhoto(String(reader.result || ""));
    reader.readAsDataURL(f);
  }, []);

  // 리뷰 모달 열기(읽기)
  const openReviewModalFromData = useCallback((rv) => {
    setReviewModal({
      open: true,
      name: rv.name,
      stars: rv.stars,
      score: rv.score,
      text: rv.excerpt,
      thumb: rv.thumb || "",
    });
  }, []);

  // 작성 제출
  const submitReview = useCallback(() => {
    if (!rating) {
      alert("별점을 선택해주세요.");
      return;
    }
    if ((rvText || "").trim().length < 10) {
      alert("후기는 최소 10자 이상 작성해주세요.");
      return;
    }
    const starsStr = "★★★★★".slice(0, rating) + "☆☆☆☆☆".slice(0, 5 - rating);
    const review = {
      name: isLoggedIn?.local ? `${user?.name}님` : "회원님",
      stars: starsStr,
      score: `${rating}.0`,
      excerpt: rvText.trim(),
      thumb: rvPhoto, // 없으면 ""
      rating,
      createdAt: new Date().toISOString(),
      authorId, // ← 작성자 식별 저장
    };
    const next = addReviewFor(productKey, review);
    setUserReviews(next);

    // ✅ 방금 작성한 리뷰가 바로 맨 위에 보이도록 최신순으로 전환
    setRvSort("new");
    setRvOnlyPhoto(false);

    // 폼 초기화
    setRvText("");
    setRvPhoto("");
    setRating(0);
    setHover(0);

    alert("리뷰가 등록되었습니다.");
  }, [isLoggedIn?.local, productKey, rating, rvPhoto, rvText, user?.name, authorId]);

  // 표시용(내장 + 사용자) + 정렬/필터 (+관리자 숨김 반영)
  const displayReviews = useMemo(() => {
    const hiddenBuiltinIdx = getHiddenBuiltin(productKey);

    const builtin = (active.reviews || []).map((rv, idx) => {
      const numeric =
        Number(rv.score) ||
        (typeof rv.stars === "string" ? rv.stars.replace(/[^★]/g, "").length : 0);
      return {
        name: rv.name,
        stars: rv.stars,
        score: rv.score,
        excerpt: rv.excerpt,
        thumb: img(rv.thumb),
        rating: numeric,
        createdAt: 0,
        _kind: "builtin",
        _idx: idx,
      };
    });

    const users = (userReviews || []).map((rv) => ({
      ...rv,
      createdAt: rv.createdAt ? new Date(rv.createdAt).getTime() : 1,
      _kind: "user",
    }));

    let all = [...users, ...builtin];

    // 관리자 숨김 처리된 내장 리뷰 제거
    all = all.filter((x) => !(x._kind === "builtin" && hiddenBuiltinIdx.includes(x._idx)));

    if (rvOnlyPhoto) {
      all = all.filter((x) => !!x.thumb);
    }

    if (rvSort === "high") {
      all.sort((a, b) => (b.rating - a.rating) || (b.createdAt - a.createdAt));
    } else if (rvSort === "low") {
      all.sort((a, b) => (a.rating - b.rating) || (b.createdAt - a.createdAt));
    } else {
      all.sort((a, b) => (b.createdAt - a.createdAt) || (b.rating - a.rating));
    }

    return all;
  }, [active.reviews, img, rvOnlyPhoto, rvSort, userReviews, productKey, hiddenTick, getHiddenBuiltin]);

  // ====== 수정/삭제 ======
  const [editState, setEditState] = useState({
    open: false,
    id: null,
    rating: 0,
    text: "",
    thumb: "",
  });

  const onPickEditPhoto = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return; // 기존 유지
    const reader = new FileReader();
    reader.onload = () => setEditState((s) => ({ ...s, thumb: String(reader.result || "") }));
    reader.readAsDataURL(f);
  }, []);

  const startEdit = useCallback((rv) => {
    // 본인만
    if (rv._kind !== "user" || rv.authorId !== authorId) {
      alert("내가 작성한 리뷰만 수정할 수 있어요.");
      return;
    }
    setEditState({
      open: true,
      id: rv.id,
      rating: rv.rating || 0,
      text: rv.excerpt || "",
      thumb: rv.thumb || "",
    });
  }, [authorId]);

  const saveEdit = useCallback(() => {
    const { id, rating: r, text, thumb } = editState;
    if (!id) return;
    if (!r) {
      alert("별점을 선택해주세요.");
      return;
    }
    if ((text || "").trim().length < 10) {
      alert("후기는 최소 10자 이상 작성해주세요.");
      return;
    }
    const starsStr = "★★★★★".slice(0, r) + "☆☆☆☆☆".slice(0, 5 - r);
    const next = updateReviewFor(
      productKey,
      id,
      {
        rating: r,
        excerpt: text.trim(),
        thumb,
        stars: starsStr,
        score: `${r}.0`,
      },
      authorId
    );
    setUserReviews(next);
    setEditState({ open: false, id: null, rating: 0, text: "", thumb: "" });
    alert("리뷰가 수정되었습니다.");
  }, [editState, productKey, authorId]);

  const removeReview = useCallback(
    (rv) => {
      const isBuiltin = rv._kind === "builtin";
      const isUserReview = rv._kind === "user";
      const isOwner = rv.authorId === authorId;

      // 내장 리뷰: 관리자만 숨김 처리
      if (isBuiltin) {
        if (!isAdmin) {
          alert("내장 리뷰는 삭제할 수 없습니다.");
          return;
        }
        askConfirm("해당 내장 리뷰를 화면에서 숨길까요? (관리자)", () => {
          hideBuiltin(productKey, rv._idx);
          setHiddenTick((t) => t + 1);
          setConfirmState((s) => ({ ...s, open: false, onConfirm: null }));
        });
        return;
      }

      // 사용자 리뷰: 본인 또는 관리자만 삭제
      if (isUserReview && !(isOwner || isAdmin)) {
        alert("내가 작성한 리뷰만 삭제할 수 있어요.");
        return;
      }

      const delAuthorId = isAdmin ? rv.authorId : authorId;
      askConfirm(isAdmin ? "이 리뷰를 삭제할까요? (관리자)" : "정말 삭제할까요?", () => {
        const next = deleteReviewFor(productKey, rv.id, delAuthorId);
        setUserReviews(next);
        setConfirmState((s) => ({ ...s, open: false, onConfirm: null }));
      });
    },
    [productKey, authorId, isAdmin, askConfirm, hideBuiltin]
  );

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

              {/* 리뷰 작성 폼 */}
              <form
                className="rv-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  submitReview();
                }}
              >
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
                    <input type="file" accept="image/*" hidden onChange={onPickPhoto} />
                    <span>사진첨부하기</span>
                  </label>
                </div>

                {/* 선택 시 간단 미리보기 */}
                {rvPhoto && (
                  <div className="rv-preview">
                    <img src={rvPhoto} alt="첨부 미리보기" style={{ maxWidth: 140, borderRadius: 8, marginTop: 10 }} />
                  </div>
                )}

                <textarea
                  className="rv-text"
                  placeholder="솔직한 후기를 작성해주세요. (최소 10자)"
                  value={rvText}
                  onChange={(e) => setRvText(e.target.value)}
                  minLength={10}
                  required
                />
                <button className="rv-submit" type="submit">
                  등록하기
                </button>
              </form>

              {/* 필터/정렬 */}
              <div className="rv-filter">
                <button
                  className={rvSort === "new" && !rvOnlyPhoto ? "detail-on" : ""}
                  type="button"
                  onClick={() => {
                    setRvSort("new");
                    setRvOnlyPhoto(false);
                  }}
                >
                  최신순
                </button>
                <button
                  className={rvSort === "high" && !rvOnlyPhoto ? "detail-on" : ""}
                  type="button"
                  onClick={() => {
                    setRvSort("high");
                    setRvOnlyPhoto(false);
                  }}
                >
                  평점 높은순
                </button>
                <button
                  className={rvSort === "low" && !rvOnlyPhoto ? "detail-on" : ""}
                  type="button"
                  onClick={() => {
                    setRvSort("low");
                    setRvOnlyPhoto(false);
                  }}
                >
                  평점 낮은순
                </button>
                <button
                  className={rvOnlyPhoto ? "detail-on" : ""}
                  type="button"
                  onClick={() => setRvOnlyPhoto((v) => !v)}
                >
                  사진 리뷰만 보기
                </button>
              </div>

              {/* 리뷰 리스트 */}
              <ul className="rv-list">
                {displayReviews.map((rv, idx) => {
                  const isOwner = rv._kind === "user" && rv.authorId === authorId;
                  const canDelete = isOwner || isAdmin; // ✅ 관리자도 삭제 가능
                  return (
                    <li className="rv-item" key={rv.id || `${rv._kind}-${rv._idx || idx}`}>
                      <div className="rv-head">
                        <div className="rv-avatar" aria-hidden="true" />
                        <div>
                          <p className="rv-name">{rv.name}</p>
                          <p className="rv-starline">
                            <span className="rv-stars-static">{rv.stars}</span>
                            <span className="rv-score">{rv.score}</span>
                          </p>
                        </div>
                        {(canDelete || isOwner) && (
                          <div className="rv-actions" style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                            {/* 수정은 본인만 */}
                            {isOwner && (
                              <button type="button" className="rv-edit-btn" onClick={() => startEdit(rv)}>
                                수정
                              </button>
                            )}
                            <button type="button" className="rv-del-btn" onClick={() => removeReview(rv)}>
                              {rv._kind === "builtin" ? "숨김" : "삭제"}
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="rv-body">
                        {rv.thumb ? (
                          <img
                            className="rv-thumb"
                            src={rv.thumb}
                            alt="리뷰 사진"
                            onClick={() => openReviewModalFromData(rv)}
                          />
                        ) : null}
                        <p className="rv-excerpt">
                          {rv.excerpt}
                          <a
                            href="#none"
                            className="rv-more"
                            onClick={(e) => {
                              e.preventDefault();
                              openReviewModalFromData(rv);
                            }}
                          >
                            [더보기]
                          </a>
                        </p>
                      </div>
                    </li>
                  );
                })}
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
                  {/* BUY → 결제 화면 */}
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

      {/* 리뷰 읽기 모달 (디자인/구조 유지: 항상 렌더 + display 토글) */}
      <aside
        id="rv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rvm-title"
        ref={rvModalRef}
        style={{
          display: reviewModal.open ? "block" : "none",
          zIndex: 2000, // 헤더/기타 오버레이 위
        }}
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

      {/* 리뷰 수정 모달 (본인 리뷰만) - 조건부 렌더링 */}
      {editState.open && (
        <aside
          id="rv-edit-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rve-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditState((s) => ({ ...s, open: false }));
          }}
        >
          {/* 1행: 닉네임 | 닫기 */}
          <div className="rve-nick" id="rve-title">
            {isLoggedIn?.local ? `${user?.name}님` : "회원님"}
          </div>
          <button
            type="button"
            className="rvm-close"
            aria-label="닫기"
            onClick={() => setEditState((s) => ({ ...s, open: false }))}
          >
            ×
          </button>

          {/* 2행: 별점 */}
          <div className="rv-stars" role="radiogroup" aria-label="별점 수정">
            {[1, 2, 3, 4, 5].map((v) => {
              const filled = (editState.rating || 0) >= v;
              return (
                <button
                  type="button"
                  key={`edit-star-${v}`}
                  className={`star ${filled ? "on" : ""}`}
                  role="radio"
                  aria-checked={editState.rating === v}
                  aria-label={`${v}점`}
                  onClick={() => setEditState((s) => ({ ...s, rating: v }))}
                >
                  {filled ? "★" : "☆"}
                </button>
              );
            })}
          </div>

          {/* 3~4행: 이미지/버튼(좌) | 텍스트박스(우) */}
          <div className="rv-preview">
            {editState.thumb && (
              <img
                src={editState.thumb}
                alt="첨부 미리보기"
                style={{ borderRadius: 8 }}
              />
            )}
          </div>

          <textarea
            className="rv-text"
            placeholder="후기를 수정하세요. (최소 10자)"
            value={editState.text}
            onChange={(e) => setEditState((s) => ({ ...s, text: e.target.value }))}
            minLength={10}
            required
          />

          <label className="rv-photo-btn">
            <input type="file" accept="image/*" hidden onChange={onPickEditPhoto} />
            <span>사진 바꾸기</span>
          </label>

          {/* 5행: 저장 */}
          <button
            className="rv-edit-save"
            type="button"
            onClick={saveEdit}
          >
            저장
          </button>
        </aside>
      )}

      {/* 확인 모달 */}
      {confirmState.open && (
        <aside
          id="confirm-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setConfirmState((s) => ({ ...s, open: false, onConfirm: null }))}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000
          }}
        >
          <div
            className="confirm-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(90vw, 360px)",
              background: "#fff",
              borderRadius: 12,
              padding: "20px 18px",
              boxShadow: "0 10px 30px rgba(0,0,0,.15)",
            }}
          >
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
              {confirmState.message || "확인하시겠어요?"}
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 14, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setConfirmState((s) => ({ ...s, open: false, onConfirm: null }))}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd", background: "#fafafa" }}
              >
                취소
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={() => confirmState.onConfirm?.() }
                style={{ padding: "8px 12px", borderRadius: 8 }}
              >
                확인
              </button>
            </div>
          </div>
        </aside>
      )}

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
