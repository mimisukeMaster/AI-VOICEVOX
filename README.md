# GeminiVoicevox
ユーザーの質問をGeminiAPIにより回答し、VOICEVOXのAPIで読み上げるWebアプリです。追加の機能を実装中です。

## Requirements
`npm`が効く環境で、以下のコマンドを実行して[package.json](/package.json)に記載されたパッケージをインストールしてください。
```cmd
npm install
(自機はnodejs-22.7.0で実行)
```
以下のパッケージがインストールされます。
```cmd
"@google/generative-ai": "^0.17.1",
"cohere-ai": "^7.13.0",
"dotenv": "^16.4.5",
"express": "^4.19.2
```

## Directory
```
GeminiVoicevox
| .env (作成してください)
| server.js
∟ public
  |
  |-discussion
  | | client.js
  | | index.html
  | ∟ styles.css
  |
  | client.js
  | index.html
  ∟ styles.css

```
**server.js**: バックエンド処理

**client.js**: フロントエンド処理

**public**: http://localhost:3000 接続時のルートにあたる箇所

**discussion**: http://localhost:3000/discussion にあたる箇所


## Initial Setup
GeminiAPI Key, cohere API Key, VOICEVOX Web版 API Key が必要です。キーを取得後、ルートディレクトリに.envファイルを作成し格納してください。
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
### AI豆打者
http://localhost:3000/<br>
メインページです。GeminiAPIを呼んで質問文を投げた後、レスポンスをVOICEVOXで読み上げています。

「ローカルAPIを使う」にチェックを入れた場合、ローカルのVOICEVOX Engineを利用します。別途、VOICEVOXソフトを起動しておいてください。

### AI会議
 http://localhost:3000/discussion<br>
 作成中です。GeminiAPIを呼んで議題をプロンプトとして送り、レスポンスをVOICEVOXで読み上げさせます。その後、レスポンスを再びプロンプトとして送り、これを永久的に繰り返します。

終了方法がまだ整備されていないので、べージをリロードして対処してください。

こちらも、「ローカルAPIを使う」にチェックを入れた場合VOICEVOXソフトを起動してから「会議開始！」ボタンを押してください。


## Reference
VOICEVOX API Key 取得先と解説記事
- https://voicevox.su-shiki.com/su-shikiapis/

- https://zenn.dev/mongonta/articles/8aac1041c628d4

GeminiAPI Key 取得先
- https://aistudio.google.com/app/apikey

## Author
 みみすけ名人 mimisukeMaster<br>

 [<img src="https://img.shields.io/badge/-X-X.svg?style=flat-square&logo=X&logoColor=white&color=black">](https://x.com/mimisukeMaster)
[<img src="https://img.shields.io/badge/-ArtStation-artstation.svg?&style=flat-square&logo=artstation&logoColor=blue&color=gray">](https://www.artstation.com/mimisukemaster)
[<img src="https://img.shields.io/badge/-Youtube-youtube.svg?&style=flat-square&logo=youtube&logoColor=white&color=red">](https://www.youtube.com/channel/UCWnmp8t4GJzcjBxhtgo9rKQ)

## LICENCE
GeminiVoicevox is under [Apache-2.0 licence](/LICENSE).