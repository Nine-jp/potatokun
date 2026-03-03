---
description: ブラウザの操作およびスクリーンショットの取得方法（標準のブラウザエージェントではなく必ずこれを使用する）
---
# ブラウザ操作およびスクリーンショットのメインシステム

今後、ブラウザ（Chrome）の操作、DOMの取得、スクリーンショットの撮影などを行う場合は、**絶対に組み込みの `browser_subagent` ツールを使用せず**、このワークフローに定義されたPythonスクリプト `ag_browser.py` を使用してください。

## 理由
日本語のファイルパスや環境固有の問題を回避し、拡張機能などを安全に読み込んだ状態で安定したブラウザ操作を実現するためです。

## スクリプトの場所
`c:\GeminiProjects\TestProject\ag_browser.py`

## 使用可能なコマンド
コマンドは `python ag_browser.py <command> [arguments]` の形式で実行します。

### 1. ブラウザの起動 (初回のみ、もしくは手動で起動する場合)
```bash
python c:\GeminiProjects\TestProject\ag_browser.py launch
```
※事前に `http://localhost:8081` などの開発サーバーが立ち上がっていることを前提とします。

### 2. スクリーンショットの撮影
UIの確認が必要な場合はこれを使用します。
```bash
python c:\GeminiProjects\TestProject\ag_browser.py screenshot "出力先の絶対パス（例: c:\GeminiProjects\TestProject\screenshot.png）"
```

### 3. DOM（HTML）の取得
現在のページの状態や要素を確認する場合に使用します。
```bash
python c:\GeminiProjects\TestProject\ag_browser.py dom "出力先の絶対パス（例: c:\GeminiProjects\TestProject\dom.html）"
```

### 4. 要素のクリック
```bash
python c:\GeminiProjects\TestProject\ag_browser.py click "<CSSセレクタ>"
```

### 5. テキストの入力
```bash
python c:\GeminiProjects\TestProject\ag_browser.py type "<CSSセレクタ>" "入力するテキスト"
```

### 6. JavaScriptの実行
ページ内でJSの評価が必要な場合に使用します。
```bash
python c:\GeminiProjects\TestProject\ag_browser.py eval "document.title"
```

### 7. URLの移動
```bash
python c:\GeminiProjects\TestProject\ag_browser.py goto "http://localhost:8081"
```

## 注意事項
- 必ず `run_command` ツールを使って上記コマンドを実行すること。
- 検証作業（スクリーンショット撮影、DOM取得など）は、ユーザーへの事前確認なし（SafeToAutoRun=true）で実行し、結果のみを報告すること。
