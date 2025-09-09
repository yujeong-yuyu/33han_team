import React, { useState, useMemo, useEffect, useCallback } from "react";
import "../css/Cart.css";
import { Link, useNavigate } from "react-router-dom";
import { getCart, setQty, CART_UPDATED_EVENT } from "../utils/cart";

const STORAGE_KEY = "cart_v1";
const fmt = (n) => (Number(n) || 0).toLocaleString("ko-KR") + "원";

// 로컬스토리지(cart_v1) → 화면용으로 정규화
function normalizeFromStorage(list) {
  return (list || []).map((it) => ({
    key: it.key,
    id: it.id ?? it.slug ?? it.key,
    name: it.name,
    brand: it.brand ?? "",
    thumb: it.thumb ?? "",
    optionLabel: it.optionLabel ?? "",          // 예: "레이스 리본 포함(+₩3,000)"
    price: Number(it.price ?? 0),               // 단가(옵션 반영)
    delivery: Number(it.delivery ?? 0),
    qty: Math.max(1, Number(it.qty ?? 1)),
    checked: true,
    orderNo: it.orderNo,
  }));
}

export default function Cart() {
  const navigate = useNavigate();

  // 최초 로드: 로컬스토리지에서 불러옴(없으면 빈 배열)
  const loadInitial = useCallback(() => normalizeFromStorage(getCart()), []);
  const [items, setItems] = useState(loadInitial);

  // 다른 페이지에서 addToCart 되면 자동 동기화
  useEffect(() => {
    const onUpd = () => setItems(normalizeFromStorage(getCart()));
    window.addEventListener(CART_UPDATED_EVENT, onUpd);
    return () => window.removeEventListener(CART_UPDATED_EVENT, onUpd);
  }, []);

  // 스토리지 저장 유틸
  const saveCart = (rows) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        rows.map(({ key, id, name, brand, thumb, optionLabel, price, delivery, qty, orderNo }) => ({
          key, id, name, brand, thumb, optionLabel, price, delivery, qty, orderNo,
        }))
      )
    );
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail: { cart: rows } }));
  };

  // 선택 토글
  const allChecked = items.length > 0 && items.every((it) => it.checked);
  const toggleAll = () =>
    setItems((prev) => prev.map((it) => ({ ...it, checked: !allChecked })));

  const toggleOne = (key) =>
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, checked: !it.checked } : it))
    );

  // 수량 +/-
  const plus = (key) => {
    const it = items.find((x) => x.key === key);
    const nextQty = (it?.qty || 1) + 1;
    setQty(key, nextQty); // utils/cart 통해 스토리지 갱신
    setItems((prev) => prev.map((x) => (x.key === key ? { ...x, qty: nextQty } : x)));
  };

  const minus = (key) => {
    const it = items.find((x) => x.key === key);
    const nextQty = Math.max(1, (it?.qty || 1) - 1);
    setQty(key, nextQty);
    setItems((prev) => prev.map((x) => (x.key === key ? { ...x, qty: nextQty } : x)));
  };

  // 선택 삭제
  const removeSelected = () => {
    const remain = items.filter((it) => !it.checked);
    setItems(remain);
    saveCart(remain);
  };

  // 합계
  const { subtotal, delivery, total, count } = useMemo(() => {
    const selected = items.filter((it) => it.checked);
    const subtotal = selected.reduce((s, it) => s + it.price * it.qty, 0);
    const delivery = selected.reduce((s, it) => s + (it.delivery || 0), 0);
    const total = subtotal + delivery;
    const count = selected.reduce((s, it) => s + it.qty, 0);
    return { subtotal, delivery, total, count };
  }, [items]);

  const onKeepShopping = () => navigate(-1);

  const selectedLineItems = items.filter((it) => it.checked);

  return (
    <div className="warp1">
      {/* 결제 단계 표시 */}
      <div id="payment-progress">
        <ul>
          <li className="progress1">
            <div className="circle2"><p>01</p></div>
            <p className="progress-nav">SHOPPING <br /> BAG</p>
          </li>
          <li><p className="ntt"><i className="fa-solid fa-angle-right"></i></p></li>
          <li className="progress2">
            <div className="circle"><p>02</p></div>
            <p className="progress-nav2">ORDER</p>
          </li>
          <li><p className="ntt"><i className="fa-solid fa-angle-right"></i></p></li>
          <li className="progress3">
            <div className="circle"><p>03</p></div>
            <p className="progress-nav">ORDER <br /> CONFIRMED</p>
          </li>
        </ul>
      </div>

      {/* 장바구니 */}
      <div id="cart-wrap">
        <div id="cart-title"><p>장바구니 정보</p></div>

        {/* 비었을 때 */}
        {items.length === 0 ? (
          <div className="cart-empty">
            <p>장바구니가 비어 있습니다.</p>
            <button className="cart-total-btn1" onClick={onKeepShopping}>
              쇼핑계속하기
            </button>
          </div>
        ) : (
          <>
            <div id="cart-item11">
              <ul>
                <li><p>상품정보</p></li>
                <li><p>수량</p></li>
                <li><p>배송비</p></li>
                <li><p>주문금액</p></li>
              </ul>
            </div>

            <div id="jj-cart-list">
              <ul>
                {items.map((it) => (
                  <li key={it.key} className="cart-item">
                    <label className="custom-checkbox">
                      <input
                        type="checkbox"
                        checked={!!it.checked}
                        onChange={() => toggleOne(it.key)}
                      />
                      <span className="checkmark"></span>
                      {it.name}
                    </label>

                    {/* 상품 이미지 */}
                    <div className="cartitemimg">
                      <img
                        src={it.thumb || "https://via.placeholder.com/120x120?text=No+Image"}
                        alt={it.name}
                      />
                    </div>

                    {/* 상품 정보 */}
                    <div id="cartitem-text">
                      {it.brand ? <span>{it.brand}</span> : null}
                      <ul>
                        <li id="cart-item-title"><p>{it.name}</p></li>
                        {it.optionLabel ? (
                          <li id="cart-item-color"><p>{it.optionLabel}</p></li>
                        ) : null}
                        <li id="cart-item-price">
                          <p>{fmt(it.price)} (수량 {it.qty}개)</p>
                        </li>
                        {it.orderNo ? (
                          <li className="cart-item-serialnumber">
                            <p>주문번호 : {it.orderNo}</p>
                          </li>
                        ) : null}
                      </ul>
                    </div>

                    {/* 수량 조절 */}
                    <div className="cart-item-count">
                      <ul>
                        <li><button onClick={() => minus(it.key)}>-</button></li>
                        <li><p>{it.qty}</p></li>
                        <li><button onClick={() => plus(it.key)}>+</button></li>
                      </ul>
                    </div>

                    {/* 배송비 */}
                    <div className="delivery-price3">
                      <p>{it.delivery === 0 ? "무료배송" : fmt(it.delivery)}</p>
                    </div>

                    {/* 총 가격 */}
                    <div className="order-price3">
                      <p>{fmt(it.price * it.qty)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div id="cart-footer">
              <ul>
                <li>
                  <button onClick={toggleAll} disabled={items.length === 0}>
                    <p>✔</p><span>모든상품 선택</span>
                  </button>
                </li>
                <li>
                  <button onClick={removeSelected}>
                    <img
                      src="https://00anuyh.github.io/SouvenirImg/delete.png"
                      alt="trash"
                    />
                    <span className="qwer">선택품목 삭제</span>
                  </button>
                </li>
                <li>
                  <p className="cart-notice">장바구니에는 최대 100개의 상품을 담을 수 있습니다.</p>
                </li>
              </ul>
            </div>

            <div className="cart-total-title5">
              <ul>
                <li><p>총 주문금액</p></li>
                <li><p>배송비</p></li>
                <li><p>총 결제금액</p></li>
              </ul>
            </div>

            <div id="cart-total-payment">
              <ul>
                <li>
                  <p>{fmt(subtotal)}</p>
                  <p className="q1w2e3">총 {count}개</p>
                </li>
                <li><p>{fmt(delivery)}</p></li>
                <li><p>{fmt(total)}</p></li>
              </ul>
            </div>

            <div className="cart-total-final">
              <button className="cart-total-btn1" onClick={onKeepShopping}>
                <p>쇼핑계속하기</p>
              </button>
              <Link to="/payment" state={{ lineItems: selectedLineItems }}>
                <button className="cart-total-btn2" disabled={selectedLineItems.length === 0}>
                  <p>결제하기</p>
                </button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
