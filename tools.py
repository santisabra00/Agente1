# tools.py
# Las herramientas que puede usar el agente

def calcular(expresion: str) -> str:
    """Evalúa una expresión matemática"""
    try:
        resultado = eval(expresion)
        return str(resultado)
    except Exception as e:
        return f"Error al calcular: {e}"

def obtener_hora() -> str:
    """Devuelve la fecha y hora actual"""
    from datetime import datetime
    ahora = datetime.now()
    return ahora.strftime("Hoy es %A %d de %B de %Y, son las %H:%M hs")

# Definición de herramientas para la API de Claude
TOOLS = [
    {
        "name": "calcular",
        "description": "Evalúa una expresión matemática. Útil para hacer cálculos.",
        "input_schema": {
            "type": "object",
            "properties": {
                "expresion": {
                    "type": "string",
                    "description": "La expresión matemática a evaluar. Ej: '2 + 2' o '10 * 5'"
                }
            },
            "required": ["expresion"]
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
    if nombre == "calcular":
        return calcular(inputs["expresion"])
    elif nombre == "obtener_hora":
        return obtener_hora()
    else:
        return f"Herramienta '{nombre}' no encontrada"
