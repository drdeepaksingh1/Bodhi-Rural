from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Bodhi Rural API", version="0.1.0", description="Python API foundation for the Bodhi Rural enterprise platform.")

# Restrict origins through environment configuration before exposing this API
# beyond local development. Do not use wildcard origins with credentials.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/api/health", tags=["System"])
def health_check() -> dict[str, str]:
    """Basic process health check; does not imply database connectivity."""
    return {"status": "ok", "service": "bodhi-rural-api", "version": "0.1.0"}
