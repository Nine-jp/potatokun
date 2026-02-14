import os
import math

# --- 設定 ---
TARGET_FILE = 'potecoin.js'
LINES_PER_FILE = 2000

def split_file():
    print(f"=== 📂 {TARGET_FILE} 分割ツール ===")
    
    if not os.path.exists(TARGET_FILE):
        print(f"❌ エラー: {TARGET_FILE} が見つかりません。")
        print(f"このスクリプトを {TARGET_FILE} と同じフォルダに置いてください。")
        return

    try:
        with open(TARGET_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        
        total_lines = len(lines)
        total_parts = math.ceil(total_lines / LINES_PER_FILE)
        
        print(f"📄 対象ファイル: {total_lines}行")
        print(f"✂️  {LINES_PER_FILE}行ごとに {total_parts}個 のファイルに分割します...")
        print("-" * 30)

        for i in range(total_parts):
            start_index = i * LINES_PER_FILE
            end_index = start_index + LINES_PER_FILE
            chunk = lines[start_index:end_index]
            
            part_num = i + 1
            output_filename = f"potecoin_part{part_num}.txt"
            
            with open(output_filename, 'w', encoding='utf-8') as out:
                out.writelines(chunk)
            
            print(f"  ✅ 作成: {output_filename} ({len(chunk)}行)")

        print("-" * 30)
        print("✨ 分割完了！ 生成されたファイルを全てAIにアップロードしてください。")

    except Exception as e:
        print(f"❌ 予期せぬエラーが発生しました: {e}")

if __name__ == "__main__":
    split_file()
    input("\nPRESS ENTER TO EXIT...")
