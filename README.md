# GeminiVoicevox
ユーザーの質問をGeminiAPIにより回答し、VOICEVOXのAPIで読み上げるWebアプリです。

## Requirements
webアプリのみを動かす場合
```cmd
nodejs-22.7.0

// Web communication
express@4.19.2 

// GeminiAPI
@google/generative-ai@0.17.1 

// .env file
dotenv@16.4.5
```
nodejsを入れた後、`npm install` で残りの3つをインストールしてください。
別途、GeminiAPI Key と VOICEVOX WEB版 API Key が必要です。

## Execution
npmのパスが通るコマンドラインで、プロジェクトのルートディレクトリに移動し、以下を実行してください。
```cmd
npm server.js
```
以下の表示が出たら、http://localhost:3000 を開きます。
```cmd
Server started on port:3000
```