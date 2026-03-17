from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from app.db import get_db
from app.models import Supplier, Item, ItemSupplier
from datetime import datetime

router = APIRouter(prefix="/catalog/suppliers", tags=["suppliers"])

class SupplierCreate(BaseModel):
    name: str
    description: str = ""

class SupplierUpdate(BaseModel):
    name: str
    description: str = ""

class ItemLink(BaseModel):
    item_id: int
    commission: float = 0.0

@router.get("/", response_model=List[Supplier])
def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).all()

@router.post("/", response_model=Supplier)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    supplier = Supplier(
        name=payload.name,
        description=payload.description,
        created_at=datetime.utcnow()
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.get("/{supplier_id}", response_model=Supplier)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    return supplier

@router.put("/{supplier_id}", response_model=Supplier)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")
    supplier.name = payload.name
    supplier.description = payload.description
    supplier.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(supplier)
    return supplier

@router.get("/{supplier_id}/items", response_model=List[ItemSupplier])
def list_supplier_items(supplier_id: int, db: Session = Depends(get_db)):
    return db.query(ItemSupplier).filter(ItemSupplier.supplier_id == supplier_id).all()

@router.post("/{supplier_id}/add-item", response_model=ItemSupplier)
def add_item_to_supplier(supplier_id: int, payload: ItemLink, db: Session = Depends(get_db)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Fournisseur non trouvé")

    item = db.query(Item).filter(Item.id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    item_supplier = ItemSupplier(
        supplier_id=supplier_id,
        item_id=payload.item_id,
        commission=payload.commission,
        created_at=datetime.utcnow()
    )
    db.add(item_supplier)
    db.commit()
    db.refresh(item_supplier)
    return item_supplier

@router.delete("/{supplier_id}/remove-item/{item_id}")
def remove_item_from_supplier(supplier_id: int, item_id: int, db: Session = Depends(get_db)):
    item_supplier = db.query(ItemSupplier).filter(
        ItemSupplier.supplier_id == supplier_id,
        ItemSupplier.item_id == item_id
    ).first()

    if not item_supplier:
        raise HTTPException(status_code=404, detail="Liaison fournisseur-produit non trouvée")

    db.delete(item_supplier)
    db.commit()

    return {"detail": "Produit retiré du fournisseur avec succès"}