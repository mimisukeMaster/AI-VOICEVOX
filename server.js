const express = require("express");
const path = require("path");
require("dotenv").config();
const app = express();
const PORT = 3000;

let theme = "";
let pros = "";
let cons = "";
let insertSummary = "";

let prosAssertion = null;
let consAssertion = null;

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

    // AI豆打者からの場合
    if(req.body.order === -1) {
        const geminiResult = await chatSession.sendMessage(req.body.text + 
            "/ただし、回答は300文字以内にして、使用できる記号は「。、！？」のみで、他(マークダウン用も含む)は使わないで下さい。口語体にして、常に話を展開させることを意識してください。");
        const filteredText = geminiResult.response.text().replace(/[<>*:;]/g,"");
        res.send(filteredText);
        return;
    }
    
    // AI討論からの場合
    // 論点整理用のとき（orderInt = 0 の時に呼ばれる）
    if(req.body.order === 0) {
        theme = req.body.text;
        const geminiOrganize = await chatSession.sendMessage(`
            次に与えられる「テーマ」から、考えられる「賛成派の主張」および「反対派の主張」をそれぞれ、とても簡潔な一文で定義づけるように表現してください。その一文には絶対に理由や追加の情報を含めないでください。
            以下の例を参考に回答を作成してください。
            
            例1
            テーマ:時間とお金どちらが大事か
            回答
            賛成派:時間が大事であり、お金よりも価値がある。
            反対派:お金が大事であり、時間よりも重要だ。

            例２
            テーマ:中高一貫校は必要なのか
            回答
            賛成派:中高一貫校は必要である。
            反対派:中高一貫校は必要ではない。

            例３
            テーマ:目玉焼きには塩か醤油か
            回答
            賛成派:目玉焼きには塩の方がしょうゆより適している。
            反対派:目玉焼きにはしょうゆの方が塩より適している。

            それでは、以下のテーマについて回答を作成してください。

            テーマ:${theme}
        `);
        const geminiOrganizeRes = geminiOrganize.response.text().replace(/[#*]/g, "");
        const parts = geminiOrganizeRes.split("反対派:");
        const formerParts = parts[0].split("賛成派:");
        const themeParts = formerParts[0].split("テーマ:");
        pros = formerParts[1];
        cons = parts[1];
        res.send(geminiOrganizeRes);
        return;
    } else if (req.body.order !== 1) {

        // 2回目以降はまずサマライズしてから
        const geminiSummarize = await chatSession.sendMessage(`
            以下の議論が行われています。
            テーマ:${theme}
            賛成派の意見:${pros}
            反対派の意見:${cons}

            賛成派の見解:${prosAssertion}

            反対派の見解:${consAssertion}

            上記の賛成派、および反対派の意見・見解を総括して、以下の形式に従って回答してください。

            賛成派の主張:
            箇条書きで賛成派の主張とその理由を、各項目を200字以内で記入してください。
            反対派の主張:
            箇条書きで反対派の主張とその理由を、各項目を200字以内で記入してください。
            `);
        insertSummary = `
            これまでの議論のまとめ
        ${geminiSummarize.response.text()}
        `;
        console.log(insertSummary);
    }

    // 既存の立場を基に賛成の意見を出力
    const geminiPros = await chatSession.sendMessage(`
        以下の議論が行われています。
        テーマ:${req.body.text}
        賛成派の意見:${pros}
        反対派の意見:${cons}
        ${insertSummary}

        上記のテーマについて、賛成派と反対派がそれぞれの主張とその理由を議論します。
        あなたは賛成派の立場に立って、新たな視点を用いて、論理的に主張してください。根拠となるデータや考察の補足をするようにしてください。300文字以内で、箇条書きや改行、マークダウンを絶対に使わないでください。
            
        回答の例
        例1:〇〇です。その理由は△△だからです。
        例2:□□です。その根拠となるデータが◇◇で示されているからです。
        `);
    prosAssertion = geminiPros.response.text();

    res.send(JSON.stringify({ summary: insertSummary, assertion: prosAssertion }));
});

/* Cohere用 HTTP POST */
app.post("/api/cohere", async (req, res) => {
    
    // cohereの Chat API の準備 Keyは.envから取得
    const CohereClient = require('cohere-ai').CohereClient;

    const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
    });

    try {
        // 既存の立場を基に反対の意見を出力
        const cohereCons = await cohere.chat({
            model: "command-r-plus",
            message: `
                以下の議論が行われています。
                テーマ:${theme}
                賛成派の意見:${pros}
                反対派の意見:${cons}
                ${insertSummary}

                賛成派としての見解:${prosAssertion}

                上記のテーマについて、賛成派と反対派がそれぞれの主張とその理由を議論します。
                あなたは反対派の立場に立って、新たな視点を用いて、論理的に主張してください。根拠となるデータや考察の補足をするようにしてください。300文字以内で、**箇条書きや改行、マークダウンを絶対に使わないでください**。
                反対派としての見解:「**ここの中身のみを書いてください**」`,
        });
        consAssertion = cohereCons.text;
        res.send(consAssertion);

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