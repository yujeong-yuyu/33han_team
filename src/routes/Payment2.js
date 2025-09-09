// src/pages/Payment2.jsx
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { setPurchaseFlag, markRecentPurchase, addPoints } from "../utils/rewards";
import { getSession } from "../utils/localStorage";
import { saveOrder, createOrderId } from "../utils/orders";
import { tagPurchased /*, removeMany*/ } from "../utils/cart";
import "../css/Payment2.css";

const CDN = "https://00anuyh.github.io/SouvenirImg";

/* ===== 숫자/금액 유틸 ===== */
function toNumber(value, fallback = 0) {
  const n = Number(String(value ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : fallback;
}
function fmtKRW(value) {
  const n = toNumber(value, 0);
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(n);
}

/* ===== 로컬스토리지에서 카트 읽어오기 ===== */
function safeParse(json, fallback = null) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}
function readCartFromLS() {
  if (typeof localStorage === "undefined") return [];
  // 프로젝트별 키가 다를 수 있어 흔한 키들을 순차 시도 (+ cart_v1 포함)
  const KEYS = ["cart_v1", "souvenir_cart_v1", "souvenir_cart", "cart"];
  for (const k of KEYS) {
    const raw = localStorage.getItem(k);
    if (!raw) continue;
    const data = safeParse(raw, null);
    if (!data) continue;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.lineItems)) return data.lineItems;
  }
  return [];
}

/* ===== Payment2 정규화 ===== */
function normalizeForPayment2(x, i = 0) {
  x = x && typeof x === "object" ? x : {};
  return {
    image: x.image ?? x.thumb ?? x.src ?? `${CDN}/placeholder.png`,
    brand: x.brand ?? x.seller ?? "",
    title: x.title ?? x.name ?? "-",
    color: x.color ?? x.optionColor ?? x.colorLabel ?? "-",
    size: x.size ?? x.optionSize ?? x.sizeLabel ?? "-",
    optionLabel: x.optionLabel ?? "",
    qty: toNumber(x.qty ?? x.quantity ?? x.count ?? 1, 1),
    unitPrice: toNumber(x.unitPrice ?? x.price ?? x.basePrice ?? 0, 0),
    deliveryCost: toNumber(
      x.deliveryCost ?? x.shippingFee ?? x.shipping ?? x.delivery ?? 0,
      0
    ),
    orderNo: x.orderNo ?? x.orderId ?? x.id ?? `ORDER-${Date.now()}-${i + 1}`,
    id: x.id ?? `${(x.title ?? x.name ?? "item")}-${i}`,
    originalKey: x.sourceKey ?? x.key ?? x.originalKey ?? null, // 장바구니 원본 key 추적
  };
}
function buildLineItems(payload) {
  const fromState = Array.isArray(payload?.lineItems) ? payload.lineItems : [];
  if (fromState.length) return fromState.map(normalizeForPayment2);
  const fromLS = readCartFromLS();
  if (fromLS.length) return fromLS.map(normalizeForPayment2);
  return [];
}

export default function Payment2() {
  const navigate = useNavigate();
  const location = useLocation();
  const payload = location.state || {};

  /* ✅ 주문 ID / 구매시각: 컴포넌트 안에서 한 번만 고정 생성 */
  const orderIdRef = React.useRef(payload.orderId || createOrderId());
  const purchasedAtRef = React.useRef(Date.now());
  const orderId = orderIdRef.current;
  const purchasedAt = purchasedAtRef.current;

  /* 아이템/합계 */
  const items = buildLineItems(payload);
  const totals = items.reduce(
    (acc, it) => {
      acc.product += toNumber(it.qty, 1) * toNumber(it.unitPrice, 0);
      acc.delivery += toNumber(it.deliveryCost, 0);
      return acc;
    },
    { product: 0, delivery: 0 }
  );
  const grandTotal = totals.product + totals.delivery;

  /* 주소/연락처 표시 */
  const receiver = payload.receiver || "";
  const zip = payload.address?.zip || "";
  const address1 = payload.address?.addr1 || "";
  const address2 = payload.address?.addr2 || "";
  const phone = payload.phone || "";
  const request = payload.deliveryNote || "";

  const onOpenLetter = () => navigate("/Event"); // 라우트에 맞게 /event 라면 소문자로 바꿔도 됨
  const onKeepShopping = () => navigate(-2);

  /* 세션 */
  const session = getSession();
  const uid = session?.username || session?.userid || null;

  /* ✅ 포인트 적립 (6%, 중복 방지) */
  React.useEffect(() => {
    if (!items.length) return;
    const creditKey = `pointsCredited:${orderId}`;
    if (sessionStorage.getItem(creditKey) === "1") return;
    const earn = Math.floor(grandTotal * 0.06);
    if (uid && earn > 0) {
      addPoints(uid, earn);
      sessionStorage.setItem(creditKey, "1");
    }
  }, [uid, items, grandTotal, orderId]);

  /* ✅ 구매 플래그(이벤트 토큰) */
  React.useEffect(() => {
    if (!items.length) return;
    const flag = `purchaseMarked:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;
    markRecentPurchase({ orderId, total: grandTotal });
    if (uid) setPurchaseFlag(uid);
    sessionStorage.setItem(flag, "1");
  }, [items, orderId, uid, grandTotal]);

  /* ✅ 장바구니 항목에 '구매됨' 태그 (필요 시 카트 비우기는 주석) */
  React.useEffect(() => {
    if (!items.length) return;
    const flag = `cartTagged:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;

    const keys = items.map((it) => it.originalKey).filter(Boolean);
    if (keys.length > 0) {
      // ★ 각 항목에 { lastOrderId, purchasedAt }를 기록 → MyPage에서 최근주문으로 인식
      tagPurchased(keys, orderId, purchasedAt);
      // removeMany(keys); // 결제 후 카트를 비우고 싶다면 주석 해제
    }
    sessionStorage.setItem(flag, "1");
  }, [items, orderId, purchasedAt]);

  /* ✅ 주문 이력 저장 (MyPage 최근주문용) — purchasedAt 기준 날짜 */
  React.useEffect(() => {
    if (!items.length) return;
    const flag = `orderSaved:${orderId}`;
    if (sessionStorage.getItem(flag) === "1") return;

    const paid = new Date(purchasedAt);
    const d = `${paid.getFullYear()}-${String(paid.getMonth() + 1).padStart(2, "0")}-${String(
      paid.getDate()
    ).padStart(2, "0")}`;

    saveOrder(uid, {
      orderId,
      date: d,
      items: items.map((it) => ({
        title: it.title || "-",
        image: it.image,
        optionLabel: it.optionLabel || "",
        qty: Number(it.qty || 1),
        unitPrice: Number(it.unitPrice || 0),
        deliveryCost: Number(it.deliveryCost || 0),
        brand: it.brand || "",
        color: it.color || "-",
        size: it.size || "-",
        orderNo: it.orderNo || "-",
      })),
      totals: { product: totals.product, delivery: totals.delivery, grandTotal },
      status: "결제완료",
    });

    sessionStorage.setItem(flag, "1");
  }, [items, totals.product, totals.delivery, grandTotal, orderId, uid, purchasedAt]);

  return (
    <div id="cart-wrap">
      {/* 진행바 */}
      <div id="payment-progress">
        <ul>
          <li className="progress1">
            <div className="circle">
              <p>01</p>
            </div>
            <p className="progress-nav">
              SHOPPING <br />
              BAG
            </p>
          </li>
          <li>
            <p className="ntt">
              <i className="fa-solid fa-angle-right"></i>
            </p>
          </li>
          <li className="progress2">
            <div className="circle">
              <p>02</p>
            </div>
            <p className="progress-nav2">ORDER</p>
          </li>
          <li>
            <p className="ntt">
              <i className="fa-solid fa-angle-right"></i>
            </p>
          </li>
          <li className="progress3">
            <div className="circle2">
              <p>03</p>
            </div>
            <p className="progress-nav">
              ORDER <br />
              CONFIRMED
            </p>
          </li>
        </ul>
      </div>

      {/* 주문완료 배너 */}
      <div id="payment-final">
        <div className="payment-final-text">
          <p>주문완료!</p>
          <p>구매가 정상적으로 완료되었습니다.</p>
        </div>
        <div className="payment-final-button">
          <ul>
            <li>
              <button
                className="payment-final-button1"
                type="button"
                onClick={onKeepShopping}
              >
                <p>쇼핑계속하기</p>
              </button>
            </li>
            <li>
              <button
                className="payment-final-button2"
                type="button"
                onClick={onOpenLetter}
              >
                <img src={`${CDN}/letter.png`} alt="letter" />
                <p>편지도착</p>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* 주문상품 정보 */}
      <div id="cart-title">
        <p>주문상품 정보</p>
      </div>

      <div id="cart-item">
        <ul>
          <li>
            <p>상품정보</p>
          </li>
          <li>
            <p>배송비</p>
          </li>
          <li>
            <p>진행상태</p>
          </li>
        </ul>
      </div>

      <div id="cart-list">
        {items.map((it, idx) => (
          <div className="cartitem" key={it.id ?? `${it.title}-${idx}`}>
            <div className="cartitem-img">
              <img
                src={it.image || `${CDN}/placeholder.png`}
                alt={`cart-${it.orderNo}`}
                style={{ width: "200px", height: "200px" }}
              />
            </div>

            <div className="cartitem-text">
              <span>{it.brand || ""}</span>
              <p className="cart-item-title">{it.title || "-"}</p>
              <p className="cart-item-color">[color] {it.color || "-"}</p>
              <p className="cart-item-size">[size] {it.size || "-"}</p>
              <p className="cart-item-price">
                {fmtKRW(it.unitPrice)} (수량 {toNumber(it.qty || 1, 1)}개)
              </p>
              <p className="cart-item-serialnumber">
                주문번호 : {it.orderNo || "-"}
              </p>
            </div>

            <div className="payment2-delivery-price">
              <p>
                {toNumber(it.deliveryCost, 0) > 0
                  ? fmtKRW(it.deliveryCost)
                  : "무료배송"}
              </p>
            </div>

            <div className="payment2-order-status">
              <p>결제완료</p>
              <p>2025-09-05</p>
              <p>
                배송예정 <i className="fa-solid fa-truck-fast"></i>
              </p>
              <p>2025-09-08 (월) 이내 배송 시작</p>
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div style={{ padding: "32px 0", textAlign: "center", color: "#666" }}>
            장바구니가 비어있어요.{" "}
            <button className="payment-final-button1" onClick={onKeepShopping}>
              쇼핑하러 가기
            </button>
          </div>
        )}
      </div>

      {/* 배송정보 요약 */}
      <div id="cart-footer2">
        <div id="cart-total">
          <div className="cart-total-title">
            <ul>
              <li>
                <p>배송정보</p>
              </li>
            </ul>
          </div>
          <div className="cart-total-payment4">
            <ul>
              <li>
                <p>수령인</p>
              </li>
              <li>
                <p>배송지</p>
              </li>
              <li>
                <p>연락처</p>
              </li>
              <li>
                <p>배송시 요청사항</p>
              </li>
            </ul>
          </div>
          <div className="cart-total-personal">
            <ul>
              <li>
                <p>{receiver}</p>
              </li>
              <li>
                <p>{zip}</p>
                <p>{address1}</p>
                <p>{address2}</p>
              </li>
              <li>
                <p>{phone}</p>
              </li>
              <li>
                <p>{request}</p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
