// src/utils/cart.js
const STORAGE_KEY = "cart_v1";
export const CART_UPDATED_EVENT = "cart:updated";

// "₩123,456" 같은 문자열 → 숫자
export function parsePriceKRW(v) {
  if (typeof v === "number") return v;
  if (!v) return 0;
  const n = String(v).replace(/[^\d.-]/g, "");
  return Number(n || 0);
}

export function getCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  // 다른 탭/컴포넌트와 동기화
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cart } }));
}



// 장바구니 담기(동일 상품+옵션이면 수량만 증가)
export function addToCart(item, qty = 1) {
  const cart = getCart();

  // 키 규칙: id/slug/name + optionId
  const key = `${item.id || item.slug || item.sku || item.name}|${item.optionId || ""}`;
  const idx = cart.findIndex((x) => x.key === key);

  if (idx >= 0) {
    cart[idx].qty += qty;
  } else {
    cart.push({
      key,
      id: item.id ?? null,
      slug: item.slug ?? null,
      name: item.name,
      price: Number(item.price ?? 0), // 단가(옵션 포함)
      basePrice: Number(item.basePrice ?? item.price ?? 0),
      optionId: item.optionId ?? null,
      optionLabel: item.optionLabel ?? null,
      delivery: Number(item.delivery ?? 0),
      thumb: item.thumb ?? null,
      qty: Math.max(1, qty | 0),
      addedAt: Date.now(),
    });
  }

  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
}

// 특정 key의 수량 설정
export function setQty(key, qty) {
  const cart = getCart();
  const idx = cart.findIndex((x) => x.key === key);
  if (idx >= 0) {
    cart[idx].qty = Math.max(1, qty | 0);
    saveCart(cart);
  }
  return cart;
}

// 특정 key 삭제
export function removeByKey(key) {
  const cart = getCart().filter((x) => x.key !== key);
  saveCart(cart);
  return cart;
}

// 총 수량
export function cartCount() {
  return getCart().reduce((s, x) => s + (x.qty || 0), 0);
}

// ✅ 여러 key 삭제
export function removeMany(keys = []) {
  if (!Array.isArray(keys) || keys.length === 0) return getCart();
  const set = new Set(keys);
  const next = getCart().filter((x) => !set.has(x.key));
  saveCart(next);
  return next;
}


// ✅ 결제 태그(카트 기반 표시용)
// purchasedAt을 넘기면 그 시각으로 기록(안 넘기면 현재 시각)
export function tagPurchased(keys = [], orderId, purchasedAt) {
   if (!Array.isArray(keys) || keys.length === 0) return getCart();
   const set = new Set(keys);
   const now = purchasedAt ?? Date.now();
   const next = getCart().map(it =>
     set.has(it.key) ? { ...it, purchasedAt: now, lastOrderId: orderId } : it
   );
   saveCart(next);
   return next;
}
