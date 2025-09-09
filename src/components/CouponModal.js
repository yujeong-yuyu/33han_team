import { useEffect, useState } from "react";
import { getSession } from "../utils/localStorage";

import { listCoupons, syncCouponLedgerWithCount, getRewards, pruneExpiredCoupons } from "../utils/rewards";


function fmtDate(ts) {
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
}

export default function CouponModal({ open, onClose }) {

    const [rows, setRows] = useState([]);
    const [count, setCount] = useState(0);
    // 모달이 열릴 때만 쿠폰 목록 로드


    useEffect(() => {
        if (!open) return;
        const s = getSession?.();
        const uid = s?.username || s?.userid || null;

        if (!uid) { setRows([]); setCount(0); return; }

        // ① 만료 정리 → ② 보유/원장 동기화 → ③ 사용 가능 쿠폰만 읽기
        pruneExpiredCoupons(uid);
        syncCouponLedgerWithCount(uid);

        const list = listCoupons(uid, { includeUsed: false, excludeExpired: true }); // ✅ 사용 가능만
        list.sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
        setRows(list);

        // 헤더 숫자는 보유 카운트 기준으로 맞춤(= MyPage 박스와 동일)
        const r = getRewards(uid);
        setCount(Number(r.coupons) || 0);
    }, [open]);


    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);


    if (!open) return null;

    return (
        <div className="modal-backdrop" onClick={onClose} aria-hidden="true">
            <div className="coupon-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                <div className="coupon-modal-hero">
                    <button className="coupon-modal-close" onClick={onClose} aria-label="닫기">
                        <i className="fa-solid fa-xmark" aria-hidden="true"></i>
                    </button>
                </div>

                <div className="coupon-modal-body">

                    <div className="coupon-summary">보유 쿠폰 <strong>{count}</strong>장</div>
                    {rows.length === 0 && <div className="coupon-empty">사용 가능한 쿠폰이 없습니다.</div>}

                    <ul className="coupon-list">
                        {rows.map(c => (
                            <li key={c.id} className="coupon-card">
                                <div className="coupon-left">
                                    <div className="coupon-rate"><strong>{c.percent ?? 5}%</strong></div>
                                    <div className="coupon-title">{c.title || "할인쿠폰"}</div>
                                </div>
                                <div className="coupon-right">
                                    <div className="coupon-row"><span className="label">발급일</span><span className="value">{fmtDate(c.issuedAt)}</span></div>
                                    <div className="coupon-row"><span className="label">사용기한</span><span className="value">{fmtDate(c.expiresAt)} 까지</span></div>
                                    <div className="coupon-status active">사용 가능</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

            </div>
        </div>
    );
}
