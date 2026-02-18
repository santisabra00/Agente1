const API_URL = 'http://localhost:8000/chat';

const chatContainer = document.getElementById('chatContainer');
const inputMensaje  = document.getElementById('inputMensaje');
const btnEnviar     = document.getElementById('btnEnviar');

// ─── ENTER para enviar ───────────────────────
inputMensaje.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    enviarMensaje();
  }
});

// ─── RENDERIZADO DE TEXTO ────────────────────
// Convierte el texto del agente en HTML con colores y formato
function renderTexto(texto) {
  const lines = texto.split('\n');
  let html = '';

  for (const line of lines) {
    if (!line.trim()) {
      html += '<br>';
      continue;
    }

    let l = line
      // **negrita**
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // números en verde/rojo según signo
      .replace(/(\+[\d.,]+%?)/g, '<span class="tag-green">$1</span>')
      .replace(/(−[\d.,]+%?|-[\d.,]+%)/g, '<span class="tag-red">$1</span>');

    html += `<p>${l}</p>`;
  }

  return html;
}

// ─── AGREGAR MENSAJE ─────────────────────────
function agregarMensaje(texto, tipo) {
  const group = document.createElement('div');
  group.className = `msg-group ${tipo}`;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = tipo === 'bot' ? 'F' : 'S';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (tipo === 'bot') {
    bubble.innerHTML = renderTexto(texto);
  } else {
    bubble.textContent = texto;
  }

  content.appendChild(bubble);
  group.appendChild(avatar);
  group.appendChild(content);
  chatContainer.appendChild(group);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  return group;
}

// ─── TYPING INDICATOR ────────────────────────
function mostrarTyping() {
  const group = document.createElement('div');
  group.className = 'msg-group bot';
  group.id = 'typing';

  group.innerHTML = `
    <div class="msg-avatar">F</div>
    <div class="msg-content">
      <div class="typing-bubble">
        <div class="dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  `;

  chatContainer.appendChild(group);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function quitarTyping() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

// ─── ENVIAR MENSAJE ──────────────────────────
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
    agregarMensaje('No se pudo conectar con el servidor. Verificá que el backend esté corriendo.', 'bot');
  } finally {
    btnEnviar.disabled = false;
    inputMensaje.focus();
  }
}

function enviarSugerencia(texto) {
  inputMensaje.value = texto;
  enviarMensaje();
}
