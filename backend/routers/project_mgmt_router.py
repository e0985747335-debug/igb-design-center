from fastapi import APIRouter, Depends
from ..auth_utils import verify_token

router = APIRouter()

@router.get("/list")
async def list_projects(username: str = Depends(verify_token)):
    return {
        "message": f"🧩 專案清單取得成功 for {username}",
        "projects": ["IGB ERP 2.0", "Smart Heavy Cleaner", "SiteLink"]
    }

@router.get("/status")
async def project_status(username: str = Depends(verify_token)):
    return {"status": "running", "checked_by": username}
