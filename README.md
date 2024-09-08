# GeminiVoicevox
ユーザーの質問をGeminiAPIにより回答し、VOICEVOXのAPIで読み上げるWebアプリです。

## Requirements
`npm`が効く環境で、以下のパッケージをインストールしてください。
```cmd
(nodejs-22.7.0)
express@4.19.2 
@google/generative-ai@0.17.1 
dotenv@16.4.5
```
別途、GeminiAPI Key と VOICEVOX WEB版 API Key が必要です。キーを取得後、ルートディレクトリに.envファイルを作成し格納してください。
```env
GEMINI_API_KEY="**********"
VOICEVOX_API_KEY="**********"
```

## Execution
npmのパスが通るコマンドラインで、プロジェクトのルートディレクトリに移動し、以下を実行してください。
```cmd
npm server.js
```
以下の表示が出たら、http://localhost:3000 を開きます。
```cmd
Server started on port:3000
```

## LICENCE
GeminiVoicevox is under [Apache-2.0 licence](/LICENSE)