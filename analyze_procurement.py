import csv
from io import StringIO
from collections import defaultdict

# 內嵌的 CSV 資料字串，包含所有採購項目
CSV_DATA = """
費用類別,項目 (模塊名稱),規格/描述,數量,單價 (TWD),合計金額 (TWD),備註
模組採購,高速無線通訊模塊 A,"5G Sub-6GHz, 型號：XYZ-5G-M1",1,25000,25000,"優先級：高，供應商：XYZ Tech"
模組採購,邊緣計算處理器 B,"4-Core ARM Cortex-A53, 2GB RAM",5,1800,9000,應用於物聯網數據前處理
模組採購,遠程傳感器陣列 C,"LoRaWAN, IP67 防護等級, 具備 GPS 定位功能",2,8500,17000,部署於戶外環境
模組採購,DDR5 32GB 高速記憶體模組,適用於伺服器,50,2500,125000,"供應商 A (急迫性：急迫)"
模組採購,15.6 吋 OLED 顯示模組,"解析度 4K, 支援觸控",30,4000,120000,"供應商 B (急迫性：一般)"
模組採購,ARM Cortex-A78 處理器晶片,低功耗版本,100,1500,150000,"供應商 C (急迫性：緊急)"
"""

def analyze_procurement_list(csv_data: str):
    """
    分析採購清單的 CSV 資料，計算總成本並按類別彙總。

    Args:
        csv_data: 包含採購明細的 CSV 格式字串。
    """
    # 使用 StringIO 將字串當作檔案物件處理
    data_file = StringIO(csv_data.strip())
    
    # 使用 DictReader 讀取 CSV，讓每一列變成一個字典
    reader = csv.DictReader(data_file)
    
    # 儲存總成本
    grand_total = 0
    # 使用 defaultdict 儲存每個類別的總計
    category_totals = defaultdict(int)

    # 處理每一行資料
    for row in reader:
        try:
            # 確保 '合計金額 (TWD)' 欄位是數字並累加
            cost_category = row['費用類別']
            total_amount = int(row['合計金額 (TWD)'])
            
            grand_total += total_amount
            category_totals[cost_category] += total_amount

        except ValueError as e:
            # 處理無法轉換為數字的錯誤（例如標頭行跳過後仍有非數字內容）
            print(f"警告：跳過無效的金額資料 '{row.get('合計金額 (TWD)', 'N/A')}'，項目：{row.get('項目 (模塊名稱)', 'N/A')}. 錯誤: {e}")
        except KeyError as e:
            # 處理欄位名稱不正確的錯誤
            print(f"錯誤：CSV 檔案缺少關鍵欄位 {e}")
            return

    # --- 輸出報告 ---
    print("=" * 40)
    print("新模塊項目採購清單 - 財務摘要報告 (TWD)")
    print("=" * 40)
    
    # 輸出各類別彙總
    print("\n--- 費用類別彙總 ---")
    for category, total in category_totals.items():
        # 使用 f-string 格式化輸出金額，加上千位分隔符
        print(f"| {category:<10} | 總計：{total:10,d} TWD |")

    print("-" * 40)
    
    # 輸出最終總計
    print(f"\n*** 清單最終總計金額 ***")
    print(f"總採購成本：{grand_total:,.0f} TWD")
    print("=" * 40)

if __name__ == "__main__":
    analyze_procurement_list(CSV_DATA)
