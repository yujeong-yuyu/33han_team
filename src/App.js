// BrowserRouter는 index.js에서만! (App에는 넣지 마세요)
import "./App.css";
import { Routes, Route, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";

import ScrollToTop from "./components/ScrollToTop";
import PageFade from "./components/PageFade";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";

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

  // ✅ 푸터와 겹치는 만큼만 플로팅 UI를 위로 밀기 (사라지지 않음)
  useEffect(() => {
    const footer = document.querySelector("footer") || document.getElementById("app-footer");
    if (!footer) return;

    const updatePushUp = () => {
      const rect = footer.getBoundingClientRect();
      const vh = window.innerHeight || 0;

      // 푸터가 보이는(겹치는) 픽셀 수
      const overlap = Math.max(0, vh - Math.max(rect.top, 0));
      // 살짝 띄우고 싶으면 + 여유버퍼(px) 가능
      const push = overlap > 0 ? `${overlap}px` : "0px";
      document.documentElement.style.setProperty("--fab-push-up", push);
    };

    // 초기 1회
    updatePushUp();

    // 스크롤/리사이즈 보강
    const onScrollResize = () => updatePushUp();
    window.addEventListener("scroll", onScrollResize, { passive: true });
    window.addEventListener("resize", onScrollResize);

    // IntersectionObserver로 정밀 감지
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
      {/* 라우트 변경 시 상단으로 (부드럽게) */}
      <ScrollToTop />

      <div className="Warp">
        <Routes>
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