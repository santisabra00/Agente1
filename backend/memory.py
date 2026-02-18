# memory.py
# Maneja el historial de la conversación con persistencia en JSON

import json
from pathlib import Path

HISTORIAL_FILE = Path(__file__).parent / "historial.json"

# ─── HELPERS INTERNOS ────────────────────────

def _leer() -> list:
    """Lee el historial desde el archivo JSON"""
    if not HISTORIAL_FILE.exists():
        return []
    try:
        with open(HISTORIAL_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, IOError):
        return []

def _guardar(historial: list):
    """Guarda el historial en el archivo JSON"""
    # Solo guardamos mensajes serializables (texto plano)
    # Los mensajes con tool_use (listas) los guardamos tal cual
    serializable = []
    for msg in historial:
        if isinstance(msg["content"], str):
            serializable.append(msg)
        # Ignoramos los mensajes intermedios de tool_use (son solo para Claude)
        # Esto mantiene el archivo limpio con solo user/assistant de texto
    with open(HISTORIAL_FILE, "w", encoding="utf-8") as f:
        json.dump(serializable, f, ensure_ascii=False, indent=2)

# ─── HISTORIAL EN MEMORIA (sesión actual) ─────

# Cargamos el historial guardado al arrancar
_historial_sesion = _leer()

def agregar_mensaje(rol, contenido):
    """Agrega un mensaje al historial en memoria y persiste si es texto"""
    _historial_sesion.append({
        "role": rol,
        "content": contenido
    })
    # Solo persistimos cuando es un mensaje de texto (user string o assistant string)
    if isinstance(contenido, str):
        _guardar(_historial_sesion)

def obtener_historial():
    """Devuelve el historial completo de la sesión"""
    return _historial_sesion

def limpiar_historial():
    """Resetea la conversación en memoria y en disco"""
    _historial_sesion.clear()
    if HISTORIAL_FILE.exists():
        HISTORIAL_FILE.unlink()
