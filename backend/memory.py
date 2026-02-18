# memory.py
# Maneja el historial de la conversación

historial = []

def agregar_mensaje(rol, contenido):
    """Agrega un mensaje al historial"""
    historial.append({
        "role": rol,        # "user" o "assistant"
        "content": contenido
    })

def obtener_historial():
    """Devuelve el historial completo"""
    return historial

def limpiar_historial():
    """Resetea la conversación"""
    historial.clear()
