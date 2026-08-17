from enum import Enum
from typing import Optional
from pydantic import BaseModel


class BusinessType(str, Enum):
    RETAIL = "RETAIL"
    FOOD_BEVERAGE = "FOOD_BEVERAGE"
    SERVICE = "SERVICE"
    ONLINE_SELLER = "ONLINE_SELLER"
    RESELLER = "RESELLER"
    WHOLESALE = "WHOLESALE"
    HOME_INDUSTRY = "HOME_INDUSTRY"
    OTHER = "OTHER"


class AccountType(str, Enum):
    CASH = "CASH"
    BANK = "BANK"
    EWALLET = "EWALLET"


class TransactionType(str, Enum):
    SALE = "SALE"
    PURCHASE = "PURCHASE"
    EXPENSE = "EXPENSE"
    RECEIVABLE_PAYMENT = "RECEIVABLE_PAYMENT"
    PAYABLE_PAYMENT = "PAYABLE_PAYMENT"
    OWNER_INJECTION = "OWNER_INJECTION"
    OWNER_WITHDRAWAL = "OWNER_WITHDRAWAL"
    TRANSFER = "TRANSFER"
    ADJUSTMENT = "ADJUSTMENT"


class TransactionStatus(str, Enum):
    PAID = "PAID"
    UNPAID = "UNPAID"
    PARTIAL = "PARTIAL"
    CANCELLED = "CANCELLED"


class ReceivablePayableStatus(str, Enum):
    UNPAID = "unpaid"
    PARTIAL = "partial"
    OVERDUE = "overdue"
    PAID = "paid"


class BusinessCreate(BaseModel):
    business_name: str
    business_type: BusinessType
    business_category: Optional[str] = None
    city: Optional[str] = None
    currency: str = "IDR"
    starting_cash: float = 0.0
    load_demo_data: bool = False


class BusinessUpdate(BaseModel):
    business_name: Optional[str] = None
    business_type: Optional[BusinessType] = None
    business_category: Optional[str] = None
    city: Optional[str] = None
    currency: Optional[str] = None
    mode: Optional[str] = None  # "simple" | "advanced"


class AccountCreate(BaseModel):
    name: str
    type: AccountType
    opening_balance: float = 0.0


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None


class TransactionCreate(BaseModel):
    type: TransactionType
    amount: float
    account_id: Optional[str] = None
    to_account_id: Optional[str] = None
    category_id: Optional[str] = None
    category_name: Optional[str] = None
    counterparty: Optional[str] = None
    reference: Optional[str] = None
    date: str
    description: Optional[str] = None
    status: TransactionStatus = TransactionStatus.PAID
    attachment_url: Optional[str] = None
    product_id: Optional[str] = None
    quantity: Optional[float] = None
    unit_price: Optional[float] = None
    estimated_cogs_percent: Optional[float] = None
    paid_amount: Optional[float] = None
    due_date: Optional[str] = None
    receivable_id: Optional[str] = None
    payable_id: Optional[str] = None
    is_inventory_purchase: bool = True


class TransactionUpdate(BaseModel):
    category_id: Optional[str] = None
    counterparty: Optional[str] = None
    reference: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None
    attachment_url: Optional[str] = None
    due_date: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    unit: str = "pcs"
    stock_qty: float = 0.0
    cost_price: float = 0.0
    selling_price: float = 0.0
    low_stock_threshold: float = 5.0


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    unit: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    low_stock_threshold: Optional[float] = None
    status: Optional[str] = None


class StockAdjust(BaseModel):
    quantity_change: float
    reason: Optional[str] = None


class ReceivableCreate(BaseModel):
    customer: str
    reference: Optional[str] = None
    original_amount: float
    due_date: Optional[str] = None
    account_id: Optional[str] = None


class ReceivablePayment(BaseModel):
    amount: float
    account_id: str
    date: str


class PayableCreate(BaseModel):
    supplier: str
    reference: Optional[str] = None
    original_amount: float
    due_date: Optional[str] = None
    account_id: Optional[str] = None


class PayablePayment(BaseModel):
    amount: float
    account_id: str
    date: str


class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
