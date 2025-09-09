// ✅ 기존 상수 유지 (베이스 키)
export const LS_REWARDS = "souvenirRewards_v1";
export const LS_SIGNUP_BONUS = "souvenirSignupBonusGiven_v1";
export const LS_PURCHASE_FLAG = "souvenirRecentPurchase";

// ✅ 사용자별 키 생성 유틸
const k = (base, uid) => `${base}:${uid}`;

// ✅ 반드시 uid를 받아서 동작하게 변경
export function getRewards(uid) {
  if (!uid) return { coupons: 0, points: 0, gifts: 0 };
  try {
    const raw = localStorage.getItem(k(LS_REWARDS, uid));
    const parsed = raw ? JSON.parse(raw) : {};
    return {
      coupons: Number(parsed.coupons) || 0,
      points: Number(parsed.points) || 0,
      gifts: Number(parsed.gifts) || 0,
    };
  } catch {
    return { coupons: 0, points: 0, gifts: 0 };
  }
}


/** 저장: 숫자 보장 */
export function setRewards(uid, next) {
  if (!uid) return;
  const safe = {
    coupons: Number(next?.coupons) || 0,
    points: Number(next?.points) || 0,
    gifts: Number(next?.gifts) || 0,
  };
  try {
    localStorage.setItem(k(LS_REWARDS, uid), JSON.stringify(safe));
  } catch { }
}
/** 내부 업데이트 헬퍼(원자적) */
function updateRewards(uid, updater) {
  const before = getRewards(uid);
  const after = updater(before);
  setRewards(uid, after);
  return after;
}

/** 증감 헬퍼들 */
export const addCoupons = (uid, n = 1) =>
  updateRewards(uid, (r) => ({ ...r, coupons: r.coupons + Number(n) }));

export const addPoints = (uid, n = 0) =>
  updateRewards(uid, (r) => ({ ...r, points: r.points + Number(n) }));

export const addGifts = (uid, n = 1) =>
  updateRewards(uid, (r) => ({ ...r, gifts: r.gifts + Number(n) }));

/** 회원가입 보너스(1회만) → points+1000, coupons+1 */
export function grantSignupBonusOnce(uid) {
  if (!uid) return false;
  const flag = k(LS_SIGNUP_BONUS, uid);
  if (localStorage.getItem(flag) === "1") return false; // 이미 지급
  addPoints(uid, 1000);
  addCoupons(uid, 1);
  localStorage.setItem(flag, "1");
  return true;
}



/** 결제 완료 시: 이벤트 1회 보상 허용 플래그 세팅 */
export function setPurchaseFlag(uid) {
  if (!uid) return;
  localStorage.setItem(k(LS_PURCHASE_FLAG, uid), "1");
}

/** 이벤트에서 보상 줄 때 소모(있으면 true) */
export function consumePurchaseFlagIfAny(uid) {
  if (!uid) return false;
  const key = k(LS_PURCHASE_FLAG, uid);
  if (localStorage.getItem(key) === "1") {
    localStorage.removeItem(key);
    return true;
  }
  return false;
}

const PURCHASE_TOKEN_KEY = "souvenir:purchaseToken";

/** 결제 완료 시 호출 (토큰 발급). ttlHours=24는 24시간 유효 */
export function markRecentPurchase(meta = {}, ttlHours = 24) {
  const now = Date.now();
  const expiresAt = now + ttlHours * 60 * 60 * 1000;
  const payload = { ...meta, purchasedAt: now, expiresAt };
  try {
    localStorage.setItem(PURCHASE_TOKEN_KEY, JSON.stringify(payload));
  } catch { }
}

/** 이벤트 입장 가능? (토큰 있고, 아직 유효?) */
export function hasValidRecentPurchase() {
  try {
    const raw = localStorage.getItem(PURCHASE_TOKEN_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return typeof data?.expiresAt === "number" && data.expiresAt > Date.now();
  } catch {
    return false;
  }
}

/** 토큰 소모 (이벤트 시작 시 소비) */
export function consumeRecentPurchase() {
  try { localStorage.removeItem(PURCHASE_TOKEN_KEY); } catch { }
}