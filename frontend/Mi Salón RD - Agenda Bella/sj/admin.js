// admin.js — Servicios (MVP) con localStorage + edición en tabla
(function () {
  const KEY = 'msr_servicios';
  let adding = false;      // true cuando hay una fila "nueva" en edición
  let editingId = null;    // id de servicio en edición

  // --- helpers de storage ---
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));
  const uid  = () => Math.random().toString(36).slice(2,10);

  // Semilla mínima
  const seedIfEmpty = () => {
    if (!localStorage.getItem(KEY)) {
      save([
        { id: uid(), nombre:'Peinado',       precio:400,  duracion:30 },
        { id: uid(), nombre:'Corte de Pelo', precio:300,  duracion:30 },
        { id: uid(), nombre:'Color & Mechas',precio:1500, duracion:120 },
      ]);
    }
  };

  // --- render de tabla ---
  function render(tbody) {
    const servicios = load();

    // Fila de "nuevo" servicio si estamos agregando
    const nuevaFila = adding ? `
      <tr data-id="__new">
        <td><input class="in-nombre" type="text" placeholder="Nombre del servicio" /></td>
        <td><input class="in-precio" type="number" min="0" step="1" placeholder="Precio RD$" /></td>
        <td><input class="in-duracion" type="number" min="1" step="1" placeholder="Minutos" /></td>
        <td>
          <button class="btn-tabla editar"  data-action="save-new">Guardar</button>
          <button class="btn-tabla cancelar" data-action="cancel-new">Cancelar</button>
        </td>
       </tr>
    ` : '';

    // Filas existentes
    const filas = servicios.map(s => {
   const edit = s.id === editingId;
     if (!edit) {
        return `
          <tr data-id="${s.id}">
            <td>${s.nombre}</td>
            <td>RD$ ${Number(s.precio||0).toLocaleString('es-DO')}</td>
            <td>${s.duracion} min</td>
         <td>
              <button class="btn-tabla editar" data-action="edit">Editar</button>
              <button class="btn-tabla cancelar" data-action="delete">Eliminar</button>
            </td>
          </tr>
        `;
      }
      // Fila en edición
      return `
        <tr data-id="${s.id}">
          <td><input class="in-nombre" type="text" value="${s.nombre}" /></td>
          <td><input class="in-precio" type="number" min="0" step="1" value="${s.precio}" /></td>
          <td><input class="in-duracion" type="number" min="1" step="1" value="${s.duracion}" /></td>
          <td>
            <button class="btn-tabla editar"  data-action="save">Guardar</button>
            <button class="btn-tabla cancelar" data-action="cancel-edit">Cancelar</button>
          </td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = nuevaFila + filas;
  }

  // --- eventos de página servicios ---
  function bindServiciosPage() {
    const addBtn = document.querySelector('.btn, .agregar-servicio'); // tu botón "➕ Agregar Servicio"
    const tbody  = document.querySelector('table.tabla-citas tbody');
    if (!tbody) return;

    render(tbody);

    // Click en "Agregar Servicio"
    addBtn?.addEventListener('click', () => {
      if (adding || editingId) return; // evita múltiples filas en edición
      adding = true;
      render(tbody);
      // foco en el primer input
      tbody.querySelector('.in-nombre')?.focus();
    });

    // Delegación de eventos en la tabla
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      const tr  = btn.closest('tr[data-id]'); if (!tr)  return;
      const id  = tr.dataset.id;
      const act = btn.dataset.action;
      const servicios = load();

      // Nuevo → Guardar / Cancelar
      if (act === 'save-new') {
        const nombre   = tr.querySelector('.in-nombre').value.trim();
        const precio   = Number(tr.querySelector('.in-precio').value || 0);
        const duracion = Number(tr.querySelector('.in-duracion').value || 0);
        if (!nombre || precio < 0 || duracion <= 0) { alert('Completa nombre, precio y duración (>0).'); return; }
        servicios.push({ id: uid(), nombre, precio, duracion });
        save(servicios);
        adding = false;
        render(tbody);
        return;
      }
      if (act === 'cancel-new') {
        adding = false;
        render(tbody);
        return;
      }

      // Buscar indice para acciones sobre existentes
      const i = servicios.findIndex(x => x.id === id);
      if (i < 0) return;

      if (act === 'edit') {
        if (adding) { adding = false; }       // cierra el modo "nuevo" si estaba abierto
        editingId = id;
        render(tbody);
        tr.closest('tbody')?.querySelector('.in-nombre')?.focus();
        return;
      }

      if (act === 'cancel-edit') {
        editingId = null;
        render(tbody);
        return;
      }

      if (act === 'save') {
        const nombre   = tr.querySelector('.in-nombre').value.trim();
        const precio   = Number(tr.querySelector('.in-precio').value || 0);
        const duracion = Number(tr.querySelector('.in-duracion').value || 0);
        if (!nombre || precio < 0 || duracion <= 0) { alert('Completa nombre, precio y duración (>0).'); return; }
        servicios[i] = { ...servicios[i], nombre, precio, duracion };
        save(servicios);
        editingId = null;
        render(tbody);
        return;
      }

      if (act === 'delete') {
        if (!confirm('¿Eliminar este servicio?')) return;
        servicios.splice(i, 1);
        save(servicios);
        render(tbody);
        return;
      }
    });
  }

  // --- init público ---
  function initServiciosTable() {
    seedIfEmpty();
    bindServiciosPage();
  }

  // Expone solo lo necesario (por si luego agregas más módulos)
  window.Admin = Object.assign({}, window.Admin, { initServiciosTable });
})();
































//CITAS 

// ====== Citas (MVP) con edición en línea y lista de servicios ======
(function () {
  const KEY_CITAS = 'msr_citas';
  const KEY_SERVS = 'msr_servicios';
  const HORAS   = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM','05:00 PM'];
  const ESTADOS = ['Pendiente','Completada','Cancelada'];

  let addingCita = false;   // fila nueva en edición
  let editingCitaId = null; // id de cita en edición

  // --------- helpers storage ----------
  const loadCitas = () => { try { return JSON.parse(localStorage.getItem(KEY_CITAS)) || []; } catch { return []; } };
  const saveCitas = (arr) => localStorage.setItem(KEY_CITAS, JSON.stringify(arr));
  const loadServiciosNombres = () => {
    try {
      const arr = JSON.parse(localStorage.getItem(KEY_SERVS)) || [];
      const nombres = arr.map(s => s?.nombre).filter(Boolean);
      return nombres.length ? nombres : ['Corte de Pelo','Peinado','Color & Mechas']; // fallback
    } catch {
      return ['Corte de Pelo','Peinado','Color & Mechas'];
    }
  };
  const uid = () => Math.random().toString(36).slice(2,10);

  // --------- semilla de citas ----------
  function seedCitasIfEmpty() {
    if (!localStorage.getItem(KEY_CITAS)) {
      saveCitas([
        { id: uid(), cliente:'Ana Pérez',  servicio:'Corte de Pelo', fecha:'2025-10-30', hora:'10:00 AM', estado:'Pendiente' },
        { id: uid(), cliente:'Luis García', servicio:'Peinado',      fecha:'2025-10-31', hora:'03:00 PM', estado:'Pendiente' },
      ]);
    }
  }

  // --------- util para ordenar por fecha/hora (más recientes primero) ----------
  function parseDateTime(fechaISO, hora12h) {
    try {
      const [h, rest] = String(hora12h).split(':');
      const [m, ampm] = String(rest).split(' ');
      let hour = Number(h), min = Number(m);
      if (ampm?.toUpperCase() === 'PM' && hour !== 12) hour += 12;
      if (ampm?.toUpperCase() === 'AM' && hour === 12) hour = 0;
      return new Date(`${fechaISO}T${String(hour).padStart(2,'0')}:${String(min).padStart(2,'0')}:00`).getTime();
    } catch { return 0; }
  }

  // --------- render tabla citas ----------
  function renderCitas(tbody) {
    const serviciosDisponibles = loadServiciosNombres();
    const citas = loadCitas().slice().sort((a,b) => parseDateTime(b.fecha,b.hora) - parseDateTime(a.fecha,a.hora));

    // Fila nueva (si estamos agregando)
    const nuevaFila = addingCita ? `
      <tr data-id="__newCita">
        <td><input class="in-cliente" type="text" placeholder="Nombre del cliente" /></td>
        <td>
          <select class="in-servicio">
            ${serviciosDisponibles.map(n => `<option>${n}</option>`).join('')}
          </select>
        </td>
        <td><input class="in-fecha" type="date" /></td>
        <td>
          <select class="in-hora">
            ${HORAS.map(h=>`<option>${h}</option>`).join('')}
          </select>
        </td>
        <td>
          <select class="in-estado">
            ${ESTADOS.map(e=>`<option ${e==='Pendiente'?'selected':''}>${e}</option>`).join('')}
          </select>
        </td>
        <td>
          <button class="btn-tabla editar"  data-action="save-new-cita">Guardar</button>
          <button class="btn-tabla cancelar" data-action="cancel-new-cita">Cancelar</button>
        </td>
      </tr>
    ` : '';

    // Filas existentes (normal o en edición)
    const filas = citas.map(c => {
      const edit = c.id === editingCitaId;
      if (!edit) {
        return `
          <tr data-id="${c.id}">
            <td>${c.cliente}</td>
            <td>${c.servicio}</td>
            <td>${c.fecha}</td>
            <td>${c.hora}</td>
            <td class="${c.estado==='Pendiente'?'estado-activo':''}">${c.estado}</td>
            <td>
              <button class="btn-tabla editar"  data-action="edit-cita">Editar</button>
              <button class="btn-tabla cancelar" data-action="cancel-cita">Cancelar</button>
            </td>
          </tr>`;
      }
      // Modo edición inline
      return `
        <tr data-id="${c.id}">
          <td><input class="in-cliente" type="text" value="${c.cliente}" /></td>
          <td>
            <select class="in-servicio">
              ${serviciosDisponibles.map(n => `<option ${n===c.servicio?'selected':''}>${n}</option>`).join('')}
            </select>
          </td>
          <td><input class="in-fecha" type="date" value="${c.fecha}" /></td>
          <td>
            <select class="in-hora">
              ${HORAS.map(h=>`<option ${h===c.hora?'selected':''}>${h}</option>`).join('')}
            </select>
          </td>
          <td>
            <select class="in-estado">
              ${ESTADOS.map(e=>`<option ${e===c.estado?'selected':''}>${e}</option>`).join('')}
            </select>
          </td>
          <td>
            <button class="btn-tabla editar"  data-action="save-cita">Guardar</button>
            <button class="btn-tabla cancelar" data-action="cancel-edit-cita">Cancelar</button>
          </td>
        </tr>`;
    }).join('');

    tbody.innerHTML = nuevaFila + filas;
  }

  // --------- eventos de la página de citas ----------
  function bindCitasPage() {
    const tbody = document.querySelector('table.tabla-citas tbody');
    if (!tbody) return;

    // botón para crear nueva cita (si lo tienes en el HTML)
    const addBtn = document.querySelector('.agregar-cita, .btn-add-cita, .btn-nueva-cita');

    renderCitas(tbody);

    addBtn?.addEventListener('click', () => {
      if (addingCita || editingCitaId) return;
      addingCita = true;
      renderCitas(tbody);
      tbody.querySelector('.in-cliente')?.focus();
    });

    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('button'); if (!btn) return;
      const tr  = btn.closest('tr[data-id]'); if (!tr)  return;
      const id  = tr.dataset.id;
      const act = btn.dataset.action;

      // Crear nueva
      if (act === 'save-new-cita') {
        const cliente  = tr.querySelector('.in-cliente').value.trim();
        const servicio = tr.querySelector('.in-servicio').value;
        const fecha    = tr.querySelector('.in-fecha').value;
        const hora     = tr.querySelector('.in-hora').value;
        const estado   = tr.querySelector('.in-estado').value;
        if (!cliente || !servicio || !fecha || !hora) { alert('Completa cliente, servicio, fecha y hora.'); return; }
        const list = loadCitas();
        list.push({ id: uid(), cliente, servicio, fecha, hora, estado });
        saveCitas(list);
        addingCita = false;
        renderCitas(tbody);
        return;
      }
      if (act === 'cancel-new-cita') {
        addingCita = false;
        renderCitas(tbody);
        return;
      }

      // Acciones sobre existentes
      const list = loadCitas();
      const i = list.findIndex(x => x.id === id);
      if (i < 0) return;

      if (act === 'edit-cita') {
        if (addingCita) addingCita = false;
        editingCitaId = id;
        renderCitas(tbody);
        tr.closest('tbody')?.querySelector('.in-cliente')?.focus();
        return;
      }

      if (act === 'cancel-edit-cita') {
        editingCitaId = null;
        renderCitas(tbody);
        return;
      }

      if (act === 'save-cita') {
        const cliente  = tr.querySelector('.in-cliente').value.trim();
        const servicio = tr.querySelector('.in-servicio').value;
        const fecha    = tr.querySelector('.in-fecha').value;
        const hora     = tr.querySelector('.in-hora').value;
        const estado   = tr.querySelector('.in-estado').value;
        if (!cliente || !servicio || !fecha || !hora) { alert('Completa cliente, servicio, fecha y hora.'); return; }
        list[i] = { ...list[i], cliente, servicio, fecha, hora, estado };
        saveCitas(list);
        editingCitaId = null;
        renderCitas(tbody);
        return;
      }

      if (act === 'cancel-cita') {
        if (!confirm('¿Marcar esta cita como Cancelada?')) return;
        list[i].estado = 'Cancelada';
        saveCitas(list);
        renderCitas(tbody);
        return;
      }

      // (Opcional) eliminar cita por completo
      // if (act === 'delete-cita') { ... }
    });
  }

  function initCitasTable() {
    seedCitasIfEmpty();
    bindCitasPage();
  }

  // Exponer el init sin romper lo existente
  window.Admin = Object.assign({}, window.Admin, { initCitasTable });
})();
