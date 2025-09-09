// src/utils/coupons.js
const COUPON_KEY = (uid) => `coupons:${uid || "guest"}`;

// 쿠폰 스키마 예시:
// { id, title, subtitle, amountText, type: "percent"|"amount",
//   code, validFrom, validTo, used, expired, minSubtotal, terms }

export function loadCoupons(uid) {
  try {
    const raw = localStorage.getItem(COUPON_KEY(uid));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveCoupons(uid, list) {
  localStorage.setItem(COUPON_KEY(uid), JSON.stringify(list || []));
}

export function upsertCoupons(uid, coupons) {
  const cur = loadCoupons(uid);
  const map = new Map(cur.map(c => [c.id, c]));
  for (const c of coupons) map.set(c.id, { ...map.get(c.id), ...c });
  const next = [...map.values()];
  saveCoupons(uid, next);
  return next;
}

export function markCouponUsed(uid, couponId) {
  const list = loadCoupons(uid);
  const i = list.findIndex(c => c.id === couponId);
  if (i >= 0) {
    list[i] = { ...list[i], used: true };
    saveCoupons(uid, list);
  }
  return list;
}

export function getApplicableCoupons(uid, subtotal) {
  const now = Date.now();
  return loadCoupons(uid).filter(c => {
    if (c.used || c.expired) return false;
    const from = c.validFrom ? new Date(c.validFrom).getTime() : -Infinity;
    const to   = c.validTo ? new Date(c.validTo).getTime() :  Infinity;
    const min  = Number(c.minSubtotal || 0);
    return now >= from && now <= to && subtotal >= min;
  });
}

export function calcCouponDiscount(coupon, subtotal) {
  if (!coupon) return 0;
  if (coupon.type === "percent") {
    // amountText는 표시용, 실제 계산은 percent 필드 사용 권장
    const pct = Number(coupon.percent || 0);   // 10 → 10%
    return Math.floor(subtotal * (pct / 100));
  }
  if (coupon.type === "amount") {
    const amt = Number(coupon.amount || 0);    // 5000
    return Math.min(amt, subtotal);
  }
  return 0;
}
