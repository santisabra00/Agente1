# api.py
# Servidor FastAPI que conecta el frontend con el agente

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from agent import chat
from watchlist import obtener_watchlist, agregar_ticker, eliminar_ticker
from memory import limpiar_historial
from tools import obtener_precio
import yfinance as yf
import json
import os

PORTFOLIO_FILE = os.path.join(os.path.dirname(__file__), 'portfolio.json')

def cargar_portfolio():
    if os.path.exists(PORTFOLIO_FILE):
        with open(PORTFOLIO_FILE, 'r') as f:
            return json.load(f)
    return []

def guardar_portfolio(posiciones):
    with open(PORTFOLIO_FILE, 'w') as f:
        json.dump(posiciones, f)

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

class Posicion(BaseModel):
    ticker: str
    cantidad: float
    precio_compra: float

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

# ─── PORTFOLIO ENDPOINTS ─────────────────────

@app.get("/portfolio")
def get_portfolio():
    posiciones = cargar_portfolio()
    items = []
    total_invertido = 0
    total_actual = 0

    for pos in posiciones:
        try:
            activo = yf.Ticker(pos['ticker'])
            info = activo.info
            precio_actual = info.get("currentPrice") or info.get("regularMarketPrice") or 0
            nombre = info.get("shortName") or pos['ticker']
            moneda = info.get("currency", "USD")

            valor_compra = pos['cantidad'] * pos['precio_compra']
            valor_actual = pos['cantidad'] * precio_actual
            ganancia = valor_actual - valor_compra
            ganancia_pct = (ganancia / valor_compra * 100) if valor_compra else 0

            total_invertido += valor_compra
            total_actual += valor_actual

            items.append({
                "ticker": pos['ticker'],
                "nombre": nombre,
                "cantidad": pos['cantidad'],
                "precio_compra": round(pos['precio_compra'], 2),
                "precio_actual": round(precio_actual, 2),
                "valor_actual": round(valor_actual, 2),
                "ganancia": round(ganancia, 2),
                "ganancia_pct": round(ganancia_pct, 2),
                "moneda": moneda
            })
        except:
            items.append({
                "ticker": pos['ticker'],
                "nombre": pos['ticker'],
                "cantidad": pos['cantidad'],
                "precio_compra": pos['precio_compra'],
                "precio_actual": 0,
                "valor_actual": 0,
                "ganancia": 0,
                "ganancia_pct": 0,
                "moneda": "USD"
            })

    ganancia_total = total_actual - total_invertido
    ganancia_total_pct = (ganancia_total / total_invertido * 100) if total_invertido else 0

    return {
        "items": items,
        "total_invertido": round(total_invertido, 2),
        "total_actual": round(total_actual, 2),
        "ganancia_total": round(ganancia_total, 2),
        "ganancia_total_pct": round(ganancia_total_pct, 2)
    }

@app.post("/portfolio")
def add_posicion(posicion: Posicion):
    ticker = posicion.ticker.upper()
    try:
        activo = yf.Ticker(ticker)
        info = activo.info
        if not info.get("currentPrice") and not info.get("regularMarketPrice"):
            return {"error": f"Ticker '{ticker}' no encontrado"}
    except:
        return {"error": f"Error al validar '{ticker}'"}

    posiciones = cargar_portfolio()
    # Si ya existe, actualizar
    for pos in posiciones:
        if pos['ticker'] == ticker:
            pos['cantidad'] = posicion.cantidad
            pos['precio_compra'] = posicion.precio_compra
            guardar_portfolio(posiciones)
            return {"mensaje": f"{ticker} actualizado en el portfolio"}

    posiciones.append({
        "ticker": ticker,
        "cantidad": posicion.cantidad,
        "precio_compra": posicion.precio_compra
    })
    guardar_portfolio(posiciones)
    return {"mensaje": f"{ticker} agregado al portfolio"}

@app.delete("/portfolio/{ticker}")
def delete_posicion(ticker: str):
    ticker = ticker.upper()
    posiciones = cargar_portfolio()
    nuevas = [p for p in posiciones if p['ticker'] != ticker]
    if len(nuevas) == len(posiciones):
        return {"error": f"{ticker} no está en el portfolio"}
    guardar_portfolio(nuevas)
    return {"mensaje": f"{ticker} eliminado del portfolio"}

# ─── HISTORIAL ───────────────────────────────

@app.post("/reset")
def reset_historial():
    """Borra el historial de conversación"""
    limpiar_historial()
    return {"mensaje": "Historial borrado. ¡Nueva conversación lista! 🧹"}
