/**
 * audio.js - 猫の鳴き声サウンドシステム (Web Audio API & 音声Blob生成)
 */

const CatAudio = (function() {
    let audioCtx = null;

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === "suspended") {
            audioCtx.resume();
        }
        return audioCtx;
    }

    /**
     * 猫の鳴き声（ニャー）をWeb Audio APIで周波数合成して再生
     * @param {Object} options - { pitchMultiplier, type: 'meow'|'purr'|'kitten'|'chirp' }
     */
    function playMeow(options = {}) {
        const ctx = getAudioContext();
        if (!ctx) return;

        const pitch = options.pitchMultiplier || (0.9 + Math.random() * 0.3);
        const soundType = options.type || (Math.random() > 0.3 ? "meow" : "chirp");

        const now = ctx.currentTime;

        if (soundType === "purr") {
            playPurrSound(ctx, now);
            return;
        }

        // 基本オシレーター (声帯振動)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        // フォルマントフィルター (猫の口の開き具合 'M -> nya -> oo')
        filter.type = "bandpass";
        filter.Q.setValueAtTime(3.5, now);

        // 周波数のカーブ設定 (猫のピッチ遷移: 上がってからゆっくり下がる)
        const baseFreq = (soundType === "kitten" ? 750 : 520) * pitch;
        const duration = soundType === "chirp" ? 0.25 : 0.65;

        osc1.type = "sine";
        osc2.type = "triangle";

        // メインピッチカーブ
        osc1.frequency.setValueAtTime(baseFreq * 0.8, now);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + duration * 0.3);
        osc1.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + duration);

        osc2.frequency.setValueAtTime(baseFreq * 1.6, now);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.7, now + duration * 0.3);
        osc2.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, now + duration);

        // 口の開きによるフォルマント変化
        filter.frequency.setValueAtTime(800 * pitch, now);
        filter.frequency.linearRampToValueAtTime(1800 * pitch, now + duration * 0.35);
        filter.frequency.exponentialRampToValueAtTime(600 * pitch, now + duration);

        // 音量エンベロープ (アタック・ディケイ・リリース)
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.linearRampToValueAtTime(0.28, now + 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.2, now + duration * 0.6);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        // 接続
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
    }

    /**
     * ゴロゴロ音（Purr）の再生
     */
    function playPurrSound(ctx, now) {
        const duration = 1.2;
        const osc = ctx.createOscillator();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        const masterGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(70, now);

        lfo.type = "sine";
        lfo.frequency.setValueAtTime(25, now); // ゴロゴロの振動数

        lfoGain.gain.setValueAtTime(0.15, now);
        lfo.connect(lfoGain.gain);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(220, now);

        masterGain.gain.setValueAtTime(0.001, now);
        masterGain.gain.linearRampToValueAtTime(0.18, now + 0.2);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + duration);
        osc.stop(now + duration);
    }

    /**
     * 増殖・誕生エフェクト音
     */
    function playPopSpawnSound() {
        const ctx = getAudioContext();
        if (!ctx) return;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(350, now);
        osc.frequency.exponentialRampToValueAtTime(950, now + 0.18);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.22);
    }

    /**
     * 鳴き声音声Blobを生成（仕様のデータモデル用）
     */
    async function generateMeowAudioBlob() {
        const sampleRate = 44100;
        const duration = 0.6;
        const numSamples = Math.floor(sampleRate * duration);
        const offlineCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, numSamples, sampleRate);

        const osc = offlineCtx.createOscillator();
        const gain = offlineCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(500, 0);
        osc.frequency.exponentialRampToValueAtTime(750, 0.2);
        osc.frequency.exponentialRampToValueAtTime(400, duration);

        gain.gain.setValueAtTime(0.001, 0);
        gain.gain.linearRampToValueAtTime(0.3, 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, duration);

        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(0);
        osc.stop(duration);

        const renderedBuffer = await offlineCtx.startRendering();
        // WAV形式のBlobに変換
        const wavBlob = audioBufferToWavBlob(renderedBuffer);
        return wavBlob;
    }

    function audioBufferToWavBlob(buffer) {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const out = new DataView(new ArrayBuffer(length));
        const channels = [];
        let sample = 0;
        let offset = 0;
        let pos = 0;

        function setUint16(data) { out.setUint16(pos, data, true); pos += 2; }
        function setUint32(data) { out.setUint32(pos, data, true); pos += 4; }

        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"
        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit
        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        for (let i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (offset < buffer.length) {
            for (let i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset]));
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
                out.setInt16(pos, sample, true);
                pos += 2;
            }
            offset++;
        }

        return new Blob([out.buffer], { type: "audio/wav" });
    }

    return {
        playMeow,
        playPurrSound,
        playPopSpawnSound,
        generateMeowAudioBlob
    };
})();

if (typeof window !== "undefined") {
    window.CatAudio = CatAudio;
}
