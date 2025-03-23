# AI-VOICEVOX
[<img src="https://img.shields.io/github/stars/mimisukeMaster/AI-VOICEVOX?&logo=github">](https://github.com/mimisukeMaster/AI-VOICEVOX/stargazers)
[<img src="https://img.shields.io/badge/issues-welcome-green">](https://github.com/mimisukeMaster/AI-VOICEVOX/issues)
[<img src="https://img.shields.io/badge/PRs-welcome-orange?logo=git">](https://github.com/mimisukeMaster/OsakanaFlock/pulls)
[<img  src="https://img.shields.io/hexpm/l/plug?color=red&logo=apache">](https://www.apache.org/licenses/)<br>
[<img src="https://img.shields.io/badge/deployed%20to-Vercel-brightgreen?logo=vercel">](https://github.com/mimisukeMaster/AI-VOICEVOX/deployments)
<img src="https://img.shields.io/github/repo-size/mimisukeMaster/AI-VOICEVOX?logo=gitlfs&color=ff69b4">
[<img src="https://img.shields.io/static/v1?label=&message=Open%20in%20Visual%20Studio%20Code&color=007acc&style=flat">](https://github.dev/mimisukeMaster/AI-VOICEVOX)


GeminiやCommandRなどのLLMを使用し、LLM同士で討論させることができたり、質問に答えたりできるWebアプリです。全ての返答はVOICEVOXによりリアルタイムで音声合成され、読み上げられます。

## Requirements
`npm`が効く環境で、以下のコマンドを実行して[package.json](/package.json)に記載されたパッケージをインストールしてください。
```cmd
npm install
(自機は nodejs v22.7.0, npm v10.8.2 で実行)
```
以下のパッケージがインストールされます。
```cmd
"@google/generative-ai": "^0.17.1",
"cohere-ai": "^7.13.0",
"dotenv": "^16.4.5",
"express": "^4.19.2",
"vercel": "^37.4.2"
```

## Directory
主要部のみ
```
AI-VOICEVOX
│  .env (作成してください)
│  vercel.json
│  server.js
└─ public
   │
   ├─ about
   │  └─ index.html
   │
   ├─ question
   │  │  index.html
   │  └─ client.js
   │ 
   │  index.html
   │  client.js
   │  styles.css
   └─ TtsQuestV3Voicevox.js
```
**server.js**: バックエンド処理

**client.js**: フロントエンド処理

**TtsQuestV3Voicevox.js**: ストリーミング版の音声合成処理

**public**: http://localhost:3000 接続時のルートにあたる箇所

**question**: http://localhost:3000/question にあたる箇所

**about**: http://localhost:3000/about にあたる箇所


## Initial Setup
GeminiAPI Key, Cohere API Key, VOICEVOX Web版 API Key が必要です。キーを取得後、ルートディレクトリに.envファイルを作成し格納してください。
```env
GEMINI_API_KEY="**********"
COHERE_API_KEY="**********"
VOICEVOX_API_KEY="**********"
```

## Execution
npmのパスが通るコマンドラインで、プロジェクトのルートディレクトリに移動し、以下を実行してください。
```cmd
npm start
```
以下の表示が出たら、http://localhost:3000 を開きます。
```cmd
Server started on port:3000
```
### AI討論
http://localhost:3000<br>
Gemini、CommandR の各APIを用いて話し合いをさせます。バックエンドで議題から立場を明確に定義し、各々の主張を出力させています。それをフロントエンドに返し、VOICEVOXで読み上げています。賛成派がGemini、反対派がCommandRの回答となっています。

「対戦相手を選択する」で反対派の声を変えると、より対話らしくなります。終了ボタンで現在話されているターンで終了します。（計10回の発言で強制的に終了します）

「ローカルAPIを使う」にチェックを入れた場合、ローカルのVOICEVOX Engineを利用し[ローカル版](http://localhost:50021/docs)で処理されます。別途、VOICEVOXソフトを起動しておいてください。

### AI豆打者
http://localhost:3000/question<br>
対話形式で質問ができます。質問文をバックエンドに送り、GeminiAPIを呼んだ後、レスポンスをVOICEVOXで読み上げています。ローカルでの音声合成は基本的に[高速版](https://voicevox.su-shiki.com/su-shikiapis/)で処理されます。<br>

こちらも、「ローカルAPIを使う」にチェックを入れた場合VOICEVOXソフトを起動してから「質問する！」ボタンを押してください。

## Demo
Vercel上でデプロイしており、そちらから仕様を確認できます。

https://ai-voicevox.vercel.app/

- コミット時にこのドメインに再デプロイされますが、更新が遅れる場合があります。
- Vercel上で動かしているため、「ローカルのVOICEVOXを使う」は使用できません。
- 音声合成は全て[ストリーミング版](https://github.com/ts-klassen/ttsQuestV3Voicevox)で処理されます。これは、合成に時間がかかる際のタイムアウトを防ぐためです。
- 短時間に連続して合成処理を行うと、ストリーミング版の制限として`429 Too many requests`が返される場合があります。その際は数秒程度おいて再度試してください。
- ローカルでの実行時と比べ一部異なる場合、コミットのDescriptionにその旨を記します。

## Reference
VOICEVOX API Key 取得先と解説記事
- https://voicevox.su-shiki.com/su-shikiapis/

- https://zenn.dev/mongonta/articles/8aac1041c628d4

GeminiAPI Key 取得先
- https://aistudio.google.com/app/apikey

Cohere API Key 取得先
- https://dashboard.cohere.com/api-keys

## Author
 みみすけ名人 mimisukeMaster<br>

 [<img src="https://img.shields.io/badge/-X-X.svg?style=flat-square&logo=X&logoColor=white&color=black">](https://x.com/mimisukeMaster)
[<img src="https://img.shields.io/badge/-ArtStation-artstation.svg?&style=flat-square&logo=artstation&logoColor=blue&color=gray">](https://www.artstation.com/mimisukemaster)
[<img src="https://img.shields.io/badge/-Youtube-youtube.svg?&style=flat-square&logo=youtube&logoColor=white&color=red">](https://www.youtube.com/channel/UCWnmp8t4GJzcjBxhtgo9rKQ)

## LICENSE
AI-VOICEVOX is under [Apache-2.0 licence](/LICENSE).
