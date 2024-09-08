const askButton = document.getElementById("askButton");
const inputText = document.getElementById("inputText");
const outputTextL = document.getElementById("outputTextL");
const outputTextR = document.getElementById("outputTextR");
const useLocalApi = document.getElementById("useLocalApi");
const loadingText = document.getElementById("loading");
const dotsText = document.getElementById("dots");

askButton.addEventListener("click", () => {
    askButtonClicked(inputText.value);
});

async function askButtonClicked(input) {
    
    try{
        // ローディング表示
        loadingText.style.display = "inline-block";
        dotsText.style.display = "inline-block";
        loadingText.innerText = "考え中";

        // バックへPOSTメッセージを送る
        // POSTメッセージは質問文を送るのでstring型を指定する
        const geminiRes = await fetch("../api/gemini", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain",
            },
            body: input + "について議論して下さい。議論をしていく上で、同じ文章は会話内で繰り返さないでください。何か聞き返したり、反論したりと、常に進展を持たせる内容にしてください。",
        });
        const geminiText = await geminiRes.text();
        outputTextL.innerText += geminiText;

        // ローディング表示変更
        loadingText.innerText = "発声準備中";

        // アクセス先指定
        let endPointURL = null;
        if(useLocalApi.checked) {
            endPointURL = "api/local/voicevox";
        } else {
            endPointURL = "api/voicevox";
        }
        // 音声生成
        const voicevoxRes = await fetch("../api/voicevox", {
            method: "POST",
            headers: {
            "Content-Type": "text/plain",
            },
            body: geminiText,
        });

        if (!voicevoxRes.ok) {
            throw new Error("サーバーとの通信に失敗しました");
        }

        // 音声データをバイナリとして取得
        const audioBlob = await voicevoxRes.blob();
        
        // 音声データを再生
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.addEventListener("ended", () => {            
            askButtonClicked(geminiText);
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