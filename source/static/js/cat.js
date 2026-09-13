/**
 * cat.js - 猫ちゃんのDOM制御、AI行動、インタラクションロジック
 */

class Neko {
    constructor(stageElement, options = {}) {
        this.stage = stageElement;
        this.id = options.id || "cat_" + Math.random().toString(36).substr(2, 9);
        this.breed = options.breed || (window.CatAssets ? window.CatAssets.getRandomBreed() : "white");
        this.name = options.name || this.generateCatName(this.breed);

        // 座標と物理量
        const stageRect = this.stage.getBoundingClientRect();
        const stageW = stageRect.width > 0 ? stageRect.width : window.innerWidth;
        const stageH = stageRect.height > 0 ? stageRect.height : window.innerHeight;

        this.x = options.x !== undefined ? options.x : Math.max(50, Math.random() * (stageW - 160));
        this.y = options.y !== undefined ? options.y : Math.max(80, Math.random() * (stageH - 180));
        this.vx = options.vx !== undefined ? options.vx : (Math.random() - 0.5) * 3;
        this.vy = options.vy !== undefined ? options.vy : (Math.random() - 0.5) * 2;
        this.scale = options.scale || (0.85 + Math.random() * 0.35); // 個体ごとの大きさ
        this.direction = this.vx >= 0 ? 1 : -1; // 1: 右, -1: 左

        // 状態: 'idle' | 'walking' | 'running' | 'sleeping' | 'grooming' | 'dragging' | 'jumping'
        this.state = options.state || "walking";
        this.stateTimer = 0;
        this.stateDuration = 2000 + Math.random() * 4000;
        this.speed = 1.2 + Math.random() * 1.5;

        // ドラッグ制御
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // イベントコールバック
        this.onDuplicate = options.onDuplicate || null;
        this.onClick = options.onClick || null;
        this.onDropOnHouse = options.onDropOnHouse || null;

        // DOM構築
        this.element = null;
        this.bubbleElement = null;
        this.createDOM();

        // アニメーションステップ
        this.walkCycle = 0;
    }

    generateCatName(breed) {
        const names = {
            white: ["ユキ", "シロ", "マシュマロ", "ルナ", "バニラ"],
            black: ["クロ", "ノワール", "カゲ", "クロエ", "ヤミ"],
            orange_tabby: ["トラ", "チャチャ", "モカ", "ラテ", "レオ"],
            calico: ["ミケ", "ハナ", "ナナ", "サクラ", "コマ"],
            tuxedo: ["ハチ", "オレオ", "ソラ", "タキシード", "パンダ"],
            siamese: ["ココア", "シャルル", "ベル", "モモ", "カイ"]
        };
        const list = names[breed] || ["タマ", "ミケ", "ポチ", "チビ"];
        return list[Math.floor(Math.random() * list.length)];
    }

    createDOM() {
        const wrapper = document.createElement("div");
        wrapper.className = `cat-container cat-breed-${this.breed}`;
        wrapper.id = this.id;
        wrapper.setAttribute("role", "button");
        wrapper.setAttribute("tabindex", "0");
        wrapper.setAttribute("title", `${this.name} (${this.breed}) - クリック:鳴く / ダブルクリック:増える / お家へドラッグ:退去`);

        // 猫本体のSVG
        const svgContent = window.CatAssets ? window.CatAssets.createCatSvgString(this.breed) : "";
        
        wrapper.innerHTML = `
            <div class="cat-body-wrapper">
                ${svgContent}
            </div>
            <div class="cat-nameplate">${this.name}</div>
            <div class="cat-speech-bubble" style="display: none;"></div>
        `;

        this.element = wrapper;
        this.bubbleElement = wrapper.querySelector(".cat-speech-bubble");
        this.stage.appendChild(this.element);

        this.bindEvents();
        this.updatePosition();
    }

    bindEvents() {
        let lastClickTime = 0;

        // ドラッグ開始
        this.element.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return; // 左クリックのみ
            const now = Date.now();
            if (now - lastClickTime < 320) {
                // ダブルクリック検出
                this.handleDoubleClick(e);
                lastClickTime = 0;
                e.stopPropagation();
                return;
            }
            lastClickTime = now;

            this.startDrag(e.clientX, e.clientY);
            this.handleClick(e);
            e.stopPropagation();
        });

        // タッチ操作対応
        this.element.addEventListener("touchstart", (e) => {
            if (e.touches.length === 1) {
                const touch = e.touches[0];
                const now = Date.now();
                if (now - lastClickTime < 350) {
                    this.handleDoubleClick(touch);
                    lastClickTime = 0;
                    e.preventDefault();
                    return;
                }
                lastClickTime = now;
                this.startDrag(touch.clientX, touch.clientY);
                this.handleClick(touch);
                e.preventDefault();
            }
        }, { passive: false });

        window.addEventListener("mousemove", (e) => {
            if (this.isDragging) {
                this.onDrag(e.clientX, e.clientY);
            }
        });

        window.addEventListener("touchmove", (e) => {
            if (this.isDragging && e.touches.length > 0) {
                this.onDrag(e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: false });

        window.addEventListener("mouseup", () => {
            if (this.isDragging) this.endDrag();
        });

        window.addEventListener("touchend", () => {
            if (this.isDragging) this.endDrag();
        });
    }

    startDrag(clientX, clientY) {
        this.isDragging = true;
        this.state = "dragging";
        this.element.classList.add("is-dragging");
        this.dragOffsetX = clientX - this.x;
        this.dragOffsetY = clientY - this.y;
    }

    onDrag(clientX, clientY) {
        this.x = clientX - this.dragOffsetX;
        this.y = clientY - this.dragOffsetY;
        this.updatePosition();

        // 猫の家の上にあるかチェックしてハイライト
        this.checkHouseHover();
    }

    checkHouseHover() {
        const house = document.getElementById("cat-house");
        if (!house) return false;

        const hRect = house.getBoundingClientRect();
        const catCenterX = this.x + 55 * this.scale;
        const catCenterY = this.y + 45 * this.scale;

        const isOverHouse = (
            catCenterX >= hRect.left &&
            catCenterX <= hRect.right &&
            catCenterY >= hRect.top &&
            catCenterY <= hRect.bottom
        );

        if (isOverHouse) {
            house.classList.add("drag-hover");
        } else {
            house.classList.remove("drag-hover");
        }
        return isOverHouse;
    }

    endDrag() {
        this.isDragging = false;
        this.element.classList.remove("is-dragging");

        const house = document.getElementById("cat-house");
        if (house) {
            house.classList.remove("drag-hover");
        }

        // 猫の家にドロップされたか確認
        if (this.checkHouseHover()) {
            if (this.onDropOnHouse) {
                this.onDropOnHouse(this);
                return;
            }
        }

        this.state = "walking";
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 3;
        this.stateTimer = 0;
    }

    /**
     * 猫の家に入って画面から退去するアニメーション
     */
    retireToHouse(targetHouseElement, onComplete) {
        this.state = "retiring";
        this.isDragging = false;
        this.element.classList.add("cat-retiring");
        this.showSpeechBubble("おやすみにゃ〜💤");

        if (window.CatAudio) {
            window.CatAudio.playPurrSound(window.CatAudio.getAudioContext ? window.CatAudio.getAudioContext() : null, 0);
        }

        const hRect = targetHouseElement.getBoundingClientRect();
        const stageRect = this.stage.getBoundingClientRect();
        const doorX = (hRect.left - stageRect.left) + hRect.width / 2 - (55 * this.scale);
        const doorY = (hRect.top - stageRect.top) + hRect.height * 0.55;

        // ドアに向かって吸い込まれる
        this.element.style.transition = "all 0.55s cubic-bezier(0.55, 0.085, 0.68, 0.53)";
        this.element.style.transform = `translate3d(${doorX}px, ${doorY}px, 0) scale(0.18)`;
        this.element.style.opacity = "0";

        setTimeout(() => {
            this.destroy();
            if (onComplete) onComplete(this);
        }, 550);
    }


    handleClick(e) {
        // 鳴き声再生
        if (window.CatAudio) {
            window.CatAudio.playMeow({
                pitchMultiplier: 0.8 + (1.2 - this.scale) * 0.6,
                type: Math.random() > 0.8 ? "purr" : "meow"
            });
        }

        // ふきだし表示
        const meowWords = ["ニャー！", "ミャオ♪", "にゃーん✨", "ゴロゴロ…", "にゃ？", "うにゃ〜🐾", "なでて〜"];
        const word = meowWords[Math.floor(Math.random() * meowWords.length)];
        this.showSpeechBubble(word);

        // ジャンプリアクション
        this.element.classList.add("cat-jump-anim");
        setTimeout(() => {
            if (this.element) this.element.classList.remove("cat-jump-anim");
        }, 400);

        if (this.onClick) {
            this.onClick(this);
        }
    }

    handleDoubleClick(e) {
        // ダブルクリックで2匹に増える
        if (window.CatAudio) {
            window.CatAudio.playPopSpawnSound();
            window.CatAudio.playMeow({ pitchMultiplier: 1.4, type: "kitten" });
        }

        this.showSpeechBubble("ぽんっ！✨ 子猫誕生！");
        this.createSpawnEffect();

        if (this.onDuplicate) {
            this.onDuplicate(this);
        }
    }

    showSpeechBubble(text) {
        if (!this.bubbleElement) return;
        this.bubbleElement.textContent = text;
        this.bubbleElement.style.display = "block";
        this.bubbleElement.classList.remove("bubble-fade-out");
        
        clearTimeout(this._bubbleTimeout);
        this._bubbleTimeout = setTimeout(() => {
            if (this.bubbleElement) {
                this.bubbleElement.classList.add("bubble-fade-out");
                setTimeout(() => {
                    if (this.bubbleElement) this.bubbleElement.style.display = "none";
                }, 300);
            }
        }, 1600);
    }

    createSpawnEffect() {
        const effect = document.createElement("div");
        effect.className = "cat-spawn-effect";
        effect.style.left = `${this.x + 40}px`;
        effect.style.top = `${this.y + 30}px`;
        effect.innerHTML = `<span>✨</span><span>💖</span><span>🐾</span><span>⭐</span>`;
        this.stage.appendChild(effect);
        setTimeout(() => effect.remove(), 1000);
    }

    /**
     * 自律AIの更新ループ (毎フレーム実行)
     */
    update(deltaTime) {
        if (this.isDragging) return;

        this.stateTimer += deltaTime;
        if (this.stateTimer > this.stateDuration) {
            this.switchRandomState();
        }

        const stageRect = this.stage.getBoundingClientRect();
        const stageW = stageRect.width || window.innerWidth;
        const stageH = stageRect.height || window.innerHeight;

        const catWidth = 110 * this.scale;
        const catHeight = 90 * this.scale;

        // 行動状態ごとの挙動
        switch (this.state) {
            case "walking":
            case "running":
                this.x += this.vx;
                this.y += this.vy;
                this.walkCycle += deltaTime * 0.008 * (this.state === "running" ? 2 : 1);

                // 向きの更新
                if (Math.abs(this.vx) > 0.1) {
                    this.direction = this.vx > 0 ? 1 : -1;
                }

                // 壁での反射・バウンド
                if (this.x < 10) {
                    this.x = 10;
                    this.vx = Math.abs(this.vx) * (0.8 + Math.random() * 0.4);
                } else if (this.x > stageW - catWidth - 10) {
                    this.x = stageW - catWidth - 10;
                    this.vx = -Math.abs(this.vx) * (0.8 + Math.random() * 0.4);
                }

                if (this.y < 40) {
                    this.y = 40;
                    this.vy = Math.abs(this.vy) * (0.8 + Math.random() * 0.4);
                } else if (this.y > stageH - catHeight - 20) {
                    this.y = stageH - catHeight - 20;
                    this.vy = -Math.abs(this.vy) * (0.8 + Math.random() * 0.4);
                }
                break;

            case "idle":
            case "grooming":
            case "sleeping":
                // 停止・その場でのんびり
                break;
        }

        this.updatePosition();
    }

    switchRandomState() {
        this.stateTimer = 0;
        const rand = Math.random();

        if (rand < 0.45) {
            // 歩行
            this.state = "walking";
            this.speed = 1.0 + Math.random() * 1.5;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed * 0.6;
            this.stateDuration = 2500 + Math.random() * 4500;
        } else if (rand < 0.70) {
            // ダッシュ！
            this.state = "running";
            this.speed = 3.5 + Math.random() * 2.5;
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * this.speed;
            this.vy = Math.sin(angle) * this.speed * 0.6;
            this.stateDuration = 1500 + Math.random() * 2500;
        } else if (rand < 0.85) {
            // まったり・毛づくろい
            this.state = "grooming";
            this.vx = 0;
            this.vy = 0;
            this.stateDuration = 2000 + Math.random() * 3000;
        } else {
            // 居眠り
            this.state = "sleeping";
            this.vx = 0;
            this.vy = 0;
            this.stateDuration = 3000 + Math.random() * 5000;
        }

        // CSSクラス更新
        this.element.className = `cat-container cat-breed-${this.breed} cat-state-${this.state}`;
    }

    updatePosition() {
        if (!this.element) return;
        const flip = this.direction === 1 ? "scaleX(1)" : "scaleX(-1)";
        const bobbing = (this.state === "walking" || this.state === "running")
            ? Math.sin(this.walkCycle * 8) * 3
            : 0;

        this.element.style.transform = `translate3d(${this.x}px, ${this.y + bobbing}px, 0) scale(${this.scale}) ${flip}`;
    }

    /**
     * マウス位置へ猫を惹きつける
     */
    attractTo(targetX, targetY) {
        if (this.isDragging) return;
        const dx = targetX - (this.x + 50 * this.scale);
        const dy = targetY - (this.y + 40 * this.scale);
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 30) {
            const moveSpeed = 2.8;
            this.vx = (dx / dist) * moveSpeed;
            this.vy = (dy / dist) * moveSpeed;
            this.state = "running";
            this.stateTimer = 0;
            this.direction = this.vx > 0 ? 1 : -1;
        }
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    serialize() {
        return {
            id: this.id,
            name: this.name,
            breed: this.breed,
            x: Math.round(this.x),
            y: Math.round(this.y),
            vx: Number(this.vx.toFixed(2)),
            vy: Number(this.vy.toFixed(2)),
            scale: Number(this.scale.toFixed(2)),
            state: this.state
        };
    }
}

if (typeof window !== "undefined") {
    window.Neko = Neko;
}
