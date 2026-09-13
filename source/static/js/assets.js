/**
 * assets.js - 猫の画像BLOB/SVGアセットマネージャー
 * 黒猫、白猫、茶トラ、三毛猫、ハチワレ猫などのSVG BLOBを生成
 */

const CatAssets = (function() {
    const breedConfigs = {
        white: {
            name: "白猫",
            bodyColor: "#fbfbff",
            subColor: "#f0f0f5",
            stripeColor: "none",
            eyeColor: "#4cc9f0",
            pupilColor: "#111827",
            innerEarColor: "#ffccd5",
            noseColor: "#ffb4c2",
            collarColor: "#ef476f",
            bellColor: "#ffd166",
            pawColor: "#ffccd5",
            personality: "気品のある甘えん坊"
        },
        black: {
            name: "黒猫",
            bodyColor: "#1e1e24",
            subColor: "#2b2b36",
            stripeColor: "none",
            eyeColor: "#ffd166",
            pupilColor: "#050505",
            innerEarColor: "#3d3d4e",
            noseColor: "#2b2b36",
            collarColor: "#06d6a0",
            bellColor: "#ffd166",
            pawColor: "#2b2b36",
            personality: "好奇心旺盛なハンター"
        },
        orange_tabby: {
            name: "茶トラ",
            bodyColor: "#f48c06",
            subColor: "#ffba08",
            stripeColor: "#d00000",
            eyeColor: "#52b788",
            pupilColor: "#111827",
            innerEarColor: "#ffb4a2",
            noseColor: "#ff99c8",
            collarColor: "#118ab2",
            bellColor: "#ffd166",
            pawColor: "#ffb4a2",
            personality: "元気いっぱいで食いしん坊"
        },
        calico: {
            name: "三毛猫",
            bodyColor: "#ffffff",
            subColor: "#e76f51",
            stripeColor: "#264653",
            eyeColor: "#2a9d8f",
            pupilColor: "#111827",
            innerEarColor: "#ffccd5",
            noseColor: "#f4a261",
            collarColor: "#e63946",
            bellColor: "#ffd166",
            pawColor: "#ffccd5",
            personality: "マイペースな女王様"
        },
        tuxedo: {
            name: "ハチワレ",
            bodyColor: "#2b2d42",
            subColor: "#f8f9fa",
            stripeColor: "none",
            eyeColor: "#80ed99",
            pupilColor: "#111827",
            innerEarColor: "#ffb4c2",
            noseColor: "#ff8fa3",
            collarColor: "#7209b7",
            bellColor: "#ffd166",
            pawColor: "#ffccd5",
            personality: "人懐っこい冒険家"
        },
        siamese: {
            name: "シャム猫",
            bodyColor: "#f4ede2",
            subColor: "#4a3b32",
            stripeColor: "none",
            eyeColor: "#0077b6",
            pupilColor: "#03045e",
            innerEarColor: "#3a2e27",
            noseColor: "#3a2e27",
            collarColor: "#e76f51",
            bellColor: "#ffd166",
            pawColor: "#4a3b32",
            personality: "おしゃべりで賢い"
        }
    };

    /**
     * 猫のSVGコードを動的生成
     */
    function createCatSvgString(breedKey = "white", mood = "happy") {
        const config = breedConfigs[breedKey] || breedConfigs.white;
        const isCalico = breedKey === "calico";
        const isTuxedo = breedKey === "tuxedo";
        const isTabby = breedKey === "orange_tabby";

        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 100" class="cat-svg" width="100%" height="100%">
            <defs>
                <filter id="shadow-${breedKey}" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.25"/>
                </filter>
                <radialGradient id="eyeGrad-${breedKey}" cx="40%" cy="40%" r="60%">
                    <stop offset="0%" stop-color="${config.eyeColor}" stop-opacity="1"/>
                    <stop offset="100%" stop-color="#0a2e36" stop-opacity="1"/>
                </radialGradient>
            </defs>

            <!-- しっぽ (揺れるアニメーションパーツ) -->
            <g class="tail-group">
                <path class="cat-tail" d="M 28 65 Q 10 50 12 30 Q 15 20 22 25 Q 18 45 35 60 Z" 
                    fill="${isCalico ? config.stripeColor : config.bodyColor}" 
                    stroke="rgba(0,0,0,0.08)" stroke-width="1.5" />
            </g>

            <!-- 後ろ足 -->
            <ellipse class="back-paw-left" cx="32" cy="82" rx="9" ry="6" fill="${config.pawColor || config.bodyColor}" />
            <ellipse class="back-paw-right" cx="78" cy="82" rx="9" ry="6" fill="${config.pawColor || config.bodyColor}" />

            <!-- 胴体 -->
            <g class="body-group">
                <ellipse cx="55" cy="62" rx="32" ry="24" fill="${config.bodyColor}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
                
                ${isCalico ? `
                    <!-- 三毛猫の模様 -->
                    <path d="M 35 45 Q 48 40 52 58 Q 42 70 30 65 Z" fill="${config.subColor}" />
                    <path d="M 65 50 Q 80 48 82 68 Q 70 78 60 72 Z" fill="${config.stripeColor}" />
                ` : ''}

                ${isTuxedo ? `
                    <!-- ハチワレのお腹の白エプロン -->
                    <path d="M 45 52 Q 55 48 65 52 Q 68 75 55 78 Q 42 75 45 52 Z" fill="${config.subColor}" />
                ` : ''}

                ${isTabby ? `
                    <!-- トラ猫の縞模様 -->
                    <path d="M 40 46 L 46 54 L 42 62" stroke="${config.stripeColor}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.75" />
                    <path d="M 52 42 L 56 52 L 53 64" stroke="${config.stripeColor}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.75" />
                    <path d="M 66 45 L 63 55 L 68 63" stroke="${config.stripeColor}" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.75" />
                ` : ''}
            </g>

            <!-- 首輪と鈴 -->
            <path d="M 42 46 Q 58 52 74 46" stroke="${config.collarColor}" stroke-width="4" stroke-linecap="round" fill="none"/>
            <circle cx="58" cy="51" r="4.5" fill="${config.bellColor}" stroke="#b78103" stroke-width="0.8"/>
            <circle cx="58" cy="51" r="1.2" fill="#5c4102"/>

            <!-- 前足 (歩行時に上下) -->
            <g class="front-paws">
                <ellipse class="front-paw paw-left" cx="46" cy="83" rx="7" ry="5.5" fill="${config.pawColor || config.bodyColor}" stroke="rgba(0,0,0,0.08)" stroke-width="0.8"/>
                <ellipse class="front-paw paw-right" cx="68" cy="83" rx="7" ry="5.5" fill="${config.pawColor || config.bodyColor}" stroke="rgba(0,0,0,0.08)" stroke-width="0.8"/>
            </g>

            <!-- 頭部グループ -->
            <g class="head-group">
                <!-- 左耳 -->
                <path d="M 36 28 L 30 4 Q 45 10 50 20 Z" fill="${config.bodyColor}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
                <path d="M 37 24 L 34 9 Q 44 14 47 20 Z" fill="${config.innerEarColor}"/>

                <!-- 右耳 -->
                <path d="M 80 28 L 86 4 Q 71 10 66 20 Z" fill="${isCalico ? config.subColor : config.bodyColor}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>
                <path d="M 79 24 L 82 9 Q 72 14 69 20 Z" fill="${config.innerEarColor}"/>

                <!-- 顔の輪郭 -->
                <ellipse cx="58" cy="28" rx="26" ry="21" fill="${config.bodyColor}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>

                ${isTuxedo ? `
                    <!-- ハチワレの八の字マスク -->
                    <path d="M 34 20 Q 42 10 58 20 Q 74 10 82 20 Q 82 36 76 44 Q 58 40 40 44 Q 34 36 34 20 Z" fill="${config.bodyColor}"/>
                    <path d="M 58 16 L 46 45 L 70 45 Z" fill="${config.subColor}"/>
                ` : ''}

                ${isCalico ? `
                    <!-- 三毛猫の頭のぶち -->
                    <path d="M 64 12 Q 80 14 82 28 Q 72 35 66 24 Z" fill="${config.subColor}" />
                    <path d="M 34 16 Q 44 14 45 28 Q 36 32 34 22 Z" fill="${config.stripeColor}" />
                ` : ''}

                <!-- 左目 -->
                <g class="eye eye-left">
                    <ellipse cx="47" cy="27" rx="5.5" ry="6.5" fill="url(#eyeGrad-${breedKey})"/>
                    <ellipse cx="47" cy="27" rx="2.5" ry="5" fill="${config.pupilColor}"/>
                    <circle cx="45" cy="24" r="2" fill="#ffffff"/>
                    <circle cx="49" cy="29" r="0.9" fill="#ffffff"/>
                </g>

                <!-- 右目 -->
                <g class="eye eye-right">
                    <ellipse cx="69" cy="27" rx="5.5" ry="6.5" fill="url(#eyeGrad-${breedKey})"/>
                    <ellipse cx="69" cy="27" rx="2.5" ry="5" fill="${config.pupilColor}"/>
                    <circle cx="67" cy="24" r="2" fill="#ffffff"/>
                    <circle cx="71" cy="29" r="0.9" fill="#ffffff"/>
                </g>

                <!-- 鼻とお口 -->
                <path d="M 56 34 L 60 34 L 58 36.5 Z" fill="${config.noseColor}"/>
                <path d="M 58 36.5 Q 54 40 50 38 M 58 36.5 Q 62 40 66 38" stroke="#4a4a4a" stroke-width="1.2" stroke-linecap="round" fill="none"/>

                <!-- ほっぺのチーク -->
                <ellipse cx="40" cy="33" rx="4" ry="2.5" fill="#ffb4c2" opacity="0.55"/>
                <ellipse cx="76" cy="33" rx="4" ry="2.5" fill="#ffb4c2" opacity="0.55"/>

                <!-- ひげ -->
                <g class="whiskers" stroke="#6c757d" stroke-width="1" stroke-linecap="round" opacity="0.75">
                    <!-- 左ひげ -->
                    <line x1="44" y1="34" x2="22" y2="31"/>
                    <line x1="43" y1="37" x2="20" y2="38"/>
                    <line x1="44" y1="40" x2="24" y2="45"/>
                    <!-- 右ひげ -->
                    <line x1="72" y1="34" x2="94" y2="31"/>
                    <line x1="73" y1="37" x2="96" y2="38"/>
                    <line x1="72" y1="40" x2="92" y2="45"/>
                </g>
            </g>
        </svg>
        `;
    }

    /**
     * SVG文字列からBlobおよびBlob URLを生成
     */
    function createCatBlob(breedKey = "white") {
        const svgString = createCatSvgString(breedKey);
        const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
        return {
            blob: blob,
            url: URL.createObjectURL(blob),
            breedKey: breedKey,
            meta: breedConfigs[breedKey] || breedConfigs.white
        };
    }

    /**
     * 利用可能な全品種キー
     */
    function getAvailableBreeds() {
        return Object.keys(breedConfigs);
    }

    /**
     * ランダムな品種を取得
     */
    function getRandomBreed() {
        const breeds = getAvailableBreeds();
        return breeds[Math.floor(Math.random() * breeds.length)];
    }

    return {
        breedConfigs,
        createCatSvgString,
        createCatBlob,
        getAvailableBreeds,
        getRandomBreed
    };
})();

// グローバルスコープに公開
if (typeof window !== "undefined") {
    window.CatAssets = CatAssets;
}
