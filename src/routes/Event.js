// src/pages/Event.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { addGifts, addCoupons, hasValidRecentPurchase, consumeRecentPurchase, consumePurchaseFlagIfAny, LS_PURCHASE_FLAG } from "../utils/rewards";
import "../css/Event.css";
import { getSession } from "../utils/localStorage";

const WIN_RATE = 0.5;
const IMG_CLOSED = "https://00anuyh.github.io/SouvenirImg//a_event_green.png";
const IMG_WIN = "https://00anuyh.github.io/SouvenirImg//win.png";
const IMG_LOSE = "https://00anuyh.github.io/SouvenirImg//lose.png";
const LS_KEY = "souvenirEventResult";
const KEY_BASE = "souvenirEventResult";        // 구버전/기본 키
const keyFor = (uid) => (uid ? `${KEY_BASE}:${uid}` : KEY_BASE);  // 유저별 키



const Event = () => {
  const navigate = useNavigate();
  const goMyPage = () => navigate("/mypage");
  const goShop = () => navigate("/");

  function triggerFirework() {
    const root = document.createElement("div");
    root.className = "firework-root";
    document.body.appendChild(root);

    const COLORS = ["#ff7675", "#fd79a8", "#74b9ff", "#55efc4", "#ffeaa7"];
    const centerX = window.innerWidth / 2, centerY = window.innerHeight / 2;
    const N = 30;
    for (let i = 0; i < N; i++) {
      const p = document.createElement("span");
      p.className = "fire-particle";
      p.style.background = COLORS[i % COLORS.length];
      p.style.left = centerX + "px";
      p.style.top = centerY + "px";
      p.style.setProperty("--tx", (Math.random() - 0.5) * 400 + "px");
      p.style.setProperty("--ty", (Math.random() - 0.5) * 400 + "px");
      root.appendChild(p);
    }
    setTimeout(() => root.remove(), 2000);
  }





  // 6개의 편지 상태
  const [cards, setCards] = useState(
    Array.from({ length: 6 }, () => ({ opened: false, isWin: null }))
  );
  const [openedIndex, setOpenedIndex] = useState(null);
  const [eligible, setEligible] = useState(false); // 결제 토큰 O?
  const [locked, setLocked] = useState(false);     // 1회 제한

  // 최초 체크: 결제 토큰 + 1회 제한
  useEffect(() => {
    const uid = getSession()?.username || null;
    const saved = localStorage.getItem(keyFor(uid)) || localStorage.getItem(KEY_BASE);
    if (saved) setLocked(true);
    setEligible(hasValidRecentPurchase());
  }, []);



  const handleClick = (idx) => {
    // 결제 토큰 없으면 막기
    if (!eligible) {
      alert("결제가 완료된 경우에만 참여할 수 있어요.");
      return;
    }
    // 이미 1회 참여했으면 막기
    if (locked) {
      alert("이벤트는 1회만 참여 가능합니다. 마이페이지에서 확인해 주세요.");
      return;
    }
    // 하나 열렸고 다른 카드 누르면 무시
    if (openedIndex !== null && idx !== openedIndex) return;
    // 이미 연 카드면 무시
    if (cards[idx].opened) return;

    // ✅ 첫 시도 시 토큰 소모 (다시 사용 못 하게)
    if (openedIndex === null) consumeRecentPurchase();

    // ✅ 당첨 여부는 여기서 한 번만 계산
    const isWin = Math.random() < WIN_RATE;

    // 상태 갱신
    setCards((prev) => {
      const next = prev.slice();
      next[idx] = { opened: true, isWin };
      return next;
    });
    if (openedIndex === null) setOpenedIndex(idx);

    // ✅ 결과 저장(마이페이지에서 읽음)
    const payload = {
      won: isWin,
      prizeName: isWin ? "present_for_you" : null,
      openedAt: new Date().toISOString(),
      source: "event_letters_v1",
    };
    try {
      const uid = getSession()?.username || null;
      localStorage.setItem(keyFor(uid), JSON.stringify(payload));
    } catch { }

    if (isWin) {
      const uid = getSession()?.username || null;
      triggerFirework()

      if (!uid) {
        alert("로그인이 필요합니다. 로그인 후 다시 시도해 주세요.");
        return; // 🚫 마이페이지 강제 이동 X
      }
      addGifts(uid, 1);   // 🎁 선물함 +1+ 
      addCoupons(uid, 1);// 🎟 쿠폰 +1
    }
  };



  return (
    <>
      <div className="a_event_wrap">
        <div className="a_event_container">
          <div className="a_event_banner">
            <div className="a_event_textbox">
              <p className="a_event_text1">“작은 행운이 담긴 편지를 열어보세요 ”</p>
              <p>당신의 하루에 작은 기쁨을 전합니다.</p>
            </div>
            {/* <img src="https://00anuyh.github.io/SouvenirImg//a_event_wh_logo.png" alt="wh_logo" className="a_event_wh_logo" /> */}

          </div>

          <div
            className={
              "a_event_mainbox " +
              (openedIndex !== null
                ? (cards[openedIndex].isWin ? "is-win" : "is-lose")
                : "")
            }
          /* style={{
            backgroundImage: 'url(https://00anuyh.github.io/SouvenirImg//a_event_background_1.jpg)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }} */
          >
            {/* 잠금/미자격 안내 */}
            {(!eligible || locked) && (
              <div className="already-msg">
                {!eligible ? (
                  <>
                    결제 완료 후에만 참여할 수 있어요.&nbsp;
                    <button onClick={goShop} className="already-btn">쇼핑하러 가기</button>
                  </>
                ) : (
                  <>
                    이미 참여하셨습니다.&nbsp;
                    <button onClick={goMyPage} className="already-btn">마이페이지 가기</button>
                  </>
                )}
              </div>
            )}
            {/* <div className="a_event_title">
              <p>“present &nbsp;&nbsp; for &nbsp;&nbsp; you”</p>
            </div> */}

            <div className="letters">
              {cards.map((c, i) => {
                const src = !c.opened ? IMG_CLOSED : c.isWin ? IMG_WIN : IMG_LOSE;
                const cls =
                  "letter" +
                  (c.opened ? " opened" : "") +
                  (c.isWin ? " win" : c.opened ? " lose" : "");

                return (
                  <div
                    key={i}
                    role="button"
                    tabIndex={0}
                    className={cls}
                    onClick={() => {
                      // 이미 열린 편지 + 당첨 → 마이페이지 이동
                      if (cards[i].opened && cards[i].isWin) {
                        goMyPage();
                        return;
                      }
                      // 아니면 기존 로직 실행
                      handleClick(i);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        if (cards[i].opened && cards[i].isWin) {
                          goMyPage();
                        } else {
                          handleClick(i);
                        }
                      }
                    }}
                    title={c.opened && c.isWin ? "마이페이지로 이동" : ""}
                  >
                    <img src={src} alt={!c.opened ? "편지" : c.isWin ? "당첨" : "꽝"} />
                  </div>
                );
              })}
            </div>

            {/* ✅ 하나라도 열렸으면, 전체 딤 + 중앙 확대 카드 */}
            {openedIndex !== null && (
              <>
                <div className="event-dim" aria-hidden="true" />
                <div className="letter-pop" role="dialog" aria-modal="true">
                  <figure className="letter-pop__frame">
                    <img
                      className="letter-pop__img"
                      src={cards[openedIndex].isWin ? IMG_WIN : IMG_LOSE}
                      alt={cards[openedIndex].isWin ? "당첨" : "꽝"}

                      onClick={() => {
                        if (cards[openedIndex].isWin) goMyPage();
                      }}
                      style={{ cursor: cards[openedIndex].isWin ? "pointer" : "default" }}
                    />
                    {!cards[openedIndex].isWin && <div className="lose-ribbon">다음 기회에…</div>}

                    <div className="letter-pop__actions">
                      <button className="letter-pop__btn btn-brown" onClick={goShop}>
                        다시 쇼핑하러 가기
                      </button>
                      <button className="letter-pop__btn btn-green" onClick={goMyPage}>
                        마이페이지 가기
                      </button>
                    </div>
                  </figure>
                </div>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default Event;
