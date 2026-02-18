# watchlist.py
# Manejo de la watchlist persistida en JSON

import json
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

def obtener_watchlist() -> list:
    return _leer()

def agregar_ticker(ticker: str) -> str:
    tickers = _leer()
    ticker = ticker.upper()
    if ticker in tickers:
        return f"{ticker} ya está en tu watchlist."
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
