from fastapi import FastAPI
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from routers import (
    auth_routes, business_routes, account_routes, transaction_routes,
    dashboard_routes, product_routes, receivable_routes, payable_routes,
    report_routes, assistant_routes, category_routes,
)

app = FastAPI(title="Dompet K-eM API")

app.include_router(auth_routes.router)
app.include_router(business_routes.router)
app.include_router(account_routes.router)
app.include_router(transaction_routes.router)
app.include_router(dashboard_routes.router)
app.include_router(product_routes.router)
app.include_router(receivable_routes.router)
app.include_router(payable_routes.router)
app.include_router(report_routes.router)
app.include_router(assistant_routes.router)
app.include_router(category_routes.router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@app.get("/api")
async def root():
    return {"message": "Dompet K-eM API"}
