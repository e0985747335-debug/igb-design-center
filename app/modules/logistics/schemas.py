from pydantic import BaseModel, Field

# 這個 Pydantic 模型用於定義從前端接收的 RMA 驗證資料結構。
# 根據您的應用邏輯，您可能需要在此處添加更多欄位。
class PartnerRMAVerification(BaseModel):
    # 範例欄位：合作夥伴提供的 RMA 編號
    rma_number: str = Field(
        ..., 
        example="RMA-20240901-001", 
        description="RMA (Return Merchandise Authorization) number provided by the partner."
    )
    
    # 範例欄位：用於驗證的額外資訊，例如產品序號或訂單 ID
    verification_data: str = Field(
        ..., 
        example="SN1234567890", 
        description="Supplementary data for verification, like serial number or order ID."
    )

    # Pydantic 配置類別
    class Config:
        # 允許在接收資料時忽略未定義的欄位
        extra = "ignore"

# 您可以在此處定義其他與 logistics 相關的 Pydantic 模型
