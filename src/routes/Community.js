import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import "../css/Community.css";
import NewsCard from "../components/NewsCard";

/* ----- 저장소 유틸 ----- */
const STORAGE_KEY = "communityPosts";
const loadPosts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const savePosts = (list) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(
    new CustomEvent("communityPosts:updated", { detail: { posts: list } })
  );
};

function ComCard({ post, onLike }) {
  const navigate = useNavigate();
  const goDetail = () => {
    if (post.id != null) navigate(`/Community3/${post.id}`);
  };

  const userImg =
    post.userImg || "https://00anuyh.github.io/SouvenirImg/user.png";

  let mainImg = "/img/default-image.png";
  if (post.image) {
    mainImg = post.image;
  } else if (post.photos && post.photos.length > 0) {
    const firstPhoto = post.photos[0];
    mainImg =
      typeof firstPhoto === "string"
        ? firstPhoto
        : URL.createObjectURL(firstPhoto);
  }

  return (
    <div className="comBox">
      <div className="comImg" onClick={goDetail}>
        <img src={mainImg} alt="커뮤이미지" />
      </div>
      <div className="comInpo">
        <div className="comUser">
          <img src={userImg} alt="커뮤회원" width="60" height="60" />
          <p>{post.author || post.user || "익명"}</p>
        </div>

        <div className="comText" onClick={goDetail}>
          {post.content || post.text || ""}
        </div>

        <div className="like-tag-mes">
          <div role="button" tabIndex={0} onClick={() => onLike(post)}>
            <IoHeartOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">{Number(post.likes || 0)}</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoPricetagOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">{Number(post.tagsCount || 0)}</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoChatbubbleEllipsesOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">{Number(post.commentsCount || 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const writeNavigate = () => navigate("/Community2");

  /* ------------------- 커뮤니티 글 ------------------- */
  const [posts, setPosts] = useState(() => loadPosts());

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setPosts(loadPosts());
    };
    const onCustom = () => setPosts(loadPosts());
    window.addEventListener("storage", onStorage);
    window.addEventListener("communityPosts:updated", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("communityPosts:updated", onCustom);
    };
  }, []);

  const handleLike = useCallback((target) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        const isTarget =
          (target.id != null && p.id === target.id) || p === target;
        return isTarget
          ? { ...p, likes: Number(p.likes || 0) + 1 }
          : p;
      });
      savePosts(next);
      return next;
    });
  }, []);

  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);

  const totalPosts = posts.length;
  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  const pagePosts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return posts.slice(start, start + PAGE_SIZE);
  }, [posts, currentPage]);

  const goPage = (p) => {
    if (p < 1 || p > Math.max(1, totalPages)) return;
    setCurrentPage(p);
  };

  /* ------------------- 뉴스 API ------------------- */
  const [slides, setSlides] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(
          `https://newsapi.org/v2/everything?q=인테리어&language=ko&pageSize=5&sortBy=publishedAt&apiKey=${process.env.REACT_APP_NEWS_KEY}`
        );
        const data = await res.json();

        if (data.articles) {
          const mapped = data.articles.map((a) => ({
            img:
              a.urlToImage ||
              "https://via.placeholder.com/620x311?text=No+Image",
            source: a.source?.name || "뉴스",
            time: new Date(a.publishedAt).toLocaleString("ko-KR", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            title: a.title || "",
            likes: Math.floor(Math.random() * 10), // 임의값
            comments: Math.floor(Math.random() * 5), // 임의값
          }));
          setSlides(mapped);
        }
      } catch (err) {
        console.error("뉴스 불러오기 실패:", err);
      }
    };

    fetchNews();
  }, []);

  const totalSlides = slides.length;
  const nextSlide = useCallback(() => {
    setSlideIdx((i) => (i + 1) % totalSlides);
  }, [totalSlides]);
  const prevSlide = useCallback(() => {
    setSlideIdx((i) => (i - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  /* ------------------- 렌더 ------------------- */
  return (
    <div className="comwarp1">
      <div className="newsBanner">
        {slides.length > 0 ? (
          <NewsCard
            {...slides[slideIdx]}
            index={slideIdx}
            total={totalSlides}
            onPrev={totalSlides > 1 ? prevSlide : undefined}
            onNext={totalSlides > 1 ? nextSlide : undefined}
          />
        ) : (
          <p>뉴스 불러오는 중...</p>
        )}
      </div>

      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      <div className="comTap">
        <button type="button" className="combtn">내 글 찾기</button>
        <button type="button" className="combtn">나의 활동</button>
        <button type="button" className="combtn" onClick={writeNavigate}>
          작성하기
        </button>
      </div>

      <div className="comList">
        {totalPosts === 0 ? (
          <div className="comEmpty">
            <p>아직 올라온 글이 없어요.</p>
            <button type="button" className="combtn" onClick={writeNavigate}>
              첫 글 작성하기
            </button>
          </div>
        ) : (
          <>
            {pagePosts.map((post, idx) => (
              <React.Fragment
                key={post.id ?? `p-${(currentPage - 1) * PAGE_SIZE + idx}`}
              >
                <ComCard post={post} onLike={handleLike} />
                {idx !== pagePosts.length - 1 && <div className="comLine" />}
              </React.Fragment>
            ))}
          </>
        )}

        <div
          className="comPageNum"
          role="navigation"
          aria-label="페이지네이션"
        >
          <button
            type="button"
            onClick={() => goPage(currentPage - 1)}
            disabled={Math.max(1, totalPages) <= 1 || currentPage === 1}
          >
            이전
          </button>

          {Array.from(
            { length: Math.max(1, totalPages) },
            (_, i) => i + 1
          ).map((n) => {
            const active =
              n === Math.min(currentPage, Math.max(1, totalPages));
            return (
              <button
                type="button"
                key={n}
                className={active ? "active" : ""}
                onClick={() => goPage(n)}
                disabled={totalPages <= 1}
                aria-current={active ? "page" : undefined}
              >
                {n}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => goPage(currentPage + 1)}
            disabled={
              Math.max(1, totalPages) <= 1 || currentPage === totalPages
            }
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
