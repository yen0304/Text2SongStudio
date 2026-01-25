---
title: Service Owns Transaction Boundaries
impact: HIGH
impactDescription: Ensures data consistency, prevents partial updates
tags: service, transaction, database, consistency
---

## Service Owns Transaction Boundaries

Transaction begin and end should be controlled by the Service layer, not Router or Repository.

**❌ Incorrect (Router manages transaction):**

```python
# routers/orders.py - Wrong!
@router.post("/orders", status_code=201)
async def create_order(
    data: OrderCreate,
    db: AsyncSession = Depends(get_db),
):
    try:
        # ❌ Router should not manage transactions
        order = Order(**data.model_dump())
        db.add(order)
        
        # Decrease stock
        for item in data.items:
            product = await db.get(Product, item.product_id)
            product.stock -= item.quantity
        
        await db.commit()
        return order
    except Exception:
        await db.rollback()
        raise
```

**❌ Incorrect (Each Repository method commits):**

```python
# repositories/order_repository.py - Wrong!
class OrderRepository:
    async def save(self, order: Order):
        self._session.add(order)
        await self._session.commit()  # ❌ Repository should not commit
```

**✅ Correct (Service manages transaction):**

```python
# services/order_service.py - Correct!
class OrderService:
    def __init__(
        self,
        order_repo: OrderRepository,
        product_repo: ProductRepository,
        unit_of_work: UnitOfWork,
    ):
        self._orders = order_repo
        self._products = product_repo
        self._uow = unit_of_work
    
    async def create_order(self, user_id: UUID, items: list[OrderItem]) -> Order:
        async with self._uow:  # ✅ Service controls transaction boundary
            # Check stock
            for item in items:
                product = await self._products.get_by_id(item.product_id)
                if product.stock < item.quantity:
                    raise InsufficientStockError(product.id)
            
            # Create order
            order = Order(user_id=user_id, items=items)
            await self._orders.save(order)
            
            # Decrease stock
            for item in items:
                await self._products.decrease_stock(item.product_id, item.quantity)
            
            await self._uow.commit()  # ✅ Single commit point
            return order
        # Auto rollback on exception
```

**✅ Unit of Work Implementation:**

```python
# infrastructure/unit_of_work.py
from sqlalchemy.ext.asyncio import AsyncSession

class UnitOfWork:
    def __init__(self, session_factory):
        self._session_factory = session_factory
        self._session: AsyncSession | None = None
    
    async def __aenter__(self):
        self._session = self._session_factory()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type:
            await self.rollback()
        await self._session.close()
    
    async def commit(self):
        await self._session.commit()
    
    async def rollback(self):
        await self._session.rollback()
    
    @property
    def session(self) -> AsyncSession:
        return self._session
```

**✅ Simplified: Use session directly in Service:**

```python
# services/order_service.py - Simplified version
class OrderService:
    def __init__(self, session: AsyncSession):
        self._session = session
    
    async def create_order(self, user_id: UUID, items: list[OrderItem]) -> Order:
        try:
            # Business logic...
            order = Order(user_id=user_id, items=items)
            self._session.add(order)
            
            await self._session.commit()  # ✅ Service handles commit
            await self._session.refresh(order)
            return order
        except Exception:
            await self._session.rollback()  # ✅ Service handles rollback
            raise
```

**Key Points:**

1. **Router** doesn't manage transactions - only adapts
2. **Repository** doesn't commit - only CRUD operations
3. **Service** manages transactions - decides when to commit/rollback
