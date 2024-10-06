// Get HTML element IDs
const ids = {
    askButton: "askButton",
    inputText: "inputText",
    outputText: "outputText",
    useLocalApi: "useLocalApi",
    useLocalApiText: "useLocalApiText",
    loadingText: "loading",
    dotsText: "dots"
}
const elements = {};
Object.keys(ids).forEach(key => elements[key] = document.getElementById(ids[key]));

// テキスト入力
inputText.addEventListener("input", () => {
    const isEmpty = inputText.value.trim() === "";
    elements.askButton.disabled = isEmpty;
});

// テキストエリアで Ctrl+Enter
inputText.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
        elements.outputText.innerHTML = "";
        askButtonClicked(inputText.value);
    }
});

// 質問する! ボタン押下
askButton.addEventListener("click", () => {
    elements.outputText.innerHTML = "";
    askButtonClicked(inputText.value);
});

if(window.location.hostname !== "localhost"){
    useLocalApi.disabled = true;
    useLocalApiText.innerHTML = `<span title='ローカル環境でのみ使用できます'>${useLocalApiText.innerHTML}</span>`;
} 

async function askButtonClicked(input) {
    try{
        // ローディング表示
        toggleLoading(true, "考え中");
        
        // 回答文生成
        const gemini = await fetchAndParse("/api/gemini", -1, input, "application/json", "text");        
        outputText.innerText = gemini;
        
        // ローディング表示変更
        toggleLoading(true, "発声準備中");
        
        // 音声処理
        playVoice(gemini);
    } catch (error){
        console.error("エラー: ", error);
    }
}

// ロード表示処理用関数
function toggleLoading(isLoading, text) {
    elements.loadingText.style.display = isLoading ? "inline-block" : "none";
    elements.dotsText.style.display = isLoading ? "inline-block" : "none";
    elements.loadingText.innerText = text;
}

// LLMエンドポイント通信用関数
async function fetchAndParse(url, order, text, type, returnType) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": type,
        },
        body: JSON.stringify({ order: order, text: text }),
    });
    return returnType === "json" ? response.json() : response.text();
}

// 音声再生準備用関数
async function playVoice(text) {
    const speakerID = "3";
    
    // ローカル環境なら高速版またはローカル版を利用し、それ以外 (Vercel)ならストリーミング版を利用する
    if (window.location.hostname === "localhost") {
        elements.useLocalApi.checked ? await synthesizeAudioLocally("/api/voicevox/local", text, speakerID)
            : await synthesizeAudioLocally("/api/voicevox/fast", text, speakerID);
    }
    else await synthesizeAudioStreaming("/api/voicevox/streaming", text, speakerID);
}

// ローカル環境での合成用関数
async function synthesizeAudioLocally(url, text, speaker) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text, speaker: speaker }),
    });
    if (!response.ok) {
        // 合成失敗時はストリーミング版を使う
        synthesizeAudioStreaming("/api/voicevox/streaming", text, speaker);
        return;
    }    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);

    handleAudio(audio, audioUrl);
}

// ストリーミング版合成用関数
async function synthesizeAudioStreaming(url, text, speaker) {
        const apiKeyResponse = await fetch(url, {
            method: "POST",
        headers: { "Contents-Type": "text/plain" },
    });
    const apiKey = await apiKeyResponse.text();
    const audio = new TtsQuestV3Voicevox(speaker, text, apiKey);
    
    handleAudio(audio, null);
}

// 再生用関数
async function handleAudio(audio, audioUrl) {
    audio.play();
    audio.addEventListener("playing", () => toggleLoading(false, ""));
    if (audioUrl) audio.onended = () => URL.revokeObjectURL(audioUrl);
}