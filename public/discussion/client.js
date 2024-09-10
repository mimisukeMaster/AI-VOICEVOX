const discussButton = document.getElementById("discussButton");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const useLocalApi = document.getElementById("useLocalApi");
const loadingText = document.getElementById("loading");
const dotsText = document.getElementById("dots");
let orderInt = 0;

inputText.addEventListener("input", () => {
    if (inputText.value.trim() === "") discussButton.disabled = true;
    else discussButton.disabled = false;
});

discussButton.addEventListener("click", () => {
    askButtonClicked(inputText.value);
});

inputText.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.key === "Enter") {
        askButtonClicked(inputText.value);
    }
});

async function askButtonClicked(input) {
    
    try{
        // ローディング表示
        loadingText.style.display = "inline-block";
        dotsText.style.display = "inline-block";
        loadingText.innerText = "考え中";
        
        // response用変数
        let geminiText = null;
        let cohereText = null;
        
        // バックへPOSTメッセージを送る
        // POSTメッセージは質問文を送るのでstring型を指定する
        // 発言を分ける
        orderInt++;
        
        if (orderInt % 2 !== 0) {
            
            if (orderInt === 1) {
                input += "について議論して下さい。議論をしていく上で、同じ文章は会話内で繰り返さないでください。何か聞き返したり、反論したりと、常に進展を持たせる内容にしてください。"
            }
            console.log("GeminiFetchするよ");
            
            const gemini = await fetch("../api/gemini", {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                },
                body: input,
            });
            geminiText = await gemini.text();
            
            outputText.innerHTML += "<br><div class='geminiDiscuss'>" + geminiText + "</div>";
        } else {
            console.log("Coherefetchするよ")
            const cohere = await fetch("../api/cohere", {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain",
                },
                body: input,
            });
            cohereText = await cohere.text();
            outputText.innerHTML += "<br><div class='cohereDiscuss'>" + cohereText + "</div>";
        }
        
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
        if (orderInt % 2 !== 0) bodyText = geminiText;
        else bodyText = cohereText;
        console.log(bodyText)
        const voicevox = await fetch(endPointURL, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: bodyText,
        });
        
        if (!voicevox.ok) {
            throw new Error("サーバーとの通信に失敗しました");
        }
        
        // 音声データをバイナリとして取得
        const audioBlob = await voicevox.blob();
        
        // 音声データを再生
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.addEventListener("ended", () => {            
            if (orderInt % 2 !== 0) {
                console.log("GeminiからCohereにわたる");
                askButtonClicked(geminiText);
            } else {
                console.log("cohereからGeminiにわたる")
                askButtonClicked(cohereText);
            }
        });
        audio.play();

        // エコー再生用
        // for (let i = 0; i < 10; i++) {
        //     setTimeout(() => {
        //         const audio = new Audio(audioUrl);
        //         audio.play();
        //     }, i * 200);
        // }

        // 使い終わったらURLを解放 メモリリーク防ぐ
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };

    } catch (error){
    console.error("エラー: ", error);
    
    } finally {
        // Loading表示を非表示にする
        loadingText.style.display = "none";
        dotsText.style.display = "none";
    }
}