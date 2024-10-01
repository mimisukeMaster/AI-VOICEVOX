
const debateButton = document.getElementById("debateButton");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const characterID = document.getElementById("character");
const organizeButton = document.getElementById("organizeButton");
const organizedText = document.getElementById("organizedText");
const useLocalApi = document.getElementById("useLocalApi");
const useLocalApiText = document.getElementById("useLocalApiText");
const loadingText = document.getElementById("loading");
const dotsText = document.getElementById("dots");
const debateFinish = document.getElementById("debateFinish");
const finishingText = document.getElementById("finishingText");
const finishing = document.getElementById("finishing");
const summary = document.getElementById("summary");

let orderInt = 0;
let isFinish = false;

let geminiText = null;
let cohereText = null;

inputText.addEventListener("input", () => {
    if (inputText.value.trim() === "") {
        organizeButton.disabled = true;
        debateButton.disabled = true;
    } else {
        organizeButton.disabled = false;
    }
});

inputText.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
        organizeButtonClicked(inputText.value);
        outputText.innerHTML = "";
    }
});

organizeButton.addEventListener("click", () => {
    organizeButtonClicked(inputText.value);
    outputText.innerHTML = "";
})

debateButton.addEventListener("click", () => {
    debateButtonClicked();
});


debateFinish.addEventListener("click", () => {
    isFinish = true;
    finishingText.innerText = "今のターンで終了します";
    finishing.style.display = "inline-block";
});

if(window.location.hostname !== "localhost"){
    useLocalApi.disabled = true;
    useLocalApiText.innerHTML = `<span title='ローカル環境でのみ使用できます'>${useLocalApiText.innerHTML}</span>`;
} 

async function organizeButtonClicked(input) {

    // Geminiに論点整理をさせ表示する
    const geminiOrganize = await fetch("../api/gemini", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ order: orderInt, text: input }),
    });
    organizedText.innerHTML = await geminiOrganize.text();

    //　ボタン有効化
    debateButton.disabled = false;
}

async function debateButtonClicked() {
    
    try{
        // ローディング表示
        loadingText.style.display = "inline-block";
        dotsText.style.display = "inline-block";
        loadingText.innerText = "考え中";
                
        // ボタン制御
        organizeButton.disabled = true;
        debateButton.disabled = true;
        debateFinish.disabled = false;
        
        // バックへPOSTメッセージを送る
        // POSTメッセージは質問文を送るのでstring型を指定する
        // 発言を分ける
        orderInt++;
        
        if (orderInt % 2 !== 0) {
            // Geminiで賛成意見生成    
            // 議題・意見情報はサーバ側に存在しているのでtextは何も渡さないAI豆打者との兼ね合いでintではなくJSON形式を残している     
            const gemini = await fetch("../api/gemini", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ order: orderInt, text: ""}),
            });
            geminiText = await gemini.json();
            console.log(orderInt)
            if (orderInt !== 1){
                // 2週目以降は要約も表示
                summary.innerHTML = geminiText.summary;
            }
            // 賛成意見表示
            outputText.innerHTML += "<br><div class='geminiDebate'>" + geminiText.assertion + "</div>";

        } else {
            // Cohereで反対意見生成
            const cohere = await fetch("../api/cohere", {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                },
                body: "",
            });
            cohereText = await cohere.text();

            outputText.innerHTML += "<br><div class='cohereDebate'>" + cohereText + "</div>";

        }
        // 最下部に移動
        inputText.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // ローディング表示変更
        loadingText.innerText = "発声準備中";
        
        // アクセス先指定
        let endPointURL = null;
        if(useLocalApi.checked) {
            endPointURL = "../api/local/voicevox";
        } else {
            endPointURL = "../api/voicevox";
        }
        // 音声生成
        let bodyText = null;
        let speakerID = null;
        if (orderInt % 2 !== 0){
            bodyText = geminiText.assertion;
            speakerID = "3"
        } else {
            bodyText = cohereText;
            speakerID = characterID.value;
        }

        if(window.location.hostname === "localhost") {
            
            // ローカル環境では高速版を使う
            const voicevox = await fetch(endPointURL, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: bodyText,
                    speaker: speakerID
                })
            });
            
            if (!voicevox.ok) {
                throw new Error("サーバーとの通信に失敗しました");
            }
            
            // 音声データをバイナリとして取得
            const audioBlob = await voicevox.blob();
            
            // 音声データを再生
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.play();
            
            // 使い終わったらURLを解放 メモリリーク防ぐ
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };

            // 音声再生開始
            audio.addEventListener("playing", () => {

                // Loading表示を非表示にする
                loadingText.style.display = "none";
                dotsText.style.display = "none";
            });
            // 再呼び出し
            audio.addEventListener("ended", () => { 
                debateEnded();
            });
        } else {

            // それ以外(Vercel)ではストリーミング版を使う
            const apiKeyRes = await fetch(endPointURL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                },
            });
            const apiKey =  await apiKeyRes.text();
            const audio = new TtsQuestV3Voicevox(speakerID, bodyText, apiKey);        
            
            // 速度は合成時に指定できないので再生速度を上げる        
            audio.playbackRate = 1.2;
            
            audio.play();

            // 音声再生開始時
            audio.addEventListener("playing", () => {

                // Loading表示を非表示にする
                loadingText.style.display = "none";
                dotsText.style.display = "none";
            });

            // 再呼び出し
            audio.addEventListener("ended", () => { 
                debateEnded();
            });
        }  
    } catch (error){
        console.error("エラー: ", error);
        
    }
}

function debateEnded() {

    // 討論終了フラグ有効時
    if (isFinish) {
        isFinish = false;
        orderInt = 0;
        finishingText.innerText = "";
        finishing.style.display = "none";
        loadingText.style.display = "none";
        dotsText.style.display = "none";
        organizeButton.disabled = false;
        debateButton.disabled = false;
        debateFinish.disabled = true;
        return;
    }
    
    debateButtonClicked();

}