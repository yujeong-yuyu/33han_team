import React, { useState } from "react";
import { useParams } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import "../css/Community3.css";
import postsData from "../data/CommunityData.json";

const Community3 = () => {
  const { id } = useParams();

  const savedPosts = JSON.parse(localStorage.getItem("communityPosts")) || [];
  const allPosts = [...savedPosts, ...postsData];

  const post = allPosts.find((p) => String(p.id) === String(id));

  // 훅은 항상 최상위에서 호출
  const photos =
    post?.photos && post.photos.length > 0
      ? post.photos
      : post?.image
      ? [post.image]
      : [];
  const [mainPhoto, setMainPhoto] = useState(photos[0] || "");

  // post가 없으면 JSX에서 처리
  if (!post) return <p>글을 찾을 수 없습니다.</p>;

  return (
    <div className="warp1">
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      <div className="community3-Box">
        <div className="comdetail_community-content-l">
          <div className="insert-photo">
            {mainPhoto ? <img src={mainPhoto} alt="photo" /> : <p>사진 없음</p>}
          </div>
          <div className="sub-photo-box">
            <ul>
              {photos.map((p, idx) => (
                <li key={idx} onClick={() => setMainPhoto(p)}>
                  <img src={p} alt={`photo${idx}`} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="comdetail_community-content-r">
          <div className="meta-row">
            <div className="community-profile" aria-hidden="true" />
            <p className="detail-name">{post.author || post.user}</p>

            <div className="meta-actions">
              <div className="meta-action">
                <FaRegEdit style={{ fontSize: "20px" }} />
                <span className="detail-editor">수정</span>
              </div>
              <div className="meta-action">
                <FaRegTrashAlt style={{ fontSize: "20px" }} />
                <span className="detail-editor">삭제</span>
              </div>
            </div>
          </div>

          <div className="comdetail_community-content-text">
            <p>{post.content || post.text}</p>
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
    </div>
  );
};

export default Community3;
