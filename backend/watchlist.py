# watchlist.py
# Manejo de la watchlist persistida en JSON

import json
import yfinance as yf
from pathlib import Path

WATCHLIST_FILE = Path(__file__).parent / "watchlist.json"

def _leer() -> list:
    if not WATCHLIST_FILE.exists():
        return []
    with open(WATCHLIST_FILE, "r") as f:
        return json.load(f)

def _guardar(tickers: list):
    with open(WATCHLIST_FILE, "w") as f:
        json.dump(tickers, f)

def _validar_ticker(ticker: str) -> bool:
    """Verifica que el ticker existe en yfinance y tiene precio"""
    try:
        info = yf.Ticker(ticker).info
        precio = info.get("currentPrice") or info.get("regularMarketPrice")
        return precio is not None and precio > 0
    except Exception:
        return False

def obtener_watchlist() -> list:
    return _leer()

def agregar_ticker(ticker: str) -> str:
    tickers = _leer()
    ticker = ticker.upper()

    if ticker in tickers:
        return f"{ticker} ya está en tu watchlist."

    # Validar que el ticker existe antes de agregarlo
    if not _validar_ticker(ticker):
        return f"❌ No encontré el ticker '{ticker}'. Verificá que el símbolo sea correcto (ej: AAPL, BTC-USD, SPY)."

    tickers.append(ticker)
    _guardar(tickers)
    return f"{ticker} agregado a tu watchlist. ✅"

def eliminar_ticker(ticker: str) -> str:
    tickers = _leer()
    ticker = ticker.upper()
    if ticker not in tickers:
        return f"{ticker} no está en tu watchlist."
    tickers.remove(ticker)
    _guardar(tickers)
    return f"{ticker} eliminado de tu watchlist. 🗑️"
