import random
from typing import List, Dict, Union

# ----------------------------------------------------------------
# IGB 量子數據分析器模擬 (IGB Quantum Data Analyzer Simulation)
# ----------------------------------------------------------------

def calculate_weighted_performance(data_set: List[Dict[str, Union[str, float]]]) -> List[Dict[str, Union[str, float]]]:
    """
    模擬量子處理器對多維數據集進行加權績效計算。
    
    每個單元 (Unit) 的最終得分是基於其在 '可用性'、'延遲穩定性'
    和 '資源消耗效率' 三個維度上的加權平均。
    
    加權:
    - 可用性 (Availability): 50%
    - 延遲穩定性 (Latency_Stability): 30%
    - 資源消耗效率 (Resource_Efficiency): 20%
    
    Args:
        data_set: 包含各運行單元 (Microservice) 原始績效數據的列表。
        
    Returns:
        更新了 'weighted_score' 和 'is_anomaly' 標記的數據集。
    """
    
    # 權重定義
    WEIGHTS = {
        'availability': 0.50,
        'latency_stability': 0.30,
        'resource_efficiency': 0.20
    }
    
    processed_data = []
    total_score = 0
    
    # 步驟 1: 計算每個單元的加權得分
    for item in data_set:
        # 將百分比或比率轉換為小數進行計算
        avail = item['availability'] / 100.0
        stab = item['latency_stability']
        eff = item['resource_efficiency']
        
        # 加權平均計算
        score = (avail * WEIGHTS['availability'] +
                 stab * WEIGHTS['latency_stability'] +
                 eff * WEIGHTS['resource_efficiency']) * 100
                 
        item['weighted_score'] = round(score, 2)
        total_score += score
        processed_data.append(item)

    # 步驟 2: 識別異常單元 (Anomaly Detection)
    # 異常閾值: 低於所有單元平均得分的 20%
    if not processed_data:
        return []

    average_score = total_score / len(processed_data)
    ANOMALY_THRESHOLD = average_score * 0.80 

    for item in processed_data:
        # 如果得分顯著低於平均，則標記為異常
        item['is_anomaly'] = item['weighted_score'] < ANOMALY_THRESHOLD
        
    return processed_data, round(average_score, 2)


# ----------------------------------------------------------------
# 模擬數據 (Sample Data)
# ----------------------------------------------------------------

# 假設這是從實時監控系統獲取的 5 個微服務單元的數據
MICROSERVICE_DATA = [
    {'unit_id': 'WL-001-Ledger', 'availability': 99.99, 'latency_stability': 0.95, 'resource_efficiency': 0.88},
    {'unit_id': 'MDM-002-Config', 'availability': 98.50, 'latency_stability': 0.70, 'resource_efficiency': 0.75}, # 延遲穩定性較差
    {'unit_id': 'PSQL-003-Master', 'availability': 100.00, 'latency_stability': 0.99, 'resource_efficiency': 0.92},
    {'unit_id': 'SYNC-004-Inventory', 'availability': 95.00, 'latency_stability': 0.85, 'resource_efficiency': 0.50}, # 可用性與效率較低 (潛在異常)
    {'unit_id': 'API-005-Gateway', 'availability': 99.80, 'latency_stability': 0.92, 'resource_efficiency': 0.90},
]

# ----------------------------------------------------------------
# 執行模擬與結果輸出
# ----------------------------------------------------------------
if __name__ == "__main__":
    print("--- IGB 量子數據處理器 (QDP) 績效分析報告 ---")
    print(f"分析單元總數: {len(MICROSERVICE_DATA)} 個")
    
    # 執行加權計算與異常檢測
    results, avg_score = calculate_weighted_performance(MICROSERVICE_DATA)
    
    print(f"\n整體運行平均績效分數: {avg_score}")
    print("--------------------------------------------------")

    # 輸出結果
    for result in results:
        anomaly_status = "異常 (Anomaly)" if result['is_anomaly'] else "正常 (Optimal)"
        status_color = "\033[91m" if result['is_anomaly'] else "\033[92m" # ANSI 顏色 (紅/綠)
        reset_color = "\033[0m"
        
        print(f"[{result['unit_id']}]")
        print(f"  績效得分: {result['weighted_score']:.2f}")
        print(f"  狀態標記: {status_color}{anomaly_status}{reset_color}")
        print("-" * 30)

    # 總結分析
    anomaly_count = sum(1 for r in results if r['is_anomaly'])
    if anomaly_count > 0:
        print(f"\n!!! 警報 !!! 發現 {anomaly_count} 個運行單元績效分數低於預期。請檢查它們的延遲穩定性和資源效率。")
    else:
        print("\n所有運行單元績效均在標準之上。系統運行狀態最佳。")
