/**
 * storage.js - 猫ちゃんズのSave/Loadデータ永続化モジュール (JSON API & LocalStorage)
 */

const CatStorage = (function() {
    const LOCAL_STORAGE_KEY = "neko_chanz_save_data";

    /**
     * 猫たちの現在の状態をJSON形式で保存
     * @param {Array} cats - 猫インスタンスの配列
     */
    async function save(cats) {
        const payload = {
            version: "1.0",
            saved_at: new Date().toISOString(),
            count: cats.length,
            cats: cats.map(cat => cat.serialize())
        };

        // 1. ローカルストレージに即時バックアップ
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
        } catch (e) {
            console.warn("LocalStorage save warning:", e);
        }

        // 2. PythonバックエンドAPI (/api/save) へ送信
        try {
            const response = await fetch("/api/save", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const resData = await response.json();
                return { success: true, method: "server", data: payload, message: resData.message };
            }
        } catch (err) {
            console.info("Python backend API not available, used LocalStorage fallback.");
        }

        return { success: true, method: "local", data: payload, message: "ブラウザローカルに保存されました。" };
    }

    /**
     * 前回の保存データを読み込み
     */
    async function load() {
        // 1. PythonバックエンドAPIからのロード試行
        try {
            const response = await fetch("/api/load");
            if (response.ok) {
                const data = await response.json();
                if (data && data.cats && data.cats.length > 0) {
                    return data;
                }
            }
        } catch (err) {
            console.info("Python backend load failed, trying LocalStorage.");
        }

        // 2. LocalStorageからのロード試行
        try {
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
                return JSON.parse(localData);
            }
        } catch (e) {
            console.warn("LocalStorage load error:", e);
        }

        // デフォルト: 初回用データ (1匹)
        return null;
    }

    /**
     * データの初期化・リセット
     */
    async function clear() {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        try {
            await fetch("/api/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cats: [], saved_at: new Date().toISOString() })
            });
        } catch (e) {
            // ignore
        }
    }

    return {
        save,
        load,
        clear
    };
})();

if (typeof window !== "undefined") {
    window.CatStorage = CatStorage;
}
