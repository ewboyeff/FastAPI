from sqlalchemy.orm import Session
from models import Product, Cart, Order
from schemas import CartItem, ProductCreate

def get_products(db: Session, min_price: float = None, max_price: float = None):
    query = db.query(Product)
    if min_price:
        query = query.filter(Product.price >= min_price)
    if max_price:
        query = query.filter(Product.price <= max_price)
    return query.all()

def create_product(db: Session, product: ProductCreate):
    db_product = Product(name=product.name, price=product.price, stock=product.stock)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def update_product(db: Session, product_id: int, product: ProductCreate):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    db_product.name = product.name
    db_product.price = product.price
    db_product.stock = product.stock
    db.commit()
    db.refresh(db_product)
    return db_product

def delete_product(db: Session, product_id: int):
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        return None
    db.delete(db_product)
    db.commit()
    return db_product

def add_to_cart(db: Session, user_id: int, cart_item: CartItem):
    cart = Cart(user_id=user_id, product_id=cart_item.product_id, quantity=cart_item.quantity)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart

def create_order(db: Session, user_id: int, total_price: float):
    order = Order(user_id=user_id, total_price=total_price)
    db.add(order)
    db.commit()
    db.refresh(order)
    return order