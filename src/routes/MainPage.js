import React, { memo, useRef, useEffect, useState, useMemo, useCallback  } from "react";
import { Link } from "react-router-dom";

/* 스와이퍼 */
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// 필수 CSS
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/* 유정추가 */
import { useAuth } from "../context/AuthContext";
import WeatherCard from "../components/WeatherCard";

/* Icons */
import { IoMdCart, IoMdHeart, IoMdPhotos, IoIosClock } from "react-icons/io";
import { GiCardboardBoxClosed } from "react-icons/gi";
import { RiDiscountPercentFill, RiTruckFill } from "react-icons/ri";
import { BsFillHouseHeartFill } from "react-icons/bs";
import { TiArrowRightThick } from "react-icons/ti";

/* CSS */
import "../css/MainPage.css";

import products from '../data/detailData.json';

/* ----------------------------- 공통 데이터/옵션 ----------------------------- */
const DETAIL_SLUG = "lamp-amber-002"; // detailData.json과 동일한 슬러그로 맞춰 주세요

const NAV_ITEMS = [
  { label: "장바구니", Icon: IoMdCart, href: "#none" },
  { label: "즐겨찾기", Icon: IoMdHeart, href: "/favorites" },
  { label: "커뮤니티", Icon: IoMdPhotos, href: "/community" },
  { label: "살림살이", Icon: GiCardboardBoxClosed, href: "#none" },
  { label: "당일특가", Icon: IoIosClock, href: "#none" },
  { label: "할인품목", Icon: RiDiscountPercentFill, href: "#none" },
  { label: "배송문의", Icon: RiTruckFill, href: "#none" },
  { label: "리모델링", Icon: BsFillHouseHeartFill, href: "#none" },
];

const COMMUNITY_POSTS = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  bgClass: `sec3bg${i + 1}`,
  href: "/community",
  tag: "진**님의 글",
  date: "2025.01.01",
  title: "독특하게 앞쪽에 절개 디자인이 들어가서 은은하게 돋보이는 것 같아요",
}));

const autoplayFast = { delay: 1500, disableOnInteraction: false };
const loopSpeed = (speed = 600) => ({ speed, loop: true });

/* ----------------------------- 내부 컴포넌트 ----------------------------- */

const Banner = memo(function Banner() {
  const imgs = ["banner1.png", "banner2.png", "banner3.png"];
  return (
    <div className="banner">
      <ul className="banul" aria-label="메인 배너">
        {imgs.map((src) => (
          <li key={src}>
            <a href="#none">
              <img loading="lazy" src={`${process.env.PUBLIC_URL}/img/${src}`} alt="메인 배너" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
});

const MyInfo = memo(function MyInfo() {
  const { isLoggedIn, user } = useAuth();
  return (
    <div className="myinpo">
      <div className="myinpotop">
        <WeatherCard lat={37.5665} lon={126.978} />
        <p>
          <span className="main_nickname">{isLoggedIn?.local ? `${user?.name}님 반갑습니다` : "로그인 후 이용 해 주세요."}</span>{" "}
          
        </p>
      </div>
      <div className="myinpobottom">
        <ul className="myinpoul">
          <li className="ban2slide ban2img1" />
          <li className="ban2slide ban2img2" />
          <li className="ban2slide ban2img3" />
        </ul>
      </div>
    </div>
  );
});

/* const QuickNav = memo(function QuickNav() {
  return (
    <nav id="subnav" aria-label="빠른 메뉴">
      <ul id="menu3">
        {NAV_ITEMS.map(({ label, Icon, href }) => (
          <li key={label}>
            <Link to={href} aria-label={label}>
              <Icon />
            </Link>
            {label}
          </li>
        ))}
      </ul>
    </nav>
  );
}); */

const EditorsPick = memo(function EditorsPick() {
  return (
    <>
      <h3>Editor's Pick !</h3>
      <div className="sec1">
        <ul className="sec1ul">
          <li className="sec1img num1">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
          <li className="sec1img num2">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
          <li className="sec1li">
            <span>편안한 순간을 밝혀주는 에디터의 픽</span>
            <p>
              은은한 조명으로 어느 공간에서도 <br />
              잘 어울리는 디자인 입니다. <br />
              단순히 공간을 밝히는 데 그치지 않고, <br />
              공간에 따스함과 편안함을 불어넣어줍니다.
            </p>
          </li>
          <li className="sec1li">
            <span>이 소품들이 전하는 감성</span>
            <p>
              공간을 밝히는 것만이 아니라, <br />
              당신의 하루 끝에 따스함을 더합니다.
              <br />
              빛이 머무는 공간을 은은하게 <br />
              채워줍니다.
            </p>
          </li>
          <li className="sec1img num3">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
          <li className="sec1img num4">
            <a href="#none">
              <p>
                Shop Now <TiArrowRightThick />
              </p>
            </a>
          </li>
        </ul>
        <div className="sec1ban">
          {/* 고정된 추천 상품으로 이동 */}
          <Link to={`/detail/${DETAIL_SLUG}`} className="sec1img num5">
            <p>
              Shop Now <TiArrowRightThick />
            </p>
          </Link>
        </div>
      </div>
    </>
  );
});


const BestGrid = memo(function BestGrid() {
  // detailData.json은 배열이므로 그대로 사용
  // 필요 시 상위 N개만 노출 (여기선 5개)
  const BEST_COUNT = 5;

  // 가격 포맷 (문자열 "₩36,000"도 그대로 보여줌)
  const formatPrice = (price) => price ?? "";

  // 썸네일: gallery[0] 사용, 절대/상대 경로 모두 대응
  const resolveImg = (src) => {
    if (!src) return "/img/placeholder.png";       // 없을 때 대체 이미지(선택)
    if (/^https?:\/\//i.test(src)) return src;     // 절대 URL
    return src.startsWith("/") ? src : `${process.env.PUBLIC_URL}/${src.replace(/^\.?\//, "")}`;
  };

  // 베스트 기준을 아직 정하지 않았다면, 파일 순서를 그대로 사용
  // (원하면 popularity 등 기준 생기면 여기서 정렬해 주세요)
  const bestItems = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    return list.slice(0, BEST_COUNT);
  }, []);

  const [liked, setLiked] = useState(() => new Set());
const toggleLike = useCallback((id) => {
  setLiked((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
}, []);

// --- 🛒 장바구니 (연결 전 임시) ---
const handleAddToCart = useCallback((item) => (e) => {
  e.preventDefault();
  e.stopPropagation();
  // TODO: 프로젝트의 장바구니 로직으로 교체 (예: dispatch, context 등)
  console.log("add to cart:", item);
}, []);
  return (
    <>
      <h3>BEST</h3>

      <div className="sec2">
        {bestItems.map((item, idx) => {
          const slug = item.id;
          const name = item.product?.name ?? "";
          const price = item.product?.price ?? "";
          const thumb = resolveImg(item.gallery?.[0]);
          const isFav = liked.has(slug);

          return (
           <Link
              key={slug ?? idx}
              to={`/detail/${slug}`}
              className="sec2Slide"
              aria-label={name}
            >
              {/* 배경 이미지 레이어: 호버 줌/오버레이용 */}
              <span
                className="sec2-bg"
                style={{ backgroundImage: `url(${thumb})` }}
                aria-hidden="true"
              />

              {/* 프리로드/접근성용 */}
              <img src={thumb} alt={name} loading="lazy" style={{ display: "none" }} />

              {/* 캡션 (호버 시 나타남) */}
              <div className="product-caption">
                <span className="product-name">{name}</span>
                <span className="product-price">{formatPrice(price)}</span>
              </div>

              {/* 아이콘 버튼들 */}
              <button
                className="icon-btn like"
                type="button"
                aria-pressed={isFav ? "true" : "false"}
                aria-label={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                title={isFav ? "즐겨찾기 제거" : "즐겨찾기 추가"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleLike(slug);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12.1 21s-6.4-4.2-9-6.8A5.8 5.8 0 0 1 12 6a5.8 5.8 0 0 1 8.9 8.3c-2.6 2.7-8.8 6.7-8.8 6.7z"
                    fill={isFav ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              <button
                className="icon-btn cart"
                type="button"
                aria-label="장바구니 담기"
                title="장바구니 담기"
                onClick={handleAddToCart(item)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 8h12l-1.2 12H7.2L6 8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </Link>

          );
        })}
      </div>

      <div className="sec2more">
        <Link to="/best">
          <img src="/img/more.png" alt="더보기" />
          <div className="sec2Arrow">
            <img src="/img/Vector.png" alt="더보기" />
          </div>
        </Link>
      </div>
    </>
  );
}, [products]);

const CommunitySwiper = memo(function CommunitySwiper() {
  return (
    <>
      <h3>Community</h3>
      <div className="sec3">
        <Swiper
          className="mySwiper Community-swiper"
          modules={[Navigation, Autoplay]}
          slidesPerView={4.8}
          spaceBetween={90}
          {...loopSpeed(700)}
          autoplay={autoplayFast}
          navigation
        >
          {COMMUNITY_POSTS.map((post) => (
            <SwiperSlide key={post.id}>
              <div className="sec3card">
                <div className={`sec3bg ${post.bgClass}`}>
                  <Link to={post.href}>글 보러가기</Link>
                </div>
                <div className="card-text">
                  <p className="sec3tag">{post.tag}</p>
                  <p className="sec3date">{post.date}</p>
                  <p className="sec3title">{post.title}</p>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </>
  );
});
const EndHeroSwiper = memo(function EndHeroSwiper() {
  const slides = [
    { cls: "sec4img1", title: "Elevate Your Everyday", desc: "Where Comfort Meets Timeless Design" },
    { cls: "sec4img2", title: "Coming Soon", desc: "Wrapped in Warmth, Styled for Life" },
    { cls: "sec4img3", title: "The Art of Giving", desc: "Thoughtful Pieces for Every Home" },
  ];

  return (
   <div className="sec4 full-bleed">
  <Swiper
    className="end-swiper"
    modules={[Pagination, Autoplay]}
    slidesPerView={1}
    {...loopSpeed(800)}
    autoplay={autoplayFast}
    pagination={{
      clickable: true,
      // 점 대신 막대
      renderBullet: (_i, className) => `<span class="${className}"></span>`,
    }}
  >
    {slides.map((s) => (
      <SwiperSlide key={s.cls}>
        <div className={s.cls}>
          <span>{s.title}</span>
          <p>{s.desc}</p>
        </div>
      </SwiperSlide>
    ))}
  </Swiper>
</div>
  );
});


/* ----------------------------- 메인 페이지 (export 단일) ----------------------------- */

export default function MainPage() {
  return (
    <div className="mainwarp">
      {/* 메인배너 + 인포 */}
      <main id="mainban">
        <Banner />
        <MyInfo />
      </main>

      {/* 서브메뉴 */}
      {/* <QuickNav /> */}

      {/* 섹션 1 */}
      <section id="mainsec1">
        <EditorsPick />
      </section>

      {/* 섹션 2 */}
      <section id="mainsec2">
        <BestGrid />
      </section>

      {/* 섹션 3 */}
      <section id="mainsec3">
        <CommunitySwiper />
      </section>

      {/* 섹션 4 */}
      <section id="mainsec4">
        <EndHeroSwiper />
      </section>
    </div>
  );
}
