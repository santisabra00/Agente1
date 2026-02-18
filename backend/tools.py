# tools.py
# Herramientas financieras del agente

import yfinance as yf
from datetime import datetime

# ─────────────────────────────────────────
# FUNCIONES
# ─────────────────────────────────────────

def obtener_precio(ticker: str) -> str:
    """Obtiene el precio actual y datos clave de un activo"""
    try:
        activo = yf.Ticker(ticker.upper())
        info = activo.info

        nombre = info.get("longName") or info.get("shortName") or ticker.upper()
        precio = info.get("currentPrice") or info.get("regularMarketPrice")
        apertura = info.get("open") or info.get("regularMarketOpen")
        max_dia = info.get("dayHigh") or info.get("regularMarketDayHigh")
        min_dia = info.get("dayLow") or info.get("regularMarketDayLow")
        volumen = info.get("volume") or info.get("regularMarketVolume")
        moneda = info.get("currency", "USD")

        if not precio:
            return f"No se pudo obtener el precio de {ticker.upper()}. Verificá el símbolo."

        variacion = ((precio - apertura) / apertura * 100) if apertura else None
        emoji = "🟢" if variacion and variacion >= 0 else "🔴"

        resultado = f"""
{emoji} **{nombre} ({ticker.upper()})**
💰 Precio: {precio:.2f} {moneda}
📊 Apertura: {apertura:.2f} {moneda}
📈 Máximo del día: {max_dia:.2f} {moneda}
📉 Mínimo del día: {min_dia:.2f} {moneda}
"""
        if variacion is not None:
            resultado += f"{'📈' if variacion >= 0 else '📉'} Variación: {variacion:+.2f}%\n"
        if volumen:
            resultado += f"📦 Volumen: {volumen:,}\n"

        return resultado.strip()

    except Exception as e:
        return f"Error al obtener datos de {ticker}: {str(e)}"


def obtener_info_fundamental(ticker: str) -> str:
    """Obtiene información fundamental de una empresa o ETF"""
    try:
        activo = yf.Ticker(ticker.upper())
        info = activo.info

        nombre = info.get("longName") or info.get("shortName") or ticker.upper()
        sector = info.get("sector", "N/A")
        industria = info.get("industry", "N/A")
        descripcion = info.get("longBusinessSummary", "Sin descripción disponible.")
        market_cap = info.get("marketCap")
        pe_ratio = info.get("trailingPE")
        dividend_yield = info.get("dividendYield")
        semana_52_max = info.get("fiftyTwoWeekHigh")
        semana_52_min = info.get("fiftyTwoWeekLow")

        resultado = f"📋 **{nombre} ({ticker.upper()})**\n"

        if sector != "N/A":
            resultado += f"🏭 Sector: {sector}\n"
        if industria != "N/A":
            resultado += f"🔧 Industria: {industria}\n"
        if market_cap:
            resultado += f"💎 Market Cap: ${market_cap:,.0f}\n"
        if pe_ratio:
            resultado += f"📊 P/E Ratio: {pe_ratio:.2f}\n"
        if dividend_yield:
            resultado += f"💵 Dividendo: {dividend_yield*100:.2f}%\n"
        if semana_52_max and semana_52_min:
            resultado += f"📅 Rango 52 semanas: {semana_52_min:.2f} - {semana_52_max:.2f}\n"

        if descripcion and descripcion != "Sin descripción disponible.":
            resultado += f"\n📝 {descripcion[:300]}..."

        return resultado.strip()

    except Exception as e:
        return f"Error al obtener info de {ticker}: {str(e)}"


def comparar_activos(ticker1: str, ticker2: str) -> str:
    """Compara dos activos entre sí"""
    try:
        def get_data(ticker):
            t = yf.Ticker(ticker.upper())
            info = t.info
            precio = info.get("currentPrice") or info.get("regularMarketPrice", 0)
            apertura = info.get("open") or info.get("regularMarketOpen", precio)
            variacion = ((precio - apertura) / apertura * 100) if apertura else 0
            nombre = info.get("shortName") or ticker.upper()
            return {"nombre": nombre, "precio": precio, "variacion": variacion}

        d1 = get_data(ticker1)
        d2 = get_data(ticker2)

        emoji1 = "🟢" if d1["variacion"] >= 0 else "🔴"
        emoji2 = "🟢" if d2["variacion"] >= 0 else "🔴"

        return f"""
⚔️ **Comparación: {ticker1.upper()} vs {ticker2.upper()}**

{emoji1} {d1['nombre']}: ${d1['precio']:.2f} ({d1['variacion']:+.2f}%)
{emoji2} {d2['nombre']}: ${d2['precio']:.2f} ({d2['variacion']:+.2f}%)

{'📈 ' + ticker1.upper() + ' está teniendo mejor día' if d1['variacion'] > d2['variacion'] else '📈 ' + ticker2.upper() + ' está teniendo mejor día'}
""".strip()

    except Exception as e:
        return f"Error al comparar activos: {str(e)}"


def obtener_hora() -> str:
    """Devuelve la fecha y hora actual"""
    ahora = datetime.now()
    return ahora.strftime("Hoy es %A %d de %B de %Y, son las %H:%M hs")


# ─────────────────────────────────────────
# DEFINICIÓN PARA LA API DE CLAUDE
# ─────────────────────────────────────────

TOOLS = [
    {
        "name": "obtener_precio",
        "description": "Obtiene el precio actual, variación del día y datos clave de una acción, ETF o cripto. Usar cuando el usuario pregunta por el precio o cotización de un activo.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "El símbolo del activo. Ejemplos: AAPL (Apple), SPY (ETF S&P500), BTC-USD (Bitcoin), MELI (MercadoLibre)"
                }
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "obtener_info_fundamental",
        "description": "Obtiene información fundamental de una empresa o ETF: sector, market cap, P/E ratio, dividendos, descripción.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker": {
                    "type": "string",
                    "description": "El símbolo del activo. Ejemplos: AAPL, MSFT, SPY"
                }
            },
            "required": ["ticker"]
        }
    },
    {
        "name": "comparar_activos",
        "description": "Compara dos activos entre sí mostrando precio y variación del día de ambos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "ticker1": {
                    "type": "string",
                    "description": "Símbolo del primer activo"
                },
                "ticker2": {
                    "type": "string",
                    "description": "Símbolo del segundo activo"
                }
            },
            "required": ["ticker1", "ticker2"]
        }
    },
    {
        "name": "obtener_hora",
        "description": "Devuelve la fecha y hora actual.",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    }
]


def ejecutar_tool(nombre: str, inputs: dict) -> str:
    """Ejecuta la herramienta correspondiente"""
    if nombre == "obtener_precio":
        return obtener_precio(inputs["ticker"])
    elif nombre == "obtener_info_fundamental":
        return obtener_info_fundamental(inputs["ticker"])
    elif nombre == "comparar_activos":
        return comparar_activos(inputs["ticker1"], inputs["ticker2"])
    elif nombre == "obtener_hora":
        return obtener_hora()
    else:
        return f"Herramienta '{nombre}' no encontrada"
