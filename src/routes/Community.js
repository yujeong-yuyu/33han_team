// src/routes/Community.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import "../css/Community.css";

import NewsCard from "../components/NewsCard";
import postsData from "../data/CommunityData.json";    // ✅ 기본 데이터
import { useAuth } from "../context/AuthContext"; 

/* ------------------- 저장소 유틸 ------------------- */
const STORAGE_KEY = "communityPosts";         // 사용자가 작성한 글 저장
const LIKES_KEY = "communityLikes";           // id별 좋아요 저장(옵션)

const loadSavedPosts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};
const loadLikesMap = () => {
  try {
    const raw = localStorage.getItem(LIKES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};
const saveLikesMap = (map) => {
  localStorage.setItem(LIKES_KEY, JSON.stringify(map));
};

/* ------------------- 관리자 숨김 목록 ------------------- */
const HIDE_KEY = "communityAdminHidden";
const loadHiddenKeys = () => {
  try { return JSON.parse(localStorage.getItem(HIDE_KEY)) || []; }
  catch { return []; }
};
const saveHiddenKeys = (arr) => {
  localStorage.setItem(HIDE_KEY, JSON.stringify(arr));
  // 탭 동기화
  window.dispatchEvent(new StorageEvent("storage", { key: HIDE_KEY, newValue: JSON.stringify(arr) }));
};
// 간단 해시 & 키 만들기
const hashStr = (s = "") => { let h = 5381; for (let i=0;i<s.length;i++) h=((h<<5)+h)+s.charCodeAt(i); return String(h>>>0); };
const makeKey = (p) => p?.id != null ? `id:${p.id}` : `hx:${hashStr(JSON.stringify({
  author: p.author || p.user || "", text: p.content || p.text || "", img: p.image || (p.photos?.[0] ?? ""),
}))}`;

/* ------------------- 공통 카드 ------------------- */
function ComCard({ post, onLike, isAdmin, isMine, onAdminDelete }) {
  const navigate = useNavigate();
  const goDetail = () => {
    if (post.id != null) navigate(`/Community3/${post.id}`);
  };

  const userImg = post.userImg || "https://00anuyh.github.io/SouvenirImg/user.png";

  let mainImg = "/img/default-image.png";
  if (post.image) {
    mainImg = post.image;
  } else if (post.photos && post.photos.length > 0) {
    const firstPhoto = post.photos[0];
    mainImg = typeof firstPhoto === "string" ? firstPhoto : URL.createObjectURL(firstPhoto);
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
          {/* ✅ 내 글 삭제(작성자 or 관리자) — 로컬 글에만 */}
            {(post._src === "local") && (isMine || isAdmin) && (
              <button
                type="button"
                className="comDelBtn"
                title="내 글 삭제"
                onClick={() => onAdminDelete?.(post)}
              >
                삭제
              </button>
            )}
          <div role="button" tabIndex={0} onClick={() => onLike?.(post)}>
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

/* ------------------- 페이지 ------------------- */
export default function Community() {
  const navigate = useNavigate();
  const { isLoggedIn, logoutAll, user, isAdmin: isAdminFn } = useAuth(); // ✅ 로그인/권한/사용자

  const writeNavigate = () => {
    if (!isLoggedIn?.local) {
      const goLogin = window.confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?");
      if (goLogin) navigate("/Login");
      return;
    }
    navigate("/Community2");
  };

  /* 관리자 */
  const isAdmin = useMemo(() => {
   try {
     if (typeof isAdminFn === "function") return !!isAdminFn();
   } catch {}
   return !!(
     user?.role === "admin" ||
     user?.isAdmin === true ||
     isLoggedIn?.role === "admin" ||
     isLoggedIn?.admin === true
   );
  }, [isAdminFn, user, isLoggedIn]);

  /* ===== 커뮤니티 글: 로컬 + JSON 통합 ===== */
  const [likesMap, setLikesMap] = useState(() => loadLikesMap());
  const [posts, setPosts] = useState(() => {
    const saved = loadSavedPosts().map(p => ({ ...p, _src: "local" }));
    const base  = (Array.isArray(postsData) ? postsData : []).map(p => ({ ...p, _src: "seed" }));
    const lm = loadLikesMap();
    const merged = [...saved, ...base].map(p =>
      p?.id != null && lm[p.id] != null ? { ...p, likes: lm[p.id] } : p
    );
    const hidden = new Set(loadHiddenKeys());
    return merged.filter(p => !hidden.has(makeKey(p)));
  });

  // 여러 탭/페이지에서 저장소 변경시 동기화
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY || e.key === LIKES_KEY || e.key === HIDE_KEY) {
        const saved = loadSavedPosts().map(p => ({ ...p, _src: "local" }));
        const base  = (Array.isArray(postsData) ? postsData : []).map(p => ({ ...p, _src: "seed" }));
        const lm = loadLikesMap();
        setLikesMap(lm);
        const merged = [...saved, ...base].map((p) =>
          p?.id != null && lm[p.id] != null ? { ...p, likes: lm[p.id] } : p
        );
        const hidden = new Set(loadHiddenKeys());
        setPosts(merged.filter(p => !hidden.has(makeKey(p))));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 좋아요 증가
  const handleLike = useCallback((target) => {
    setPosts((prev) => {
      const next = prev.map((p) => {
        const isTarget = (target.id != null && p.id === target.id) || p === target;
        return isTarget ? { ...p, likes: Number(p.likes || 0) + 1 } : p;
      });
      // id가 있는 포스트만 로컬 likesMap에 저장
      if (target.id != null) {
        setLikesMap((m) => {
          const updated = { ...m, [target.id]: Number((m[target.id] ?? target.likes ?? 0)) + 1 };
          saveLikesMap(updated);
          return updated;
        });
      }
      return next;
    });
  }, []);

  // 관리자/작성자 삭제(로컬은 실제 삭제, 시드는 숨김)
  const handleAdminDelete = useCallback((target) => {
    if (!window.confirm("이 게시글을 삭제/숨김 처리할까요?")) return;

    if (target._src === "local") {
      // 로컬 글 실제 삭제
      const saved = loadSavedPosts();
      const newSaved = saved.filter(p => {
        if (target.id != null) return p.id !== target.id;
        try { return JSON.stringify(p) !== JSON.stringify(target); }
        catch { return true; }
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSaved));
      window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY, newValue: JSON.stringify(newSaved) }));

      const base = (Array.isArray(postsData) ? postsData : []).map(p => ({ ...p, _src: "seed" }));
      const lm = loadLikesMap();
      const merged = [...newSaved.map(p => ({ ...p, _src: "local" })), ...base].map(p =>
        p?.id != null && lm[p.id] != null ? { ...p, likes: lm[p.id] } : p
      );
      const hidden = new Set(loadHiddenKeys());
      const next = merged.filter(p => !hidden.has(makeKey(p)));
      setPosts(next);
      const nextTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setCurrentPage(prev => Math.min(prev, nextTotalPages));
      return;
    }

    // 시드(기본 JSON) 글은 숨김만
    const key = makeKey(target);
    const list = loadHiddenKeys();
    if (!list.includes(key)) {
      list.push(key);
      saveHiddenKeys(list);
    }
    setPosts(prev => prev.filter(p => makeKey(p) !== key));
    const nextTotalPages = Math.max(1, Math.ceil(Math.max(0, posts.length - 1) / PAGE_SIZE));
    setCurrentPage(prev => Math.min(prev, nextTotalPages));
  }, [posts]);

  // 내가 쓴 글 판별 (여러 필드 대비)
  const isSame = (a, b) =>
    a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

  const isPostMine = useCallback((post) => {
    if (post?._src !== "local") return false;
    const u = user || {};
    return (
      isSame(post.author, u.nickname) ||
      isSame(post.user, u.name) ||
      isSame(post.loginId, u.loginId) ||
      post.userId === u.uid ||
      post.ownerId === u.uid
    );
  }, [user]);

  // 페이지네이션
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

  /* ===== 뉴스 배너 (인테리어) ===== */
  const [slides, setSlides] = useState([]);
  const [slideIdx, setSlideIdx] = useState(0);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState("");

  useEffect(() => {
  // 1) CRA/Vite 둘 다 대응
  const NEWS_KEY =
    import.meta?.env?.VITE_NEWS_KEY ||
    process.env.REACT_APP_NEWS_KEY;

  if (!NEWS_KEY) {
    setNewsLoading(false);
    setNewsError("NEWS API 키가 없습니다. .env에 REACT_APP_NEWS_KEY 또는 VITE_NEWS_KEY를 설정하세요.");
    return;
  }

  // 2) 키워드 (너무 많으면 500자 넘으니 청크로 분할)
  const KEYWORDS = [
    "Kelly Wearstler", "Ilse Crawford", "Patricia Urquiola", "India Mahdavi",
    "Philippe Starck", "Pierre Yovanovitch", "Jean-Louis Deniot",
    "Axel Vervoordt", "Vincent Van Duysen", "John Pawson",
    "Faye Toogood", "Peter Marino", "Joseph Dirand",
    "Nate Berkus", "Jeremiah Brent", "Sarah Sherman Samuel",
    "Roman and Williams", "Dimore Studio", "Studio KO", "Studio Peregalli",
    "Yabu Pushelberg", "Rockwell Group", "Clodagh",
    "Vitra", "Knoll", "Herman Miller", "Cassina", "B&B Italia", "Minotti", "Poliform",
    "Flos", "Artemide", "Louis Poulsen", "FLOS", "Gubi", "Kartell",
    "Hay", "Muuto", "Menu", "Ferm Living", "andTradition", "Artek",
    "mid-century modern", "scandinavian interior", "japandi", "minimalist interior",
    "minimalist home", "modern interior", "living room ideas", "brutalist interior",
    "interior design", "wellness interior"
  ];

  // q 길이가 500자를 넘지 않도록 키워드 묶음으로 나누기
  const buildQueryBatches = (keywords, maxLen = 480) => {
    const batches = [];
    let cur = [];

    const pushOrNew = (kw) => {
      const candidate = [...cur, kw].join(" OR ");
      if (candidate.length > maxLen) {
        if (cur.length) batches.push(cur.join(" OR "));
        cur = [kw];
      } else {
        cur.push(kw);
      }
    };

    keywords.forEach(pushOrNew);
    if (cur.length) batches.push(cur.join(" OR "));
    return batches;
  };

  const queryBatches = buildQueryBatches([...new Set(KEYWORDS)]);

  const from = new Date();
  from.setDate(from.getDate() - 14);
  const fromISO = from.toISOString();

  const toSlides = (articles = []) =>
    articles.map((a) => ({
      img: a.urlToImage || "https://via.placeholder.com/620x311?text=No+Image",
      source: a.source?.name || "뉴스",
      time: new Date(a.publishedAt || Date.now()).toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: a.title || "",
      url: a.url,
      likes: Math.floor(Math.random() * 10),
      comments: Math.floor(Math.random() * 5),
    }));

  const buildUrl = (q, lang /* 'ko' | 'en' | undefined */) => {
    const u = new URL("https://newsapi.org/v2/everything");
    u.searchParams.set("q", q);
    u.searchParams.set("searchIn", "title,description");
    u.searchParams.set("sortBy", "publishedAt");
    u.searchParams.set("pageSize", "10"); // 청크당 넉넉히 받아서 나중에 상위만 사용
    u.searchParams.set("from", fromISO);
    if (lang) u.searchParams.set("language", lang); // 한 번에 하나만!
    return u.toString();
  };

  const fetchAll = async (lang) => {
    const all = [];
    for (const q of queryBatches) {
      const res = await fetch(buildUrl(q, lang), {
        headers: { "X-Api-Key": NEWS_KEY }
      });
      const data = await res.json();
      if (data.status !== "ok") {
        // 500자 초과, rate limit, etc 메시지 확인용 로그
        console.warn("[NewsAPI]", lang, data);
        continue;
      }
      all.push(...(data.articles || []));
    }
    return all;
  };

  const dedupeByUrl = (arr) => {
    const seen = new Set();
    return arr.filter((a) => {
      const key = a.url || a.title;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const fetchNews = async () => {
    setNewsLoading(true);
    setNewsError("");
    try {
      // 1차: 한국어
      let articles = await fetchAll("ko");

      // 부족하면 2차: 영어도 합치기
      if (articles.length < 5) {
        const en = await fetchAll("en");
        articles = [...articles, ...en];
      }

      // 정렬 + 중복 제거 + 상위 N개
      const cleaned = dedupeByUrl(articles)
        .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
        .slice(0, 10);

      if (!cleaned.length) {
        setSlides([]);
        setNewsError("최근 2주 내 관련 기사가 없습니다.");
        return;
      }

      setSlides(toSlides(cleaned.slice(0, 5)));
    } catch (e) {
      console.error("[NewsAPI] failed:", e);
      setNewsError("인테리어 관련 뉴스를 불러오지 못했습니다.");
      setSlides([]);
    } finally {
      setNewsLoading(false);
    }
  };

  fetchNews();
}, []);

  const totalSlides = slides.length;
  const nextSlide = useCallback(() => {
    setSlideIdx((i) => (i + 1) % Math.max(1, totalSlides));
  }, [totalSlides]);
  const prevSlide = useCallback(() => {
    setSlideIdx((i) => (i - 1 + Math.max(1, totalSlides)) % Math.max(1, totalSlides));
  }, [totalSlides]);

  /* ===== 렌더 ===== */
  return (
    <div className="comwarp1">
      {/* 뉴스 배너 */}
      <div className="newsBanner">
        {newsLoading ? (
          <p>뉴스 불러오는 중...</p>
        ) : newsError ? (
          <p>{newsError}</p>
        ) : totalSlides > 0 ? (
          <NewsCard
            {...slides[slideIdx]}
            index={slideIdx}
            total={totalSlides}
            onPrev={totalSlides > 1 ? prevSlide : undefined}
            onNext={totalSlides > 1 ? nextSlide : undefined}
          />
        ) : (
          <p>표시할 인테리어 뉴스가 없습니다.</p>
        )}
      </div>

      {/* 타이틀 */}
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      {/* 탭/작성하기 */}
      <div className="comTap">
        <button type="button" className="combtn">내 글 찾기</button>
        <button type="button" className="combtn">나의 활동</button>
        <button type="button" className="combtn" onClick={writeNavigate}>
          작성하기
        </button>
      </div>

      {/* 리스트 + 페이지네이션 */}
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
            {pagePosts.map((post, idx) => {
              const mine = isPostMine(post);
              return (
                <React.Fragment key={post.id ?? `p-${(currentPage - 1) * PAGE_SIZE + idx}`}>
                  <ComCard
                    post={post}
                    onLike={handleLike}
                    isAdmin={isAdmin}
                    isMine={mine}
                    onAdminDelete={handleAdminDelete}
                  />
                  {idx !== pagePosts.length - 1 && <div className="comLine" />}
                </React.Fragment>
              );
            })}
          </>
        )}

        <div className="comPageNum" role="navigation" aria-label="페이지네이션">
          <button
            type="button"
            onClick={() => goPage(currentPage - 1)}
            disabled={Math.max(1, totalPages) <= 1 || currentPage === 1}
          >
            이전
          </button>

          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((n) => {
            const active = n === Math.min(currentPage, Math.max(1, totalPages));
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
            disabled={Math.max(1, totalPages) <= 1 || currentPage === totalPages}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
