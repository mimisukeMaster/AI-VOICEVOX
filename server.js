const express = require("express");
const path = require("path");
require("dotenv").config();
const app = express();
const PORT = 3000;

/* サーバーの起動準備 */ 
// フロントJSから送られるデータ型に合わせたミドルウェアを設定
// その型を受け付けられるようにする
app.use(express.text());
app.use(express.json());

// 起動サーバーのルート指定
app.use("/", express.static(path.join(__dirname, "public")));

// ポート起動
app.listen(PORT, () => {
    console.log(`Server started on port:${PORT}`);
});

/* Gemini用 HTTP POST */
app.post("/api/gemini", async (req, res) => {

    // GeminiAPIの準備 Keyは.envから取得
    const {
        GoogleGenerativeAI,
        HarmCategory,
        HarmBlockThreshold,
    } = require("@google/generative-ai");

    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
    });

    const generationConfig = {
        temperature: 1,
        topP: 0.95,
        topK: 64,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
    };
    
    const chatSession = model.startChat({
        generationConfig,
        history: [
        ],
    });

    // 実際にプロンプト文を送信して返答を代入
    const geminiResult = await chatSession.sendMessage(req.body + 
        "/ただし、回答は300文字以内にして、使用できる記号は「。、！？」のみで、他(マークダウン用も含む)は使わないで下さい。口語体にして、常に話を展開させることを意識してください。");
    const filteredText = geminiResult.response.text().replace(/[<>*:;]/g,"");
    res.send(filteredText);
});

/* cohere用 HTTP POST */
app.post("/api/cohere", async (req, res) => {
    
    // cohereの Chat API の準備 Keyは.envから取得
    const CohereClient = require('cohere-ai').CohereClient;

    const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
    });

    try {
        // チャットリクエストを送信する
        const cohereResult = await cohere.chat({
            model: "command-r-plus",
            message: req.body + "/ただし、回答は300文字以内にして、使用できる記号は「。、！？」のみで、他(マークダウン用も含む)は使わないで下さい。口語体にして、常に話を展開させることを意識してください。",
        });
        const filteredText = cohereResult.text.replace(/[<>*:;]/g,"");
        res.send(filteredText);

    } catch (error) {
        // エラーハンドリング
        console.error('Error:', error);
    }

})

/* VOICEVOX用 HTTP POST */
app.post("/api/voicevox", async (req, res) => {

    const host = req.hostname || req.get("host");
    if (host.includes("localhost")){

        // ローカル環境では高速版を使い合成
        const apiUrl = "https://deprecatedapis.tts.quest/v2/voicevox/audio";
        const voicevoxApiKey = process.env.VOICEVOX_API_KEY;
        const intonationScale = 0.7;
        const speed = 1.2;
        try {
            const response = await fetch(`${apiUrl}?key=${voicevoxApiKey}&speaker=${req.body.speaker}&intonationScale=${intonationScale}&speed=${speed}&text=${req.body.text}`);
            if (!response.ok) {
                throw new Error("音声生成に失敗しました", response);
            }

            // 音声バイナリを受け取る
            const voicevoxResult = await response.arrayBuffer();

            // フロントエンドにBufferに整形して返す
            res.set("Content-Type", "audio/wav");
            res.send(Buffer.from(voicevoxResult));

        } catch (error) {
            res.status(500).json({ error: "リクエストに失敗しました" });
            console.log("fetch全体で何らかのエラ―:", error.message);
        }

    } else {
        // それ以外(Vercel)ではストリーミング版を使うので APIキーを返す
        res.send(process.env.VOICEVOX_API_KEY); 
    }
});

/* ローカル版 VOICEVOX用 HTTP POST */
app.post("/api/local/voicevox", async (req, res) => {

    const apiUrl = "https://localhost:50021";
    const intonationScale = 0.7;
    const speed = 1.2;
    try {
        const audio_query_response = await fetch(`${apiUrl}/audio_query?text=${encodeURIComponent(req.body.text)}&speaker=${req.body.speaker}`, {
            method: "POST",
            headers: {
                "accept": "application/json",
            },
        });

        if (!audio_query_response.ok) {
            throw new Error("音声生成（クエリ生成）に失敗しました");
        }

        const audio_query_data = await audio_query_response.json()

        audio_query_data.intonationScale = intonationScale;
        audio_query_data.speedScale = speed;

        const response = await fetch(`${apiUrl}/synthesis?speaker=${req.body.speaker}`, {
            method: "POST",
            headers: {
                "accept": "audio/wav",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(audio_query_data)
        });
        
        if (!response.ok) {
            throw new Error("音声生成（wav生成）に失敗しました");
        }

        // 音声バイナリを受け取る
        const voicevoxResult = await response.arrayBuffer();
        
        // フロントエンドにBufferに整形して返す
        res.set("Content-Type", "audio/wav");
        res.send(Buffer.from(voicevoxResult));
        
    } catch (error) {
        res.status(500).json({ error: "リクエストに失敗しました" });
        console.log("fetch全体で何らかのエラ―:", error.message);
    }
});

module.exports = app;