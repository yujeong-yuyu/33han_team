// src/context/AuthContext.js
import { createContext, useContext, useMemo, useState, useRef, useEffect } from "react";
import { clearSession } from "../utils/localStorage";

const STORAGE_KEY = "souvenir_auth_v1";
const EVENT_KEY = "souvenirEventResult";


const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
    const [isLoggedIn, setIsLoggedIn] = useState({
        local: false, google: false, kakao: false, naver: false,
    });

    const [user, setUser] = useState({ provider: "", name: "", email: "" });

    const naverInstanceRef = useRef(null);
    const setNaverInstance = (inst) => { naverInstanceRef.current = inst; };

    const clearAppOnLogout = () => {
        try {
            localStorage.removeItem(EVENT_KEY);       // 이벤트 당첨 내역 삭제
            localStorage.removeItem(STORAGE_KEY);     // 로그인 스냅샷 삭제(자동복원 방지)
        } catch { }
    };

    const login = (provider, payload = {}) => {
        setIsLoggedIn((p) => ({ ...p, [provider]: true, local: true }));
        setUser({ provider, ...payload });
    };

    // ✅ 단일 제공자 로그아웃도 공통 정리 수행
    const logout = (provider) => {
        try {
            setIsLoggedIn((p) => ({ ...p, [provider]: false, local: false }));
            setUser({ provider: "", name: "", email: "" });
        } finally {
            clearAppOnLogout();                       // ✅ 여기서 항상 초기화
        }
    };

    const logoutAll = async () => {
        try {
            setIsLoggedIn({ local: false, google: false, kakao: false, naver: false });
            setUser({ provider: "", name: "", email: "" });
            localStorage.removeItem("google_email");
            // 소셜 SDK 로그아웃들은 그대로 유지
            try {
                if (window.google?.accounts?.id) {
                    window.google.accounts.id.disableAutoSelect();
                    const email = localStorage.getItem("google_email");
                    if (email) window.google.accounts.id.revoke(email, () => { });
                }
            } catch { }
            try {
                if (window.Kakao?.Auth?.getAccessToken?.()) {
                    await new Promise((res) => window.Kakao.Auth.logout(() => res()));
                }
            } catch { }
            try {
                const inst = naverInstanceRef.current;
                if (inst?.logout) inst.logout();
                if (window.naver_id_login?.logout) window.naver_id_login.logout();
            } catch { }
        } finally {
            // 세션/유저상태 삭제
            clearAppOnLogout();
            setIsLoggedIn({});                        // ✅ 로그인 플래그 초기화
            setUser(null);
            clearSession();                            // ✅ 유저 정보 초기화
        }
    };

    // ★ 1) 앱 시작 시 localStorage에서 복원
    useEffect(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
            if (saved?.isLoggedIn) setIsLoggedIn(saved.isLoggedIn);
            if (saved?.user) setUser(saved.user);
        } catch { }
    }, []);

    // ★ 2) isLoggedIn/user 변경될 때마다 저장
    useEffect(() => {
        try {
            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({ isLoggedIn, user })
            );
        } catch { }
    }, [isLoggedIn, user]);

    // (선택) 여러 탭/창 간 동기화
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key !== STORAGE_KEY) return;
            try {
                const saved = JSON.parse(e.newValue || "null");
                if (saved?.isLoggedIn) setIsLoggedIn(saved.isLoggedIn);
                if (saved?.user) setUser(saved.user);
            } catch { }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const value = useMemo(
        () => ({ isLoggedIn, user, login, logout, logoutAll, setNaverInstance }),
        [isLoggedIn, user]
    );

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}