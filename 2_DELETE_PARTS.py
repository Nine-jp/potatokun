import os
import glob

def clean_files():
    print("=== 🗑️ 分割ファイルお掃除ツール ===")
    
    # 削除対象のパターン (potecoin_partX.txt)
    pattern = "potecoin_part*.txt"
    files_to_delete = glob.glob(pattern)

    if not files_to_delete:
        print("info: 削除対象のファイル (potecoin_part*.txt) は見つかりませんでした。")
        return

    print(f"🔍 {len(files_to_delete)} 個のファイルが見つかりました。削除します...")
    
    deleted_count = 0
    for file_path in files_to_delete:
        try:
            os.remove(file_path)
            print(f"  🗑️ 削除: {file_path}")
            deleted_count += 1
        except Exception as e:
            print(f"  ❌ 削除失敗: {file_path} ({e})")

    print("-" * 30)
    print(f"✨ 完了: {deleted_count} 個のファイルを削除しました。")

if __name__ == "__main__":
    clean_files()
    input("\nPRESS ENTER TO EXIT...")
