const askButton = document.getElementById("askButton");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const loadingText = document.getElementById("loading");
const dotsText = document.getElementById("dots");

askButton.addEventListener("click", askButtonClicked);

async function askButtonClicked() {
    
    try{
        // ローディング表示
        loadingText.style.display = "inline-block";
        dotsText.style.display = "inline-block";
        loadingText.innerText = "考え中";

        // バックへPOSTメッセージを送る
        // POSTメッセージは質問文を送るのでstring型を指定する
        const geminiRes = await fetch('api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: inputText.value,
        });
        const geminiText = await geminiRes.text();
        outputText.innerText = geminiText;

        // ローディング表示変更
        loadingText.innerText = "発声準備中";

        // 音声再生
        const voicevoxRes = await fetch('api/local/voicevox', {
            method: 'POST',
            headers: {
            'Content-Type': 'text/plain',
            },
            body: geminiText,
        });

        if (!voicevoxRes.ok) {
            throw new Error('サーバーとの通信に失敗しました');
        }

        // 音声データをバイナリとして取得
        const audioBlob = await voicevoxRes.blob();
        
        // 音声データを再生
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
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
    console.error('エラー: ', error);
    
    } finally {
        // Loading表示を非表示にする
        loadingText.style.display = "none";
        dotsText.style.display = "none";
    }
}