from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.models.inventory import Item
from app.schemas.inventory import ItemCreate, ItemUpdate, ItemOut

router = APIRouter()

@router.get("/", response_model=List[ItemOut])
def list_items(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    items = db.query(Item).offset(skip).limit(limit).all()
    return items

@router.get("/{item_id}", response_model=ItemOut)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item not found")
    return item

@router.post("/", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
def create_item(payload: ItemCreate, db: Session = Depends(get_db)):
    # check SKU uniqueness
    existing = db.query(Item).filter(Item.sku == payload.sku).first()
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    item = Item(**payload.dict())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/{item_id}", response_model=ItemOut)
def update_item(item_id: int, payload: ItemUpdate, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for key, value in payload.dict(exclude_unset=True).items():
        setattr(item, key, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return None
