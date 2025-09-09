// src/pages/Payment.jsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../css/Payment.css";

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- 원본 아이템 안전 수령: lineItems | items | 단일 객체도 배열화 ----
  const incoming =
    location.state?.lineItems ?? location.state?.items ?? [];
  const rawLineItems = Array.isArray(incoming) ? incoming : [incoming];

  /* ---------------------- helpers ---------------------- */
  const toInt = (v, fallback = 0) => {
    const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
    return Number.isFinite(n) ? n : fallback;
  };

  const fmt = (v) =>
    new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
      maximumFractionDigits: 0,
    }).format(toInt(v, 0));

  // ✅ 어떤 키가 와도 표준형으로 정규화(표시/정산 + 메타 유지)
  const normItem = (it = {}) => ({
    // 표시/정산 필드
    name: it.name ?? it.title ?? "상품",
    unitPrice: toInt(it.unitPrice ?? it.price ?? it.amount ?? 0),
    qty: Math.max(1, toInt(it.qty ?? it.quantity ?? 1, 1)),
    delivery: toInt(
      it.delivery ?? it.deliveryCost ?? it.shipping ?? it.shippingFee ?? 0
    ),

    // 메타 필드(다음 단계/마이페이지 연동용)
    sourceKey: it.key ?? it.sourceKey ?? it.originalKey ?? null,
    image: it.thumb ?? it.image ?? it.src ?? null,
    brand: it.brand ?? "",
    optionLabel: it.optionLabel ?? it.optionName ?? "",
    color: it.color ?? it.optionColor ?? null,
    size: it.size ?? it.optionSize ?? null,
    orderNo: it.orderNo ?? it.orderId ?? it.id ?? null,
    id: it.id ?? it.slug ?? null,
  });

  /* ---------------------- 금액/표시값 계산 ---------------------- */
  const {
    items,
    subtotal,
    shipFee,
    couponAmt,
    total,
    firstName,
    extraCount,
  } = useMemo(() => {
    const items = Array.isArray(rawLineItems)
      ? rawLineItems.map(normItem)
      : [];

    const subtotal = items.reduce((s, it) => s + it.unitPrice * it.qty, 0);
    const shipFee = items.reduce((s, it) => s + it.delivery, 0);

    // 쿠폰: 숫자 또는 { amount } 모두 대응
    const rawCoupon = location.state?.coupon ?? 0;
    const couponAmt = toInt(
      (typeof rawCoupon === "object" ? rawCoupon?.amount : rawCoupon) ?? 0
    );

    const total = Math.max(0, subtotal + shipFee - couponAmt);

    // "상품명 (외 N개)" 표기
    const firstName = items[0]?.name ?? "";

    // 1) 서로 다른 상품 개수(고유 키 기준) 우선
    const keyOf = (x) =>
      (x.id ?? "") +
      "|" +
      (x.name ?? "") +
      "|" +
      (x.optionLabel ?? "") +
      "|" +
      (x.color ?? "") +
      "|" +
      (x.size ?? "");
    const distinctCount = new Set(items.map(keyOf)).size;
    const distinctExtra = Math.max(0, distinctCount - 1);

    // 2) 백업: 총 수량 기준 (총 수량 - 첫 상품 수량)
    const totalQty = items.reduce((s, it) => s + (Number(it.qty) || 0), 0);
    const firstQty = Number(items[0]?.qty) || 0;
    const qtyExtra = Math.max(0, totalQty - firstQty);

    const extraCount = distinctExtra > 0 ? distinctExtra : qtyExtra;

    return {
      items,
      subtotal,
      shipFee,
      couponAmt,
      total,
      firstName,
      extraCount,
    };
  }, [rawLineItems, location.state?.coupon]);

  /* ---------------------- 폼 상태 ---------------------- */
  const [buyer, setBuyer] = useState("");
  const [receiver, setReceiver] = useState("");
  const [zip, setZip] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [phone1, setPhone1] = useState("010");
  const [phone2, setPhone2] = useState("");
  const [phone3, setPhone3] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [payMethod, setPayMethod] = useState(""); // "kakao" | "naver" | ...

  /* Select창 */
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);

  const deliveryOptions = [
    { value: "door", label: "문 앞" },
    { value: "security", label: "경비실에 놔주세요." },
    { value: "call", label: "부재시 전화주세요." },
    { value: "pickup", label: "직접수령" },
  ];

  /* ---------------------- 제출 ---------------------- */
  const onSubmit = (e) => {
    e.preventDefault();
    if (!buyer || !receiver || !zip || !addr1 || !phone2 || !phone3 || !payMethod) {
      alert("필수 정보를 모두 입력해주세요.");
      return;
    }

    const payload = {
      buyer,
      receiver,
      address: { zip, addr1, addr2 },
      phone: `${phone1}-${phone2}-${phone3}`,
      deliveryNote,
      payMethod,
      // ✅ 정규화된 아이템을 그대로 전달(다음 단계에서 바로 사용 가능)
      lineItems: items,
      subtotal,
      shipFee,
      coupon: couponAmt,
      total,
    };

    navigate("/payment2", { state: payload });
  };

  /* ---------------------- Render ---------------------- */
  return (
    <form onSubmit={onSubmit}>
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
            <div className="circle2">
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
            <div className="circle">
              <p>03</p>
            </div>
            <p className="progress-nav">
              ORDER <br />
              CONFIRMED
            </p>
          </li>
        </ul>
      </div>

      <div id="payment-main">
        {/* 배송정보 */}
        <div id="payment-text">
          <div className="section-title">
            <p>배송정보</p>
          </div>

          <ul>
            <li>
              <label htmlFor="buyer">주문인</label>
              <input
                id="buyer"
                type="text"
                placeholder="주문인 성함을 입력하세요."
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
              />
            </li>

            <li>
              <label htmlFor="receiver">수령인</label>
              <input
                id="receiver"
                type="text"
                placeholder="수령인 성함을 입력하세요."
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
              />
            </li>

            <li className="address">
              <div className="address-top">
                <label htmlFor="zip">배송지</label>
                <div className="address-line">
                  <input
                    id="zip"
                    type="text"
                    className="address-box"
                    placeholder="우편번호 를 검색하세요."
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      // TODO: 다음(카카오) 우편번호 API 연동
                      alert("우편번호 검색 모듈을 연결하세요.");
                    }}
                  >
                    우편번호 검색
                  </button>
                </div>
              </div>

              <div className="address-sub">
                <input
                  type="text"
                  placeholder="주소"
                  value={addr1}
                  onChange={(e) => setAddr1(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="상세주소"
                  value={addr2}
                  onChange={(e) => setAddr2(e.target.value)}
                />
              </div>
            </li>

            <li className="phone">
              <label>연락처</label>
              <input
                type="text"
                maxLength={3}
                placeholder="010"
                className="phone-part"
                value={phone1}
                onChange={(e) => setPhone1(e.target.value.replace(/\D/g, ""))}
              />
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                className="phone-part"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value.replace(/\D/g, ""))}
              />
              <input
                type="text"
                maxLength={4}
                placeholder="5678"
                className="phone-part"
                value={phone3}
                onChange={(e) => setPhone3(e.target.value.replace(/\D/g, ""))}
              />
            </li>

            <li id="delivery">
              <p>배송 요청 사항</p>
              <div
                className={`custom-select ${isDeliveryOpen ? "open" : ""}`}
                onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
              >
                <div className="selected">
                  {deliveryNote || "메시지를 선택하세요"}
                </div>
                <ul className={`options ${isDeliveryOpen ? "show" : ""}`}>
                  {deliveryOptions.map((option) => (
                    <li
                      key={option.value}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeliveryNote(option.label);
                        setIsDeliveryOpen(false);
                      }}
                    >
                      {option.label}
                    </li>
                  ))}
                </ul>
              </div>
            </li>

            {/* 결제 수단 */}
            <div id="pay">
              <div className="pay-title">
                <p>결제 수단</p>
              </div>

              <ul>
                <li>
                  <button
                    type="button"
                    className={`btn1 ${payMethod === "kakao" ? "is-active" : ""}`}
                    onClick={() => setPayMethod("kakao")}
                  >
                    <img
                      src="https://00anuyh.github.io/SouvenirImg/kakaopay.png"
                      alt="kakao"
                    />
                    <p>카카오페이</p>
                  </button>

                  <button
                    type="button"
                    className={`btn2 ${payMethod === "naver" ? "is-active" : ""}`}
                    onClick={() => setPayMethod("naver")}
                  >
                    <img
                      src="https://00anuyh.github.io/SouvenirImg/badge_npay%201.png"
                      alt="naver"
                    />
                    <p>네이버페이</p>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={`btn3 ${payMethod === "samsung" ? "is-active" : ""}`}
                    onClick={() => setPayMethod("samsung")}
                  >
                    <img
                      src="https://00anuyh.github.io/SouvenirImg/samsungpay.jpg"
                      alt="samsung"
                    />
                    <p>삼성페이</p>
                  </button>

                  <button
                    type="button"
                    className={`btn4 ${payMethod === "card" ? "is-active" : ""}`}
                    onClick={() => setPayMethod("card")}
                  >
                    <img
                      src="https://00anuyh.github.io/SouvenirImg/card.png"
                      alt="card"
                    />
                    <p>카드결제</p>
                  </button>
                </li>

                <li>
                  <button
                    type="button"
                    className={`btn5 ${payMethod === "bank" ? "is-active" : ""}`}
                    onClick={() => setPayMethod("bank")}
                  >
                    <img
                      src="https://00anuyh.github.io/SouvenirImg/dollar.png"
                      alt="bank"
                    />
                    <p>무통장입금</p>
                  </button>

                  <button
                    type="button"
                    className={`btn6 ${payMethod === "mobile" ? "is-active" : ""}`}
                    onClick={() => setPayMethod("mobile")}
                  >
                    <img
                      src="https://00anuyh.github.io/SouvenirImg/smartphone.png"
                      alt="mobile"
                    />
                    <p>휴대폰결제</p>
                  </button>
                </li>
              </ul>
            </div>
          </ul>
        </div>

        {/* 결제정보 요약 */}
        <div id="payment-right">
          <div id="payment-wrap">
            <p>결제금액</p>
            <div className="title-underline"></div>

            <ul id="price-prog">
              <li>
                <div id="payment1">
                  <p>상품명</p>
                  <p>
                    {items.length > 0 && (
                      <>
                        {firstName}
                        {extraCount > 0 && ` (외 ${extraCount}개)`}
                      </>
                    )}
                  </p>
                </div>
              </li>

              <li>
                <div id="payment2">
                  <p>총 상품 금액</p>
                  <p>{fmt(subtotal)}</p>
                </div>
              </li>

              <li>
                <div id="payment3">
                  <p>배송비</p>
                  <p>{fmt(shipFee)}</p>
                </div>
              </li>

              <li>
                <div id="payment4">
                  <p>쿠폰 할인 금액</p>
                  <p>{fmt(couponAmt)}</p>
                </div>
              </li>

              <div className="title-underline"></div>

              <li>
                <div id="payment5">
                  <p>총 결제 금액</p>
                  <p>{fmt(total)}</p>
                </div>
              </li>
            </ul>

            <div id="payment-notice">
              <span>유의사항</span>
              <p>
                본인은 만 14세 이상이며, 주문내용을 확인하였습니다.
                <br />
                (주)버킷플레이스는 통신판매중개자로 거래 당사자가 아니므로,
                판매자가 등록한 상품정보및거래 등에대해 책임을지지 않습니다.
                <br />
              </p>
              <p>
                (단. ㈜버킷플레이스가 판매자로 등록 판매한 상품은 판매자로서
                책임을 부담합니다).
              </p>
            </div>

            <button type="submit">
              <p>결제하기</p>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}