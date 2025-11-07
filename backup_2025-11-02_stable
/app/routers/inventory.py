from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import inventory as inventory_model
from app.schemas import inventory as inventory_schema

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"]
)

@router.get("/", response_model=list[inventory_schema.Inventory])
def read_inventories(db: Session = Depends(get_db)):
    """取得所有庫存項目"""
    return db.query(inventory_model.Inventory).all()

@router.post("/", response_model=inventory_schema.Inventory)
def create_inventory(item: inventory_schema.InventoryCreate, db: Session = Depends(get_db)):
    """建立新的庫存項目"""
    db_item = inventory_model.Inventory(**item.dict())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/{item_id}", response_model=inventory_schema.Inventory)
def read_inventory(item_id: int, db: Session = Depends(get_db)):
    """根據 ID 取得單一庫存項目"""
    db_item = db.query(inventory_model.Inventory).filter(inventory_model.Inventory.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return db_item

@router.put("/{item_id}", response_model=inventory_schema.Inventory)
def update_inventory(item_id: int, item: inventory_schema.InventoryUpdate, db: Session = Depends(get_db)):
    """更新庫存項目"""
    db_item = db.query(inventory_model.Inventory).filter(inventory_model.Inventory.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    for key, value in item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{item_id}")
def delete_inventory(item_id: int, db: Session = Depends(get_db)):
    """刪除庫存項目"""
    db_item = db.query(inventory_model.Inventory).filter(inventory_model.Inventory.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    db.delete(db_item)
    db.commit()
    return {"ok": True}
