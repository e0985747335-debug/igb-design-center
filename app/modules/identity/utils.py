from passlib.context import CryptContext

# 設置密碼上下文，用於 bcrypt 雜湊演算法
# bcrypt 是目前推薦使用的安全雜湊算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """ 
    對純文字密碼進行雜湊處理。
    參數:
        password: 待雜湊的純文字密碼。
    回傳:
        雜湊後的字串。
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """ 
    驗證純文字密碼是否與雜湊密碼匹配。
    參數:
        plain_password: 使用者輸入的純文字密碼。
        hashed_password: 資料庫中儲存的雜湊密碼。
    回傳:
        如果匹配則為 True，否則為 False。
    """
    return pwd_context.verify(plain_password, hashed_password)
