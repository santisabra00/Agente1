const API_URL = 'http://localhost:8000/chat';

const chatContainer = document.getElementById('chatContainer');
const inputMensaje = document.getElementById('inputMensaje');
const btnEnviar = document.getElementById('btnEnviar');

// Enviar con Enter
inputMensaje.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarMensaje();
  }
});

function agregarMensaje(texto, tipo) {
  const div = document.createElement('div');
  div.className = `message ${tipo}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = tipo === 'bot' ? '📈' : '👤';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = texto;

  div.appendChild(avatar);
  div.appendChild(bubble);
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return div;
}

function mostrarTyping() {
  const div = document.createElement('div');
  div.className = 'message bot typing';
  div.id = 'typing';

  div.innerHTML = `
    <div class="avatar">📈</div>
    <div class="bubble">
      <div class="dots">
        <span></span><span></span><span></span>
      </div>
    </div>
  `;

  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function quitarTyping() {
  const typing = document.getElementById('typing');
  if (typing) typing.remove();
}

async function enviarMensaje() {
  const texto = inputMensaje.value.trim();
  if (!texto) return;

  inputMensaje.value = '';
  btnEnviar.disabled = true;

  agregarMensaje(texto, 'user');
  mostrarTyping();

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texto })
    });

    const data = await res.json();
    quitarTyping();
    agregarMensaje(data.respuesta, 'bot');

  } catch (err) {
    quitarTyping();
    agregarMensaje('❌ Error al conectar con el servidor. ¿Está corriendo el backend?', 'bot');
  } finally {
    btnEnviar.disabled = false;
    inputMensaje.focus();
  }
}

function enviarSugerencia(texto) {
  inputMensaje.value = texto;
  enviarMensaje();
}
