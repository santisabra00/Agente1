# agent.py
# El corazón del agente financiero

import os
from pathlib import Path
from dotenv import load_dotenv
import anthropic
from memory import agregar_mensaje, obtener_historial
from tools import TOOLS, ejecutar_tool

# Cargar API Key del .env con path explícito
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=True)
api_key = os.getenv("ANTHROPIC_API_KEY")

# Inicializar cliente de Anthropic
cliente = anthropic.Anthropic(api_key=api_key)

# Personalidad del agente
SYSTEM_PROMPT = """Sos un asistente financiero inteligente y amigable.
Ayudás a analizar acciones, ETFs y criptomonedas usando datos en tiempo real.
Respondés siempre en español, de manera clara y concisa.
Cuando el usuario pregunta por precios, variaciones o información de un activo, usás las herramientas disponibles.
Si no sabés el ticker exacto de algo, lo inferís (ej: "Apple" → AAPL, "Bitcoin" → BTC-USD, "S&P 500" → SPY).
No das consejos de inversión directos, pero sí información objetiva y análisis.
Usás emojis para hacer las respuestas más visuales y fáciles de leer.
"""

def chat(mensaje_usuario):
    """Envía un mensaje y obtiene respuesta, manejando múltiples tool calls"""
    agregar_mensaje("user", mensaje_usuario)

    while True:
        respuesta = cliente.messages.create(
            model="claude-opus-4-5",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=obtener_historial()
        )

        # Si no hay más tools que ejecutar, devolvemos la respuesta final
        if respuesta.stop_reason != "tool_use":
            texto = respuesta.content[0].text
            agregar_mensaje("assistant", texto)
            return texto

        # Recolectar TODOS los tool_use de esta respuesta
        tool_results = []
        for bloque in respuesta.content:
            if bloque.type == "tool_use":
                resultado = ejecutar_tool(bloque.name, bloque.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": bloque.id,
                    "content": resultado
                })

        # Agregar la respuesta del asistente con todos los tool_use
        agregar_mensaje("assistant", respuesta.content)

        # Agregar TODOS los resultados en un solo mensaje de user
        agregar_mensaje("user", tool_results)

        # El while continúa para que Claude procese los resultados
