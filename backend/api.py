# api.py
# Servidor FastAPI que conecta el frontend con el agente

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from agent import chat

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

@app.get("/")
def root():
    return {"status": "Agente financiero activo 🚀"}

@app.post("/chat")
def chat_endpoint(mensaje: Mensaje):
    respuesta = chat(mensaje.texto)
    return {"respuesta": respuesta}
