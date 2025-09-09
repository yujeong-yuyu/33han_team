// BrowserRouter는 index.js에서만! (App에는 넣지 마세요)
import "./App.css";
import { Routes, Route, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import ScrollToTop from "./components/ScrollToTop";
import PageFade from "./components/PageFade";
import Intro from "./routes/Intro";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import AdminSetup from "./routes/AdminSetup";

import MainPage from "./routes/MainPage";
import LifeStyle from "./routes/LifeStyle";
import Lighting from "./routes/Lighting";
import Objects from "./routes/Objects";
import Community from "./routes/Community";
import Community2 from "./routes/Community2";
import Community3 from "./routes/Community3";
import Detail from "./routes/Detail";
import Cart from "./routes/Cart";
import Payment from "./routes/Payment";
import Payment2 from "./routes/Payment2";
import Login from "./routes/Login";
import MyPage from "./routes/MyPage";
import Event from "./routes/Event";
import Favorites from "./routes/Favorites";
import Best from "./routes/Best";

/* =========================
   ✅ 인라인 스플래시 오버레이 (비디오 배경 + 중앙 2rem 텍스트)
   2.5초 후 자동 페이드아웃 & 언마운트 콜백
   ========================= */
function SplashOverlay({
  text = "Souvenir",
  videoSrc = "/videos/intro.mp4",
  poster = "",
  duration = 2500, // ms
  onDone,
}) {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setFade(true), duration);
    return () => clearTimeout(t);
  }, [duration]);

  const onEnd = (e) => {
    if (e.propertyName === "opacity" && fade) onDone?.();
  };

  const wrapStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    background: "#000",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    opacity: fade ? 0 : 1,
    visibility: fade ? "hidden" : "visible",
    transition: "opacity 0.6s ease, visibility 0s linear 0.6s",
  };

  const videoStyle = {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const textWrap = {
    position: "relative",
    zIndex: 1,
    display: "grid",
    placeItems: "center",
    padding: "0 20px",
    textAlign: "center",
  };

  const textStyle = {
    fontSize: "2rem", // 요청: 2rem
    color: "#fff",
    lineHeight: 1.2,
    letterSpacing: "0.02em",
  };

  return (
    <div style={wrapStyle} onTransitionEnd={onEnd} aria-hidden={fade}>
      <video
        style={videoStyle}
        autoPlay
        muted
        playsInline
        preload="auto"
        {...(poster ? { poster } : {})}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>
      <div style={textWrap}>
        <p style={textStyle}>{text}</p>
      </div>
    </div>
  );
}

/* =========================
   레이아웃 래퍼들
   ========================= */
function WithHeaderFade() {
  return (
    <>
      <Header />
      {/* ✨ 페이드는 헤더 레이아웃 자식에만 */}
      <PageFade>
        <Outlet />
      </PageFade>
    </>
  );
}

function WithoutHeader() {
  // Detail 등 fixed/sticky 민감한 페이지
  return <Outlet />;
}

export default function App() {
  const [showChatbot, setShowChatbot] = useState(false);

  // ✅ 최초 진입 시 스플래시 노출
  const [showSplash, setShowSplash] = useState(true);

  // ✅ 푸터와 겹치는 만큼만 플로팅 UI를 위로 밀기 (사라지지 않음)
  useEffect(() => {
    const footer =
      document.querySelector("footer") || document.getElementById("app-footer");
    if (!footer) return;

    const updatePushUp = () => {
      const rect = footer.getBoundingClientRect();
      const vh = window.innerHeight || 0;
      const overlap = Math.max(0, vh - Math.max(rect.top, 0));
      const push = overlap > 0 ? `${overlap}px` : "0px";
      document.documentElement.style.setProperty("--fab-push-up", push);
    };

    updatePushUp();
    const onScrollResize = () => updatePushUp();
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize);

    const io = new IntersectionObserver(() => updatePushUp(), {
      root: null,
      threshold: [0, 0.01, 0.1, 0.5, 1],
    });
    io.observe(footer);

    return () => {
      window.removeEventListener("scroll", onScrollResize);
      window.removeEventListener("resize", onScrollResize);
      io.disconnect();
    };
  }, []);

  return (
    <>
      {/* ✅ 스플래시 오버레이: 2.5초 후 페이드아웃 → 언마운트 */}
      {showSplash && (
        <SplashOverlay
          text="Souvenir"
          videoSrc="/videos/intro.mp4"   // 경로에 맞게 교체
          poster="/images/intro-poster.jpg" // 선택 사항
          duration={2500}
          onDone={() => setShowSplash(false)}
        />
      )}

      {/* 라우트 변경 시 상단으로 (부드럽게) */}
      <ScrollToTop />

      <div className="Warp">
        <Routes>
          <Route path="/" element={<Intro />} />
          {/* 헤더 포함 레이아웃(페이드 O) */}
          <Route element={<WithHeaderFade />}>
            <Route index element={<MainPage />} />
            <Route path="lifestyle" element={<LifeStyle />} />
            <Route path="lighting" element={<Lighting />} />
            <Route path="objects" element={<Objects />} />
            <Route path="community" element={<Community />} />
            <Route path="community2" element={<Community2 />} />
            <Route path="community3/:id" element={<Community3 />} />
            <Route path="cart" element={<Cart />} />
            <Route path="payment" element={<Payment />} />
            <Route path="payment2" element={<Payment2 />} />
            <Route path="event" element={<Event />} />
            <Route path="mypage" element={<MyPage />} />
            <Route path="login" element={<Login />} />
            <Route path="favorites" element={<Favorites />} />
            <Route path="best" element={<Best />} />
            <Route path="/admin-setup" element={<AdminSetup />} />
          </Route>

          {/* 헤더 없음(페이드 X): Detail 보호 */}
          <Route element={<WithoutHeader />}>
            <Route path="detail/:slug" element={<Detail />} />
            <Route path="detail" element={<Detail />} />
          </Route>

          <Route
            path="*"
            element={<div style={{ padding: 40 }}>페이지를 찾을 수 없어요.</div>}
          />
        </Routes>

        {/* 플로팅 챗봇 버튼: 모달이 열리면 숨김 */}
        {!showChatbot && (
          <button
            type="button"
            className="floating-ask"
            onClick={() => setShowChatbot(true)}
            aria-label="도움이 필요하신가요?"
          >
            <img src="/img/askicon.png" width="60" alt="help" />
          </button>
        )}

        {/* 챗봇 모달 (푸터 겹침은 CSS 변수로 자동 보정) */}
        {showChatbot && <Chatbot onClose={() => setShowChatbot(false)} />}
      </div>

      <Footer />
    </>
  );
}
