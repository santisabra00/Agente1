# api.py
# Servidor FastAPI que conecta el frontend con el agente

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import chat
from watchlist import obtener_watchlist, agregar_ticker, eliminar_ticker
from tools import obtener_precio
import yfinance as yf

app = FastAPI()

# Permitir requests desde el frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Mensaje(BaseModel):
    texto: str

class TickerBody(BaseModel):
    ticker: str

@app.get("/")
def root():
    return {"status": "Agente financiero activo 🚀"}

@app.post("/chat")
def chat_endpoint(mensaje: Mensaje):
    respuesta = chat(mensaje.texto)
    return {"respuesta": respuesta}

# ─── WATCHLIST ENDPOINTS ─────────────────────

@app.get("/watchlist")
def get_watchlist():
    tickers = obtener_watchlist()
    items = []
    for ticker in tickers:
        try:
            activo = yf.Ticker(ticker)
            info = activo.info
            precio = info.get("currentPrice") or info.get("regularMarketPrice") or 0
            apertura = info.get("open") or info.get("regularMarketOpen") or precio
            variacion = ((precio - apertura) / apertura * 100) if apertura else 0
            nombre = info.get("shortName") or ticker
            moneda = info.get("currency", "USD")
            items.append({
                "ticker": ticker,
                "nombre": nombre,
                "precio": round(precio, 2),
                "variacion": round(variacion, 2),
                "moneda": moneda
            })
        except:
            items.append({
                "ticker": ticker,
                "nombre": ticker,
                "precio": 0,
                "variacion": 0,
                "moneda": "USD"
            })
    return {"items": items}

@app.post("/watchlist")
def add_to_watchlist(body: TickerBody):
    resultado = agregar_ticker(body.ticker)
    return {"mensaje": resultado}

@app.delete("/watchlist/{ticker}")
def remove_from_watchlist(ticker: str):
    resultado = eliminar_ticker(ticker)
    return {"mensaje": resultado}
