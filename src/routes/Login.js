import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import SignupModal from "../components/SignupModal";
import SocialLogin from "../components/SocialLogin";

import '../css/login.css';

export default function Login() {
  const navigate = useNavigate();

  const { login, setNaverInstance } = useAuth();


  const getUser = (id) => {
    try { return JSON.parse(localStorage.getItem("souvenir_users_v1") || "{}")[id] || null; }
    catch { return null; }
  };
  const setSession = (userid, name) =>
    localStorage.setItem("souvenir_session_v1", JSON.stringify({ userid, name, loginAt: Date.now() }));


  const [form, setForm] = useState({ userid: "", password: "" });
  const [showSignup, setShowSignup] = useState(false);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    try {
      const u = getUser(form.userid.trim());
      if (!u || u.pwd !== form.password) {
        alert("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      setSession(u.userid, u.name);
      login("local", { name: u.name });
      alert(`${u.name}님 로그인되었습니다.`);
      navigate("/");
    } catch (e) {
      alert("로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <>

      <div id="login-wrap">
        <main className="login-page">

          <div id="login-progress">
            <ul>
              <li className="progress1">
                <div className="circle"><p>01</p></div>
                <p className="progress-nav">SIGNUP</p>
              </li>
              <li><p className="ntt"><i className="fa-solid fa-angle-right" /></p></li>
              <li className="progress2">
                <div className="circle2"><p>02</p></div>
                <p className="progress-nav2">LOGIN</p>
              </li>
              <li><p className="ntt"><i className="fa-solid fa-angle-right" /></p></li>
              <li className="progress3">
                <div className="circle"><p>03</p></div>
                <p className="progress-nav">MYPAGE</p>
              </li>
            </ul>
          </div>

          <p className="login-title">LOGIN</p>

          <form className="login-card" onSubmit={onSubmit}>
            <div className="field">
              {/* <label className="field-label"></label> */}
              <input
                type="text"
                name="userid"
                value={form.userid}
                onChange={onChange}
                placeholder="아이디"
              />
            </div>

            <label className="field">
              {/* <span className="field-label"></span> */}
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                placeholder="비밀번호"
              />
            </label>

            <div className="loginbtn-box">
              {/* <div className="area"></div> */}
              <button type="submit" className="btn loginbtn">로그인</button>
            </div>

            <div className="sub-links">

              <button type="button" className="link-btn" onClick={() => alert("비밀번호 찾기 페이지로 이동")}>
                비밀번호찾기
              </button>


              <button type="button" className="link-btn" onClick={() => setShowSignup(true)}>
                회원가입
              </button>

            </div>
          </form>
          <SocialLogin onNaverReady={setNaverInstance}></SocialLogin>

          {/* 회원가입 모달 */}
          {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}
        </main>
      </div>
    </>
  );
}