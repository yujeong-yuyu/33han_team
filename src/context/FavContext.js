// src/context/FavContext.js
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "souvenir_favs_v1";

const FavCtx = createContext(null);
export const useFavs = () => useContext(FavCtx);

export function FavProvider({ children }) {
    // favorites는 id(slug)로 고유 식별
    const [favs, setFavs] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    });

    // 중복 방지용 Set
    const idSet = useMemo(() => new Set(favs.map((f) => f.id)), [favs]);

    const hasFav = (id) => idSet.has(id);

    const addFav = (item) =>
        setFavs((prev) => (idSet.has(item.id) ? prev : [...prev, item]));

    const removeFav = (id) =>
        setFavs((prev) => prev.filter((f) => f.id !== id));

    const toggleFav = (item) =>
        setFavs((prev) => {
            const exists = prev.some((f) => f.id === item.id);
            return exists ? prev.filter((f) => f.id !== item.id) : [...prev, item];
        });

    // 저장
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favs));
        } catch { }
    }, [favs]);

    // 탭 간 동기화
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key !== STORAGE_KEY) return;
            try {
                const arr = JSON.parse(e.newValue || "[]");
                setFavs(Array.isArray(arr) ? arr : []);
            } catch { }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const value = useMemo(
        () => ({ favs, hasFav, addFav, removeFav, toggleFav }),
        [favs, idSet]
    );

    return <FavCtx.Provider value={value}>{children}</FavCtx.Provider>;
}
