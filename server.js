const express = require("express");
const path = require("path");
require('dotenv').config()
const app = express();
const PORT = 3000;

/* サーバーの起動準備 */ 
// フロントJSから送られるデータ型に合わせたミドルウェアを設定
// その型を受け付けられるようにする
app.use(express.text());
// app.use(express.json());

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
        "/ただし、回答は話しかけるような文体にして、記号(マークアップ用も含む)や改行を使わないで下さい。\n、。！？は使っても大丈夫です。また、英単語として読むものがあるもの(一般英単語、javascript, directXなど）はカタカナで書いて、英文字をそのまま読むもの(npm, pdf, EOSなど)は英語のままで書いてください「。ただし」からこのプロンプト文章の終わりまでの内容は出力時の背景情報として保持するのみで、それについて出力時には言及しないでください。");
    
    res.send(geminiResult.response.text());
});

/* VOICEVOX用 HTTP POST */
app.post("/api/voicevox", async (req, res) => {

    // 音声データを作って返す
    const apiUrl = 'https://deprecatedapis.tts.quest/v2/voicevox/audio';
    const voicevoxApiKey = process.env.VOICEVOX_API_KEY;
    const speakerID = '3';  // 話者ID（3: ずんだもん）
    const speed = '1.2'
    try {
        const response = await fetch(`${apiUrl}?key=${voicevoxApiKey}&speaker=${speakerID}&speed=${speed}&text=${req.body}`);
            if (!response.ok) {
                throw new Error('音声生成に失敗しました', response);
            }

        // 音声バイナリを受け取る
        const voicevoxResult = await response.arrayBuffer();
        
        // フロントエンドにBufferに整形して返す
        res.set('Content-Type', 'audio/wav');
        res.send(Buffer.from(voicevoxResult));
        
    } catch (error) {
        res.status(500).json({ error: 'リクエストに失敗しました' });
        console.log("fetch全体で何らかのエラ―:", error.message);
    }
});