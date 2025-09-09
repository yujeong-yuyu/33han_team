import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import "../css/Community.css";
// 기본 비워두려면 더미 데이터 import 하지 마세요
// import postsData from "../data/CommunityData.json";

function ComCard({ post }) {
  const navigate = useNavigate();
  const CommunityDetailNavigate = () => {
    navigate(`/Community3/${post.id}`);
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
      <div className="comImg" onClick={CommunityDetailNavigate}>
        <img src={mainImg} alt="커뮤이미지" />
      </div>
      <div className="comInpo">
        <div className="comUser">
          <img src={userImg} alt="커뮤회원" width="60px" />
          <p>{post.author || post.user}</p>
        </div>
        <div className="comText" onClick={CommunityDetailNavigate}>
          {post.content || post.text}
        </div>
        <div className="like-tag-mes">
          <div role="button" tabIndex={0}>
            <IoHeartOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">13</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoPricetagOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">5</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoChatbubbleEllipsesOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">7</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const writeNavigate = () => navigate("/Community2");

  // ✅ 로컬 저장 글만 사용(기본은 비어있게)
  const savedPosts = JSON.parse(localStorage.getItem("communityPosts") || "[]");
  const allPosts = savedPosts; // 개발용 더미를 합치려면 [...savedPosts, ...postsData]

  // ✅ 페이지네이션
  const PAGE_SIZE = 5; // 한 페이지에 보여줄 개수
  const [currentPage, setCurrentPage] = useState(1);

  const totalPosts = allPosts.length;
  const totalPages = Math.ceil(totalPosts / PAGE_SIZE);

  const pagePosts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return allPosts.slice(start, start + PAGE_SIZE);
  }, [allPosts, currentPage]);

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    // 필요하면 스크롤 상단 이동
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="comwarp1">
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
              <React.Fragment key={post.id ?? `p-${(currentPage - 1) * PAGE_SIZE + idx}`}>
                <ComCard post={post} />
                {idx !== pagePosts.length - 1 && <div className="comLine" />}
              </React.Fragment>
            ))}
          </>
        )}

        {/* ✅ 항상 표시되는 페이지네이션 (빈 목록이면 1/1로 고정) */}
        <div className="comPageNum" role="navigation" aria-label="페이지네이션">
          <button
            type="button"
            onClick={() => goPage(currentPage - 1)}
            disabled={totalPages <= 1 || currentPage === 1}
          >
            이전
          </button>

          {Array.from({ length: Math.max(1, totalPages) }, (_, i) => i + 1).map((n) => (
            <button
              type="button"
              key={n}
              className={n === Math.min(currentPage, Math.max(1, totalPages)) ? "active" : ""}
              onClick={() => goPage(n)}
              disabled={totalPages <= 1}  // 1페이지만 있으면 비활성
              aria-current={n === currentPage && totalPages > 0 ? "page" : undefined}
            >
              {n}
            </button>
          ))}

          <button
            type="button"
            onClick={() => goPage(currentPage + 1)}
            disabled={totalPages <= 1 || currentPage === totalPages}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
