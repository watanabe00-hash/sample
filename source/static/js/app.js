/**
 * app.js - 猫ちゃんズ アプリケーション統合コントローラー
 */

(function() {
    let cats = [];
    let stage = null;
    let isToyActive = false;
    let toyPosition = { x: 0, y: 0 };
    let lastTime = performance.now();
    let statsElement = null;

    // 初期化
    document.addEventListener("DOMContentLoaded", async () => {
        stage = document.getElementById("cat-stage");
        statsElement = document.getElementById("cat-count-display");

        // 保存データの復元試行
        await initializeCats();

        // アニメーションループ開始
        requestAnimationFrame(gameLoop);

        // UIイベントのバインド
        setupUIEvents();
    });

    /**
     * 猫の初期化 (セーブデータから復元、無ければ最初は1匹生成)
     */
    async function initializeCats() {
        showToast("🐾 猫ちゃんズを読み込み中...", 1500);

        let savedData = null;
        if (window.CatStorage) {
            savedData = await window.CatStorage.load();
        }

        if (savedData && savedData.cats && savedData.cats.length > 0) {
            savedData.cats.forEach(data => {
                spawnCat(data);
            });
            showToast(`💾 前回のセーブデータを読み込みました (${cats.length}匹)`, 2500);
        } else {
            // 仕様: 「最初１匹で上記動作をすることで増える」
            spawnCat({
                breed: "white",
                name: "ユキ",
                scale: 1.0,
                x: window.innerWidth / 2 - 50,
                y: window.innerHeight / 2 - 40
            });
            showToast("✨ 最初の猫ちゃんが登場しました！クリックで鳴き、ダブルクリックで増えます！", 4000);
        }

        updateStats();
    }

    /**
     * 新しい猫を生成してステージに追加
     */
     function spawnCat(options = {}) {
        const cat = new Neko(stage, {
            ...options,
            onDuplicate: (parentCat) => {
                // ダブルクリックで2匹に増える仕様
                duplicateCat(parentCat);
            },
            onClick: (catInstance) => {
                updateStats();
            },
            onDropOnHouse: (catInstance) => {
                // 猫の家にドラッグ＆ドロップされたら1匹画面から消える（退去）
                handleCatRetire(catInstance);
            }
        });

        cats.push(cat);
        updateStats();
        return cat;
    }

    /**
     * 猫がお家に入って画面から退去する処理
     */
    function handleCatRetire(cat) {
        const house = document.getElementById("cat-house");
        if (!house) return;

        cat.retireToHouse(house, (retiredCat) => {
            // 配列から削除
            cats = cats.filter(c => c.id !== retiredCat.id);
            updateStats();
            saveCurrentState(false);

            showToast(`🏠 ${retiredCat.name}がお家に入ってスヤスヤ眠りにつきました💤 (残り: ${cats.length}匹)`, 2500);

            if (cats.length === 0) {
                showToast("🏠 お家をクリックするか「➕ 猫を呼ぶ」で猫ちゃんを呼び出せます🐾", 3500);
            }
        });
    }


    /**
     * ダブルクリック時の分裂増殖
     */
    function duplicateCat(parentCat) {
        const breeds = window.CatAssets ? window.CatAssets.getAvailableBreeds() : ["white", "black", "orange_tabby", "calico", "tuxedo", "siamese"];
        const nextBreed = breeds[Math.floor(Math.random() * breeds.length)];

        // 親の少し横に出現
        const offsetAngle = Math.random() * Math.PI * 2;
        const newX = parentCat.x + Math.cos(offsetAngle) * 60;
        const newY = parentCat.y + Math.sin(offsetAngle) * 40;

        const babyCat = spawnCat({
            breed: nextBreed,
            x: Math.max(30, Math.min(window.innerWidth - 120, newX)),
            y: Math.max(60, Math.min(window.innerHeight - 120, newY)),
            scale: Math.max(0.65, parentCat.scale * (0.85 + Math.random() * 0.2)),
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 3
        });

        showToast(`🎉 新しい猫ちゃん「${babyCat.name}」が誕生しました！(合計: ${cats.length}匹)`, 2000);
        // 自動セーブ
        saveCurrentState(false);
    }

    /**
     * メインアニメーションループ
     */
    function gameLoop(currentTime) {
        const deltaTime = currentTime - lastTime;
        lastTime = currentTime;

        // 猫たちの更新
        cats.forEach(cat => {
            if (isToyActive) {
                cat.attractTo(toyPosition.x, toyPosition.y);
            }
            cat.update(deltaTime);
        });

        requestAnimationFrame(gameLoop);
    }

    /**
     * UIボタンやステージイベントの設定
     */
    function setupUIEvents() {
        // セーブボタン
        const saveBtn = document.getElementById("btn-save");
        if (saveBtn) {
            saveBtn.addEventListener("click", () => saveCurrentState(true));
        }

        // 猫追加ボタン
        const addBtn = document.getElementById("btn-add-cat");
        if (addBtn) {
            addBtn.addEventListener("click", () => {
                const randomBreed = window.CatAssets.getRandomBreed();
                spawnCat({ breed: randomBreed });
                if (window.CatAudio) window.CatAudio.playPopSpawnSound();
                showToast("🐾 新しい猫ちゃんを呼びました！", 2000);
                saveCurrentState(false);
            });
        }

        // おやつ（お魚）を投げるボタン
        const snackBtn = document.getElementById("btn-snack");
        if (snackBtn) {
            snackBtn.addEventListener("click", () => {
                feedTreats();
            });
        }

        // ねこじゃらし（おもちゃ）モード切替
        const toyBtn = document.getElementById("btn-toy");
        if (toyBtn) {
            toyBtn.addEventListener("click", () => {
                toggleToyMode(toyBtn);
            });
        }

        // 猫の家をクリックしたとき (お家から猫が飛び出してくる)
        const catHouse = document.getElementById("cat-house");
        if (catHouse) {
            catHouse.addEventListener("click", () => {
                const randomBreed = window.CatAssets ? window.CatAssets.getRandomBreed() : "white";
                const hRect = catHouse.getBoundingClientRect();
                const stageRect = stage.getBoundingClientRect();

                const spawnX = (hRect.left - stageRect.left) + hRect.width / 2 - 40;
                const spawnY = (hRect.top - stageRect.top) + hRect.height / 2;

                const newCat = spawnCat({
                    breed: randomBreed,
                    x: spawnX,
                    y: spawnY,
                    vx: 2.5 + Math.random() * 2,
                    vy: -(1.5 + Math.random() * 2)
                });

                if (window.CatAudio) {
                    window.CatAudio.playPopSpawnSound();
                    window.CatAudio.playMeow({ pitchMultiplier: 1.1, type: "kitten" });
                }

                showToast(`🏠 お家から「${newCat.name}」が元気に飛び出してきました！🐾`, 2200);
                saveCurrentState(false);
            });
        }

        // リセットボタン
        const resetBtn = document.getElementById("btn-reset");

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (confirm("猫ちゃんたちを最初の1匹に戻しますか？")) {
                    resetCats();
                }
            });
        }

        // 猫図鑑・一覧モーダル開閉
        const listBtn = document.getElementById("btn-cat-list");
        const modal = document.getElementById("cat-list-modal");
        const closeModalBtn = document.getElementById("btn-close-modal");
        if (listBtn && modal) {
            listBtn.addEventListener("click", () => {
                renderCatListModal();
                modal.classList.add("is-active");
            });
        }
        if (closeModalBtn && modal) {
            closeModalBtn.addEventListener("click", () => {
                modal.classList.remove("is-active");
            });
        }

        // ねこじゃらし用マウス追従
        window.addEventListener("mousemove", (e) => {
            if (isToyActive) {
                toyPosition.x = e.clientX;
                toyPosition.y = e.clientY;
                const toyPointer = document.getElementById("toy-pointer");
                if (toyPointer) {
                    toyPointer.style.left = `${e.clientX}px`;
                    toyPointer.style.top = `${e.clientY}px`;
                }
            }
        });

        // キーボードショートカット
        window.addEventListener("keydown", (e) => {
            if (e.key === "s" || e.key === "S") {
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    saveCurrentState(true);
                }
            } else if (e.key === " ") {
                // スペースキーでおやつ
                e.preventDefault();
                feedTreats();
            }
        });
    }

    /**
     * おやつ（お魚）をステージ上にばら撒く
     */
    function feedTreats() {
        if (window.CatAudio) {
            window.CatAudio.playMeow({ pitchMultiplier: 1.2, type: "meow" });
        }

        for (let i = 0; i < 3; i++) {
            const treat = document.createElement("div");
            treat.className = "stage-treat-item";
            const tx = 100 + Math.random() * (window.innerWidth - 200);
            const ty = 120 + Math.random() * (window.innerHeight - 240);
            treat.style.left = `${tx}px`;
            treat.style.top = `${ty}px`;
            treat.innerHTML = "🐟";
            stage.appendChild(treat);

            // 近くの猫をおやつに向かわせる
            cats.forEach(c => c.attractTo(tx, ty));

            setTimeout(() => {
                treat.classList.add("treat-eaten");
                setTimeout(() => treat.remove(), 600);
            }, 3000 + Math.random() * 2000);
        }

        showToast("🐟 お魚のおやつをあげました！みんな集まってきます！", 2500);
    }

    /**
     * ねこじゃらしモード切替
     */
    function toggleToyMode(btn) {
        isToyActive = !isToyActive;
        const toyPointer = document.getElementById("toy-pointer");

        if (isToyActive) {
            btn.classList.add("btn-active");
            btn.innerHTML = "🪶 ねこじゃらし中 (ON)";
            if (toyPointer) toyPointer.style.display = "block";
            showToast("🪶 マウスカーソルに猫ちゃんたちがじゃれついてきます！", 3000);
        } else {
            btn.classList.remove("btn-active");
            btn.innerHTML = "🪶 ねこじゃらし";
            if (toyPointer) toyPointer.style.display = "none";
        }
    }

    /**
     * 状態の保存
     */
    async function saveCurrentState(isManual = false) {
        if (!window.CatStorage) return;
        const result = await window.CatStorage.save(cats);
        if (isManual) {
            showToast(`💾 ${cats.length}匹の猫ちゃんズの状態をSaveしました！ (accounts/save_data.json)`, 3000);
        }
    }

    /**
     * リセット
     */
    async function resetCats() {
        if (window.CatStorage) {
            await window.CatStorage.clear();
        }
        cats.forEach(c => c.destroy());
        cats = [];

        spawnCat({
            breed: "white",
            name: "ユキ",
            scale: 1.0,
            x: window.innerWidth / 2 - 50,
            y: window.innerHeight / 2 - 40
        });

        updateStats();
        showToast("🔄 最初の一匹にリセットしました。", 2000);
    }

    /**
     * 統計情報の更新
     */
    function updateStats() {
        if (statsElement) {
            statsElement.textContent = `${cats.length} 匹`;
        }
    }

    /**
     * 猫ちゃん一覧モーダルの描画
     */
    function renderCatListModal() {
        const container = document.getElementById("cat-modal-cards");
        if (!container) return;
        container.innerHTML = "";

        cats.forEach((cat, index) => {
            const card = document.createElement("div");
            card.className = "cat-profile-card";
            const meta = window.CatAssets.breedConfigs[cat.breed] || {};
            card.innerHTML = `
                <div class="card-avatar">
                    ${window.CatAssets.createCatSvgString(cat.breed)}
                </div>
                <div class="card-info">
                    <h4>#${index + 1} ${cat.name}</h4>
                    <p class="card-breed">${meta.name || cat.breed}</p>
                    <p class="card-personality">性格: ${meta.personality || "元気"}</p>
                    <p class="card-scale">大きさ: ${Math.round(cat.scale * 100)}%</p>
                </div>
            `;
            container.appendChild(card);
        });
    }

    /**
     * 画面通知トースト表示
     */
    function showToast(message, duration = 2500) {
        let toastContainer = document.getElementById("toast-container");
        if (!toastContainer) {
            toastContainer = document.createElement("div");
            toastContainer.id = "toast-container";
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement("div");
        toast.className = "toast-item";
        toast.innerHTML = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add("toast-show");
        }, 10);

        setTimeout(() => {
            toast.classList.remove("toast-show");
            setTimeout(() => toast.remove(), 400);
        }, duration);
    }

    window.CatApp = {
        spawnCat,
        saveCurrentState,
        cats
    };
})();
