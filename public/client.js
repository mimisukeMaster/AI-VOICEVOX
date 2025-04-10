// Get HTML element IDs
const ids = {
    debateButton: "debateButton",
    inputText: "inputText",
    outputText: "outputText",
    characterID: "character",
    organizeButton: "organizeButton",
    organizedText: "organizedText",
    useLocalApi: "useLocalApi",
    useLocalApiText: "useLocalApiText",
    loadingText: "loading",
    dotsText: "dots",
    debateFinishButton: "debateFinish",
    finishingText: "finishingText",
    finishing: "finishing",
    summaryToggle: "summaryToggle",
    summary: "summary",
};
const elements = {};
Object.keys(ids).forEach(key => elements[key] = document.getElementById(ids[key]));

const organizeButtonText = elements.organizeButton.textContent;
const badContentNotice = "不適切なコンテンツを含む回答が生成されてしまいました。論題を変えて再度お試しください。";

let orderInt = 0;
let isFinish = false;

let geminiText = null;
let cohereText = null;

// テキスト入力
elements.inputText.addEventListener("input", () => {
    const isEmpty = elements.inputText.value.trim() === "";
    elements.organizeButton.disabled = isEmpty;
});

// テキストエリアで Ctrl+Enter
elements.inputText.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
        elements.outputText.innerHTML = "";
        elements.summary.innerHTML = "";
        elements.debateButton.disabled = false;
        organizeButtonClicked(elements.inputText.value);
    }
});

// 論点を整理する ボタン押下
elements.organizeButton.addEventListener("click", () => {
    elements.outputText.innerHTML = "";
    elements.summary.innerHTML = "";
    elements.debateButton.disabled = false;
    organizeButtonClicked(elements.inputText.value);
});

// 討論開始! ボタン押下
elements.debateButton.addEventListener("click", () => {
    
    // ボタン制御
    elements.organizeButton.disabled = true;
    elements.debateButton.disabled = true;
    elements.debateFinishButton.disabled = false;

    debateButtonClicked();
});

// 終了 ボタン押下
elements.debateFinishButton.addEventListener("click", () => {
    isFinish = true;
    elements.finishingText.innerText = "今のターンで終了します";
    elements.finishing.style.display = "inline-block";
});

// 要約文展開 ボタン押下
elements.summaryToggle.addEventListener("click", () => {
    // toggleDisplay();
})

if(window.location.hostname !== "localhost"){
    elements.useLocalApi.disabled = true;
    elements.useLocalApiText.innerHTML = `<span title='ローカル環境でのみ使用できます'>${useLocalApiText.innerHTML}</span>`;
} 

async function organizeButtonClicked(input) {
    
    // 要約文のトグルと中身を消す 
    elements.summaryToggle.style.display = 'none';
    elements.summary.innerHTML = "";

    // Bootstrap Collapseの状態リセット
    const collapseElement = elements.summary;
    if (collapseElement.classList.contains('show')) {
        const collapseInstance = bootstrap.Collapse.getInstance(collapseElement);
        if (collapseInstance) {
            collapseInstance.hide();
        } else {
            // フォールバック
            collapseElement.classList.remove('show');
        }
    }

    // Geminiに論点整理をさせ表示する
    const geminiOrganize = await fetch("api/gemini", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: orderInt, text: input }),
    });
    const geminiOrganizeRes = await geminiOrganize.text();
    if (geminiOrganizeRes.includes("A server error has occurred\n\nFUNCTION_INVOCATION_FAILED\n")) {
        elements.organizedText.innerHTML = badContentNotice;
    } else elements.organizedText.innerHTML = geminiOrganizeRes;

    elements.organizeButton.textContent = "再生成する";

    // ボタン有効化
    elements.debateButton.disabled = false;
}

// 要約文展開
function toggleDisplay() {
    var content = elements.summary.style;
    content.display = content.display === "none" ? "block" : "none";
}

async function debateButtonClicked() {
    
    try{
        // テキストを戻す
        elements.organizeButton.textContent = organizeButtonText;

        // ローディング表示
        toggleLoading(true, "考え中");

        // 交互に異なるLLMを使用
        orderInt++;
        
        if (orderInt % 2 !== 0) {

            // Geminiで賛成意見生成  表示  議題と主張はserver.jsの変数に既に存在  
            geminiText = await fetchAndParse("api/gemini", orderInt, "application/json", "json");
            showOutput("geminiDebate", orderInt, geminiText.assertion);
        } else {

            // Cohereで反対意見生成
            cohereText = await fetchAndParse("api/cohere", orderInt, "text/plain", "text");
            showOutput("cohereDebate", orderInt, cohereText);
        }
        
        // ローディング表示変更
        toggleLoading(true, "発声準備中");
        
        // 音声処理
        playVoice(orderInt % 2 !== 0 ? geminiText.assertion : cohereText);

        // 計10回の意見生成(各5回)で終了
        if (orderInt >= 10) isFinish = true;
    } catch (error){
        console.error(`エラー: ${error}`);
    }
}

// LLMエンドポイント通信用関数
async function fetchAndParse(url, order, type, returnType) {
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": type,
        },
        body: JSON.stringify({ order: order, text: "" }),
    });
    return returnType === "json" ? response.json() : response.text();
}

// 回答表示用関数
function showOutput(className, order, text) {
    elements.outputText.innerHTML += `<div class="${className}">${text}</div><br>`;
    
    // 2週目以降ならば要約も表示
    if (order !== 1 && className === "geminiDebate") {
        elements.summary.innerHTML = geminiText.summary;
        elements.summaryToggle.style.display = "inline-block";
    }
}

// ロード表示処理用関数
function toggleLoading(isLoading, text) {
    elements.loadingText.style.display = isLoading ? "inline-block" : "none";
    elements.dotsText.style.display = isLoading ? "inline-block" : "none";
    elements.loadingText.innerText = text;
}

// 音声再生準備用関数
async function playVoice(text) {
    const speakerID = orderInt % 2 !== 0 ? "3" : elements.characterID.value;
    
    // ローカル環境なら高速版またはローカル版を利用し、それ以外 (Vercel)ならストリーミング版を利用する
    if (window.location.hostname === "localhost") {
        elements.useLocalApi.checked ? await synthesizeAudioLocally("api/voicevox/local", text, speakerID)
            : await synthesizeAudioLocally("api/voicevox/fast", text, speakerID);
    }
    else await synthesizeAudioStreaming("api/voicevox/streaming", text, speakerID);
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
        synthesizeAudioStreaming("api/voicevox/streaming", text, speaker);
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
    audio.addEventListener("ended", () => debateEnded());
    if (audioUrl) audio.onended = () => URL.revokeObjectURL(audioUrl);
}

// 討論継続判断用関数
function debateEnded() {
    if (isFinish) resetDebate();
    else debateButtonClicked();
}

// 初期化用関数
function resetDebate() {
    isFinish = false;
    orderInt = 0;

    elements.finishingText.innerText = "";
    elements.finishing.style.display = "none";
    toggleLoading(false, "");

    elements.organizeButton.disabled = false;
    elements.debateFinishButton.disabled = true;
}