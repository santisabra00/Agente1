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
function renderTexto(texto) {
  // Detectar si es una tarjeta técnica
  if (texto.includes('[TECNICO]')) {
    const partes = texto.split('[TECNICO]');
    let html = '';

    for (const parte of partes) {
      if (!parte.trim()) continue;
      // Intentar parsear como JSON (datos técnicos)
      try {
        const datos = JSON.parse(parte.trim());
        html += renderTarjetaTecnica(datos);
      } catch {
        // Es texto normal antes/después de la tarjeta
        html += renderTextoPlano(parte);
      }
    }
    return html;
  }

  return renderTextoPlano(texto);
}

function renderTextoPlano(texto) {
  const lines = texto.split('\n');
  let html = '';
  for (const line of lines) {
    if (!line.trim()) { html += '<br>'; continue; }
    let l = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/(\+[\d.,]+%?)/g, '<span class="tag-green">$1</span>')
      .replace(/(−[\d.,]+%?|-[\d.,]+%)/g, '<span class="tag-red">$1</span>');
    html += `<p>${l}</p>`;
  }
  return html;
}

function renderTarjetaTecnica(d) {
  // RSI color y señal
  const rsiColor = d.rsi >= 70 ? 'var(--red)' : d.rsi <= 30 ? 'var(--green)' : 'var(--text-muted)';
  const rsiLabel = d.rsi >= 70 ? 'Sobrecomprado' : d.rsi <= 30 ? 'Sobrevendido' : 'Neutral';
  const rsiLabelClass = d.rsi >= 70 ? 'signal-red' : d.rsi <= 30 ? 'signal-green' : 'signal-neutral';
  const rsiFill = Math.round(d.rsi);

  // SMA señales
  const sma20Class = d.sma20_signal === 'arriba' ? 'signal-green' : 'signal-red';
  const sma20Text = d.sma20_signal === 'arriba' ? '↑ Precio sobre SMA' : '↓ Precio bajo SMA';

  const sma50Html = d.sma50 ? `
    <div class="tech-indicator">
      <span class="tech-label">SMA 50</span>
      <span class="tech-value">$${d.sma50}</span>
      <span class="signal-tag ${d.sma50_signal === 'arriba' ? 'signal-green' : 'signal-red'}">
        ${d.sma50_signal === 'arriba' ? '↑ Alcista' : '↓ Bajista'}
      </span>
    </div>` : '';

  return `
    <div class="tech-card">
      <div class="tech-header">
        <div>
          <span class="tech-ticker">${d.ticker}</span>
          <span class="tech-nombre">${d.nombre}</span>
        </div>
        <div class="tech-precio">$${d.precio} <span class="tech-moneda">${d.moneda}</span></div>
      </div>

      <div class="tech-grid">
        <div class="tech-indicator rsi-block">
          <span class="tech-label">RSI (14)</span>
          <span class="tech-value" style="color:${rsiColor}">${d.rsi}</span>
          <div class="rsi-bar-track">
            <div class="rsi-bar-fill" style="width:${rsiFill}%; background:${rsiColor}"></div>
            <div class="rsi-zones">
              <span style="left:30%"></span>
              <span style="left:70%"></span>
            </div>
          </div>
          <span class="signal-tag ${rsiLabelClass}">${rsiLabel}</span>
        </div>

        <div class="tech-indicator">
          <span class="tech-label">SMA 20</span>
          <span class="tech-value">$${d.sma20}</span>
          <span class="signal-tag ${sma20Class}">${sma20Text}</span>
        </div>

        ${sma50Html}
      </div>
    </div>
  `;
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
