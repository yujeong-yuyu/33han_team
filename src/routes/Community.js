import React from "react";
import { useNavigate } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import "../css/Community.css";
import postsData from "../data/CommunityData.json"; // 기존 데이터
import { useAuth } from "../context/AuthContext"; // AuthContext 불러오기

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
            <span className="ltm-num">20</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoPricetagOutline className="ltm-icon" aria-hidden="true" />
            <span className="ltm-num">20</span>
          </div>
          <div role="button" tabIndex={0}>
            <IoChatbubbleEllipsesOutline
              className="ltm-icon"
              aria-hidden="true"
            />
            <span className="ltm-num">20</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Community() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth(); // 로그인 상태 가져오기

  const writeNavigate = () => {
  if (!isLoggedIn?.local) {
    const goLogin = window.confirm("로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?");
    if (goLogin) {
      navigate("/Login");
    }
    return; // 로그인 안 되면 이동 차단
  }
  navigate("/Community2");
};


  const savedPosts = JSON.parse(localStorage.getItem("communityPosts")) || [];
  const allPosts = [...savedPosts, ...postsData];

  return (
    <div className="warp1">
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      <div className="comTap">
        <button type="button" className="combtn">
          내 글 찾기
        </button>
        <button type="button" className="combtn">
          나의 활동
        </button>
        <button type="button" className="combtn" onClick={writeNavigate}>
          작성하기
        </button>
      </div>

      <div className="comList">
        {allPosts.map((post, idx) => (
          <React.Fragment key={post.id || idx}>
            <ComCard post={post} />
            {idx !== allPosts.length - 1 && <div className="comLine" />}
          </React.Fragment>
        ))}
        <div className="comPageNum">페이지 수</div>
      </div>
    </div>
  );
}
