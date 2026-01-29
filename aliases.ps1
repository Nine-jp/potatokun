function minigame分割 {
    Write-Host "🚀 'minigame分割' を実行します..." -ForegroundColor Cyan
    python 1_EXECUTE_SPLIT.py
}

function 分割削除 {
    Write-Host "🗑️ '分割削除' を実行します..." -ForegroundColor Yellow
    python 2_DELETE_PARTS.py
}

Write-Host "✨ 呪文の登録が完了しました！" -ForegroundColor Green
Write-Host "以下のコマンド入力だけで実行できます："
Write-Host "  👉 minigame分割" -ForegroundColor Cyan
Write-Host "  👉 分割削除" -ForegroundColor Yellow
