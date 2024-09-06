const askButton = document.getElementById("askButton");
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const loadingElement = document.getElementById("loading");

askButton.addEventListener("click", askButtonClicked);

async function askButtonClicked() {
    
    // ローディング表示
    loadingElement.style.display = "block";

    try{
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


        // 音声再生
        const voicevoxRes = await fetch('api/voicevox', {
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
        
        // 使い終わったらURLを解放 メモリリーク防ぐ
        audio.onended = () => {
            URL.revokeObjectURL(audioUrl);
        };

    } catch (error){
    console.error('エラー: ', error);
    
    } finally {
        // Loading表示を非表示にする
        loadingElement.style.display = "none";
    }
}