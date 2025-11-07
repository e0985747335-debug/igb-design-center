from app.db.session import SessionLocal, init_db
from app.models.inventory import Item

def seed():
    db = SessionLocal()
    try:
        # only seed if no items exist
        if db.query(Item).count() == 0:
            items = [
                Item(sku="APL-001", name="新鮮蘋果", price=50.0, cost=30.0, stock=15, unit="顆"),
                Item(sku="SPN-001", name="有機菠菜", price=40.0, cost=25.0, stock=20, unit="把"),
                Item(sku="BNA-001", name="當季香蕉", price=35.0, cost=20.0, stock=10, unit="串"),
            ]
            db.add_all(items)
            db.commit()
            print("Seeded initial items.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
    seed()
