# VTC Scroll + Voice Sync Integration Guide

## Archivos Agregados

1. **scroll-voice-sync.js** — Sistema completo de scroll sincronizado con voz
2. **vtc-init.js** — Inicialización de estructura y data attributes
3. **INTEGRATION_GUIDE.md** — Este archivo

## Cómo Integrar en index.html

Agregar los siguientes scripts **ANTES** del `</body>`:

```html
<!-- VTC Scroll + Voice Sync System -->
<script defer src="/vtc-init.js"></script>
<script defer src="/scroll-voice-sync.js"></script>

<!-- Conectar con ElevenLabs Victor Agent (cuando esté disponible) -->
<script>
  // ElevenLabs Victor agent se inyectará aquí via embeddings
  // El sistema scroll-voice-sync lo detectará como window.victorAgent
</script>
```

## Estructura DOM Requerida

El sistema espera esta estructura:

```html
<!-- Hero section -->
<section class="hero" id="hero">
  <div id="heroContinue"></div> <!-- ← CTA button se inyecta aquí -->
</section>

<!-- Welcome/Syllabus section -->
<section id="welcome-video" class="module-section">
  <video>...</video>
</section>

<!-- Índice/Syllabus -->
<section id="indice" class="index-section">...</section>

<!-- Cada módulo -->
<section class="module-section" id="modulo-f">
  <video>...</video>
  <div class="content-block">
    <div class="block-title">...</div>
    <p class="block-text">...</p>
  </div>
  <div class="quiz">...</div>
</section>
```

**El sistema automáticamente agrega:**
- `data-module-id="module-f"` → a cada `<section>`
- IDs a cada `content-block` → `module-f-para-0`, `module-f-para-1`, etc.
- IDs a cada `quiz` → `module-f-quiz`

## Flujo de Ejecución

### 1. Página Carga
```
index.html carga
  ↓
vtc-init.js ejecuta
  ↓
- Agrega data-module-id a secciones
- Agrega IDs a paragraphs y quizzes
- Crea botón "Comenzar Ahora con Víctor"
  ↓
scroll-voice-sync.js ejecuta
  ↓
- Inicializa IntersectionObserver
- Expone window.vtcScrollSync
- Expone window.startFullCourse()
```

### 2. Usuario Hace Click en "Comenzar"
```
User clicks "Comenzar Ahora con Víctor"
  ↓
window.startFullCourse()
  ↓
scroll-voice-sync.js inicia flujo:
  1. Scroll a Hero
  2. Trigger Victor: "read hero text"
  3. Wait Victor completa
  4. Scroll a Syllabus (sin leer)
  5. Scroll a Welcome Video
  6. Victor: "Press Play"
  7. Wait video ends
  8. Begin module-f loop
```

### 3. Lectura de Módulo
```
For each paragraph in module:
  1. Highlight paragraph (add .vtc-reading)
  2. Scroll to center paragraph
  3. Victor reads paragraph
  4. Remove highlight
  5. Next paragraph
  
After all paragraphs:
  6. Victor gives explanation (recap motivador)
  7. Execute quiz
  8. Next module
```

### 4. Interrupción de Usuario
```
User interrupts: "Explain this part"
  ↓
window.vtcScrollSync.handleUserInterruption()
  ↓
1. Freeze scroll at current viewport
2. Get current section (via activeViewportSection)
3. Victor explains that section
4. Prompt: "Continue?"
```

## CSS Requerido (Ya Incluido)

```css
/* READING HIGHLIGHT — Párrafo siendo leído por Victor */
.vtc-reading {
  background: rgba(184, 154, 106, .15) !important;
  border-left: 3px solid var(--gold) !important;
  padding-left: 1.5rem !important;
}
.vtc-reading .block-title {
  color: var(--gold) !important;
}
```

## JavaScript APIs Disponibles

```javascript
// Iniciar curso completo
window.startFullCourse()

// Ir a módulo específico
window.goToModule("module-5")

// Acceder al sistema
window.vtcScrollSync.activeViewportSection  // Sección actual
window.vtcScrollSync.isReading              // ¿Victor está leyendo?
window.vtcScrollSync.isScrollLocked         // ¿Scroll congelado?

// Controlar Victor
window.vtcScrollSync.pauseVictorReading()
window.vtcScrollSync.resumeVictorReading()
window.vtcScrollSync.pauseVictorSystem()
window.vtcScrollSync.resumeVictorSystem()
```

## ElevenLabs Integration

El sistema espera que `window.victorAgent` esté disponible con estos métodos:

```javascript
window.victorAgent.executeAction(action, data)
// Actions: 'read', 'explain', 'prompt', 'read-quiz-answers', etc.

window.victorAgent.pause()
window.victorAgent.resume()
window.victorAgent.standby()
window.victorAgent.activate()
window.victorAgent.isFinished  // boolean
```

**Eventos desde Victor:**

```javascript
window.addEventListener('victor-command', (e) => {
  const { command, data } = e.detail;
  // command: 'explain-current', 'go-to-module', 'pause', 'resume'
});
```

## Testing Checklist

- [ ] Página carga sin errores en console
- [ ] "Comenzar Ahora con Víctor" botón visible y clickeable
- [ ] Al hacer click, scroll va a Hero
- [ ] Consola muestra: "🎬 Starting Full Course Flow..."
- [ ] Scroll a Syllabus (sin leer)
- [ ] Scroll a Welcome Video
- [ ] Victor prompt: "Press Play"
- [ ] Video plays when clicked
- [ ] After video ends, module-f starts
- [ ] Paragraphs get `.vtc-reading` class while reading
- [ ] Paragraphs center in viewport
- [ ] DeepLink: Click module en index, va directamente a ese módulo
- [ ] Interruption: User says "explain this", scroll freezes
- [ ] Quiz ejecuta correctamente

## Debugging

```javascript
// En browser console:
window.vtcScrollSync.updateViewportDebug()  // Log current section
window.vtcScrollSync.activeViewportSection  // See current section
```

Monitor en Network tab para ver eventos:
- `/videos/modulo-*.mp4` — Video requests
- `victor-command` events — User interruptions

## Notes

- Sistema es 100% funcional sin Victor — solo no habrá audio
- Puede testearse scrolling manualmente si Victor agent no está disponible
- Todos los console.logs están incluidos para debugging
- El sistema es tolerante a cambios de estructura HTML (busca por classes)