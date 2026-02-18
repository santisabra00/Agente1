# agent.py
# El corazón del agente

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
SYSTEM_PROMPT = """Sos un agente inteligente y amigable llamado Santi-Bot.
Respondés siempre en español, de manera clara y concisa.
Cuando necesitás hacer un cálculo o saber la hora, usás las herramientas disponibles.
"""

def procesar_respuesta(respuesta):
    """Procesa la respuesta de Claude y ejecuta tools si es necesario"""

    # Si quiere usar una herramienta
    if respuesta.stop_reason == "tool_use":
        # Buscar el bloque de tool use
        for bloque in respuesta.content:
            if bloque.type == "tool_use":
                nombre_tool = bloque.name
                inputs_tool = bloque.input

                print(f"\n🔧 Usando herramienta: {nombre_tool}...")
                resultado = ejecutar_tool(nombre_tool, inputs_tool)

                # Agregar respuesta del asistente al historial
                agregar_mensaje("assistant", respuesta.content)

                # Agregar resultado de la tool al historial
                agregar_mensaje("user", [
                    {
                        "type": "tool_result",
                        "tool_use_id": bloque.id,
                        "content": resultado
                    }
                ])

                # Pedir a Claude que procese el resultado
                respuesta_final = cliente.messages.create(
                    model="claude-opus-4-5",
                    max_tokens=1024,
                    system=SYSTEM_PROMPT,
                    tools=TOOLS,
                    messages=obtener_historial()
                )

                return respuesta_final.content[0].text

    # Respuesta normal sin tools
    return respuesta.content[0].text


def chat(mensaje_usuario):
    """Envía un mensaje y obtiene respuesta"""
    agregar_mensaje("user", mensaje_usuario)

    respuesta = cliente.messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        tools=TOOLS,
        messages=obtener_historial()
    )

    texto_respuesta = procesar_respuesta(respuesta)
    agregar_mensaje("assistant", texto_respuesta)

    return texto_respuesta


def main():
    """Loop principal del agente"""
    print("=" * 40)
    print("🤖 Santi-Bot iniciado!")
    print("Escribí 'salir' para terminar")
    print("=" * 40)

    while True:
        try:
            entrada = input("\nVos: ").strip()

            if not entrada:
                continue

            if entrada.lower() in ["salir", "exit", "quit"]:
                print("\n🤖 ¡Hasta luego!")
                break

            respuesta = chat(entrada)
            print(f"\n🤖 Santi-Bot: {respuesta}")

        except KeyboardInterrupt:
            print("\n\n🤖 ¡Hasta luego!")
            break


if __name__ == "__main__":
    main()
