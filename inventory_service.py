from datetime import datetime
from typing import List, Annotated, Dict, Any, Optional

from fastapi import FastAPI, Header, HTTPException, Depends, Body, Query
from pydantic import BaseModel, Field

# -----------------
# 1. Mock Database
# -----------------
# Mock database for product details lookup (now includes more products)
mock_product_db: Dict[str, Dict[str, Any]] = {
    "P-B002": {
        "product_id": "P-B002",
        "name": "Widget Type B - Premium",
        "category": "Electronics",
        "current_stock": 50.0,
        "average_cost": 35.00,
        "supplier": "GlobalTech Inc."
    },
    "P-A001": {
        "product_id": "P-A001",
        "name": "Standard Widget A",
        "category": "Hardware",
        "current_stock": 120.0,
        "average_cost": 12.50,
        "supplier": "Local Manufacturing Co."
    },
    "P-C003": {
        "product_id": "P-C003",
        "name": "IoT Sensor Pack",
        "category": "Electronics",
        "current_stock": 25.0,
        "average_cost": 99.99,
        "supplier": "Tech Innovators"
    },
    "P-H010": {
        "product_id": "P-H010",
        "name": "Heavy Duty Bracket",
        "category": "Hardware",
        "current_stock": 500.0,
        "average_cost": 5.50,
        "supplier": "MetalWorks Ltd."
    },
}


# -----------------
# 2. Pydantic Models
# -----------------
class ProductDetail(BaseModel):
    product_id: str
    name: str
    category: str
    current_stock: float
    average_cost: float
    supplier: str

class ListProductsResponse(BaseModel):
    total_results: int
    page_limit: int
    results: List[ProductDetail]

class Transaction(BaseModel):
    product_id: str = Field(..., alias="product_id", description="Unique identifier for the product.")
    location_id: str = Field(..., alias="location_id", description="Warehouse or physical location ID.")
    transaction_type: str = Field(..., alias="transaction_type", description="Type of transaction (e.g., RECEIPT, ISSUE, TRANSFER).")
    quantity_change: float = Field(..., alias="quantity_change", description="The change in quantity (positive for increase, negative for decrease).")
    cost_per_unit: float = Field(..., alias="cost_per_unit", description="Cost associated with the quantity change.")
    reference_document_id: str = Field(..., alias="reference_document_id", description="Reference document ID (e.g., PO, SO, WO).")

class TransactionResponse(BaseModel):
    transaction_id: str
    status: str
    timestamp: datetime
    message: str

# -----------------
# 3. Dependency Injection Functions
# -----------------

def parse_roles(x_roles: Annotated[str | None, Header()]) -> List[str]:
    """Parses the comma-separated X-Roles header into a list of roles."""
    if x_roles:
        return [role.strip().title() for role in x_roles.split(',')]
    return []

def get_user_id(x_user_id: Annotated[str | None, Header()]) -> str:
    """Extracts the X-User-ID header, defaulting to 'anonymous' if not provided."""
    return x_user_id or "anonymous"

def authorize_transaction_role(
    user_id: Annotated[str, Depends(get_user_id)],
    roles: Annotated[List[str], Depends(parse_roles)]
):
    """Dependency to check if the user has the 'InventoryManager' role."""
    required_role = "InventoryManager"
    
    if required_role not in roles:
        print(f"!!! ACCESS DENIED for user {user_id} (Roles: {', '.join(roles) if roles else 'None'})")
        raise HTTPException(
            status_code=403,
            detail=f"Authorization failed. User {user_id} does not have the required role: '{required_role}'.",
        )
    print(f"Access granted for user {user_id} (Roles: {', '.join(roles)}).")
    return True # Return True to indicate successful authorization

# -----------------
# 4. FastAPI App & Routes
# -----------------

app = FastAPI(
    title="Inventory API v2",
    description="Microservice for managing inventory transactions and product lookups.",
    version="2.0.0",
)

# Route 1: POST /api/v2/inventory/transaction (REQUIRES AUTHORIZATION)
@app.post(
    "/api/v2/inventory/transaction", 
    response_model=TransactionResponse, 
    status_code=201,
    dependencies=[Depends(authorize_transaction_role)] # Apply authorization check
)
async def create_inventory_transaction(
    transaction: Transaction,
    user_id: Annotated[str, Depends(get_user_id)],
    roles: Annotated[List[str], Depends(parse_roles)],
):
    """
    Creates a new inventory transaction and updates stock balances.
    Requires the 'InventoryManager' role.
    """
    import uuid
    transaction_id = str(uuid.uuid4())
    
    # Simulate DB transaction and logging
    print("--- [START DB TRANSACTION] ---")
    print(f"Transaction ID: {transaction_id}")
    print(f"User ID: {user_id} (Roles: {', '.join(roles)})")
    print(f"Product: {transaction.product_id}, Location: {transaction.location_id}")
    print(f"Type: {transaction.transaction_type}, Change: {transaction.quantity_change}")
    print(f"Ref Doc: {transaction.reference_document_id}")
    print("--- [END DB TRANSACTION] (Stock balance updated successfully) ---")

    return TransactionResponse(
        transaction_id=transaction_id,
        status="success",
        timestamp=datetime.now(),
        message=f"Inventory transaction '{transaction_id}' of type {transaction.transaction_type} processed successfully."
    )

# Route 2: GET /api/v2/inventory/products (QUERY PARAMETER TEST)
@app.get(
    "/api/v2/inventory/products", 
    response_model=ListProductsResponse
)
async def list_products(
    # Optional filtering by category
    category: Annotated[Optional[str], Query(description="Filter products by category (e.g., Electronics, Hardware).")] = None,
    # Optional limit for pagination/result count, with a default value and constraints
    limit: Annotated[int, Query(description="Maximum number of results to return.", ge=1, le=100)] = 25,
    # Optional sorting field
    sort_by: Annotated[Optional[str], Query(description="Field to sort results by (e.g., name, current_stock).")] = "product_id",
):
    """
    Retrieves a list of products, allowing for filtering, sorting, and limiting results 
    using query parameters.
    """
    
    # 1. Filtering
    product_list = [
        ProductDetail(**data) 
        for data in mock_product_db.values()
        if category is None or data["category"].lower() == category.lower()
    ]
    
    # 2. Sorting
    valid_sort_fields = ["product_id", "name", "current_stock", "average_cost"]
    
    if sort_by in valid_sort_fields:
        # Determine if sorting should be numerical (for stock/cost) or string (for ID/name)
        is_numeric = sort_by in ["current_stock", "average_cost"]
        
        product_list.sort(
            key=lambda p: getattr(p, sort_by), 
            reverse=True if is_numeric else False # Simple sort, numeric descending for stock/cost
        )
    
    # 3. Limiting (Pagination)
    final_results = product_list[:limit]
    
    print(f"Search executed: Category={category}, Limit={limit}, SortBy={sort_by}. Found {len(product_list)} results.")

    return ListProductsResponse(
        total_results=len(product_list),
        page_limit=limit,
        results=final_results
    )
