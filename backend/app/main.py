from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.api.routes import admin, shareholder
from app.api.routes import admin, shareholder, auth
from app.api.routes import admin_audit, certificates

Base.metadata.create_all(bind=engine)

app = FastAPI(   title="Cap Table API",
    description="API for managing company cap table and shareholders",
    version="1.0.0",
    contact={
        "name": "Your Name",
        "email": "your.email@example.com",
    },
    license_info={
        "name": "Private",
    })

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(shareholder.router)
app.include_router(admin_audit.router)
app.include_router(certificates.router)
