import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import {
  IoHeartOutline,
  IoPricetagOutline,
  IoChatbubbleEllipsesOutline,
} from "react-icons/io5";
import { FaRegEdit, FaRegTrashAlt } from "react-icons/fa";
import "../css/Community3.css";
import postsData from "../data/CommunityData.json";

/* ---------- 스토리지 유틸 ---------- */
const POSTS_KEY = "communityPosts";       // 사용자 글들
const LIKES_KEY = "communityLikes";       // JSON 글(id) → likes 맵
const CMTS_KEY  = "communityComments";    // postId → [{cid, author, text, ts}]

const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const saveJSON = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};
const broadcast = (name, detail) => {
  window.dispatchEvent(new CustomEvent(name, { detail }));
};

function Comments({ postId }) {
  const [comments, setComments] = useState(() => {
    const all = loadJSON(CMTS_KEY, {});
    return Array.isArray(all[postId]) ? all[postId] : [];
  });
  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    const reload = () => {
      const all = loadJSON(CMTS_KEY, {});
      setComments(Array.isArray(all[postId]) ? all[postId] : []);
    };
    const onStorage = (e) => { if (e.key === CMTS_KEY) reload(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("communityComments:updated", reload);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("communityComments:updated", reload);
    };
  }, [postId]);

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const entry = { cid: Date.now(), author: author.trim() || "익명", text: t, ts: Date.now() };
    const all = loadJSON(CMTS_KEY, {});
    const next = Array.isArray(all[postId]) ? [...all[postId], entry] : [entry];
    all[postId] = next;
    saveJSON(CMTS_KEY, all);
    setComments(next);
    setText("");
    broadcast("communityComments:updated", { postId, comments: next });
  };

  const remove = (cid) => {
    const all = loadJSON(CMTS_KEY, {});
    const list = Array.isArray(all[postId]) ? all[postId] : [];
    const next = list.filter((c) => c.cid !== cid);
    all[postId] = next;
    saveJSON(CMTS_KEY, all);
    setComments(next);
    broadcast("communityComments:updated", { postId, comments: next });
  };

  return (
    <div className="cmt-wrap" id="comments">
      <h3 className="cmt-title">댓글 {comments.length}</h3>

      <form className="cmt-form" onSubmit={submit}>
        <input
          className="cmt-input name"
          type="text"
          placeholder="닉네임 (선택)"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
        <textarea
          className="cmt-input text"
          placeholder="댓글을 입력하세요"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          required
        />
        <button type="submit" className="cmt-submit">등록</button>
      </form>

      <ul className="cmt-list">
        {comments.map((c) => (
          <li key={c.cid} className="cmt-item">
            <div className="cmt-head">
              <strong className="cmt-author">{c.author}</strong>
              <time className="cmt-time">{new Date(c.ts).toLocaleString()}</time>
              <button type="button" className="cmt-del" onClick={() => remove(c.cid)}>삭제</button>
            </div>
            <p className="cmt-text">{c.text}</p>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="cmt-empty">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</li>
        )}
      </ul>
    </div>
  );
}

const Community3 = () => {
  const { id } = useParams();
  const stringId = String(id);

  /* ✅ 훅은 조건 없이 최상단에서 호출 */
  // 저장된 사용자 글은 한 번만 읽어 메모이즈
  const savedPosts = useMemo(() => loadJSON(POSTS_KEY, []), []);
  // 결합된 목록
  const allPosts = useMemo(() => [...savedPosts, ...postsData], [savedPosts]);
  // 대상 글 (없을 수도 있음)
  const post = useMemo(
    () => allPosts.find((p) => String(p.id) === stringId),
    [allPosts, stringId]
  );

  // 사진 목록 메모이즈 (post 없으면 빈 배열)
  const photos = useMemo(() => {
    if (post?.photos && post.photos.length > 0) return post.photos;
    if (post?.image) return [post.image];
    return [];
  }, [post]);

  // 대표 이미지 상태 (초기값은 비워두고, photos가 생기면 useEffect로 세팅)
  const [mainPhoto, setMainPhoto] = useState("");
  useEffect(() => {
    if (!photos.length) { setMainPhoto(""); return; }
    const first = typeof photos[0] === "string" ? photos[0] : URL.createObjectURL(photos[0]);
    setMainPhoto(first);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stringId, photos]);

  // 좋아요 상태: 저장소에서 안전하게 초기화
  const [likes, setLikes] = useState(() => {
    const likesMap = loadJSON(LIKES_KEY, {});
    const savedHit = savedPosts.find((p) => String(p.id) === stringId);
    return Number(savedHit?.likes ?? likesMap[stringId] ?? post?.likes ?? 0) || 0;
  });

  // 좋아요 외부 변경 동기화
  useEffect(() => {
    const sync = () => {
      const _saved = loadJSON(POSTS_KEY, []);
      const hit = _saved.find((p) => String(p.id) === stringId);
      const map = loadJSON(LIKES_KEY, {});
      const next = Number(hit?.likes ?? map[stringId] ?? post?.likes ?? 0) || 0;
      setLikes(next);
    };
    const onStorage = (e) => {
      if (e.key === POSTS_KEY || e.key === LIKES_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("communityPosts:updated", sync);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("communityPosts:updated", sync);
    };
  }, [post, stringId]);

  // 좋아요 증가 (post 유무와 상관없이 동작)
  const onLike = useCallback(() => {
    const list = loadJSON(POSTS_KEY, []);
    const idx = list.findIndex((p) => String(p.id) === stringId);
    if (idx >= 0) {
      const curr = Number(list[idx].likes || 0) + 1;
      list[idx] = { ...list[idx], likes: curr };
      saveJSON(POSTS_KEY, list);
      setLikes(curr);
      broadcast("communityPosts:updated", { posts: list });
      return;
    }
    const map = loadJSON(LIKES_KEY, {});
    const curr = Number(map[stringId] || 0) + 1;
    map[stringId] = curr;
    saveJSON(LIKES_KEY, map);
    setLikes(curr);
  }, [stringId]);

  // 댓글 개수(상단 메타 표기용) — 이벤트로 동기화
  const [cmtCount, setCmtCount] = useState(() => {
    const all = loadJSON(CMTS_KEY, {});
    return Array.isArray(all[stringId]) ? all[stringId].length : 0;
  });
  useEffect(() => {
    const reload = () => {
      const all = loadJSON(CMTS_KEY, {});
      setCmtCount(Array.isArray(all[stringId]) ? all[stringId].length : 0);
    };
    const onStorage = (e) => { if (e.key === CMTS_KEY) reload(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("communityComments:updated", reload);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("communityComments:updated", reload);
    };
  }, [stringId]);

  /* ----- 렌더 ----- */
  return (
    <div className="warp1">
      <div className="toptitle">
        <div className="titleleft" />
        <h2>Community</h2>
        <div className="titleright" />
      </div>

      {!post ? (
        <p style={{ padding: 24 }}>글을 찾을 수 없습니다.</p>
      ) : (
        <>
          <div className="community3-Box">
            {/* 좌측: 사진 */}
            <div className="comdetail_community-content-l">
              <div className="insert-photo">
                {mainPhoto ? <img src={mainPhoto} alt="photo" /> : <p>사진 없음</p>}
              </div>
              <div className="sub-photo-box">
                <ul>
                  {photos.map((p, idx) => {
                    const src = typeof p === "string" ? p : URL.createObjectURL(p);
                    return (
                      <li key={idx} onClick={() => setMainPhoto(src)}>
                        <img src={src} alt={`photo${idx}`} />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* 우측: 정보 */}
            <div className="comdetail_community-content-r">
              <div className="meta-row">
                <div className="community-profile" aria-hidden="true" />
                <p className="detail-name">{post.author || post.user || "익명"}</p>

                <div className="meta-actions">
                  <div className="meta-action">
                    <FaRegEdit style={{ fontSize: 20 }} />
                    <span className="detail-editor">수정</span>
                  </div>
                  <div className="meta-action">
                    <FaRegTrashAlt style={{ fontSize: 20 }} />
                    <span className="detail-editor">삭제</span>
                  </div>
                </div>
              </div>

              <div className="comdetail_community-content-text">
                <p>{post.content || post.text}</p>
              </div>

              <div className="like-tag-mes">
                <div role="button" tabIndex={0} onClick={onLike} title="좋아요">
                  <IoHeartOutline className="ltm-icon" aria-hidden="true" />
                  <span className="ltm-num">{likes}</span>
                </div>
                <div role="button" tabIndex={0} title="태그 수">
                  <IoPricetagOutline className="ltm-icon" aria-hidden="true" />
                  <span className="ltm-num">{Number(post.tagsCount || 0)}</span>
                </div>
                <a className="cmt-link" href="#comments" title="댓글로 이동">
                  <IoChatbubbleEllipsesOutline className="ltm-icon" aria-hidden="true" />
                  <span className="ltm-num">{cmtCount}</span>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Community3;
