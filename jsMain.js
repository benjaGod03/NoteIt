//libreria sortable es para mover las notas si encontras una forma mejor cambialo
document.addEventListener("DOMContentLoaded", () => {
      if (localStorage.getItem('modoOscuro') === '1') {
    document.body.classList.add('dark-mode');
    document.getElementById('modoToggleBtn').textContent = 'Modo claro';
  } else {
    document.body.classList.remove('dark-mode');
    document.getElementById('modoToggleBtn').textContent = 'Modo oscuro';
  }

  // lo inicia
  new Sortable(document.getElementById('contenedor-notas'), {
    animation: 150,
    ghostClass: 'dragging',
    draggable: '.note-box',
    filter: '.delete-btn',
    preventOnFilter: false, // permite que el click en delete-btn funcione normalmente
    delay: 150, // milisegundos antes de activar el drag en touch
    delayOnTouchOnly: true // solo aplica el delay en dispositivos táctiles
  });

  // Cargar notas del usuario al iniciar
  fetch('main.php?action=listar&id_grupo=0')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.notas)) {
        mostrarNotasDesdeBackend(data.notas);
      } else {
        console.error('No se pudieron cargar las notas:', data.message);
      }
    })
    .catch(err => console.error('Error al obtener notas:', err));
  // Cargar grupos del usuario al iniciar
  fetch('main.php?action=listar_grupos')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.grupos)) {
        mostrarGruposDesdeBackend(data.grupos);
      } else {
        console.error('No se pudieron cargar los grupos:', data.message);
      }
    })
    .catch(err => console.error('Error al obtener grupos:', err));


    //Modo oscuro (no funciona en el host solo de forma local no entiendo)
    window.toggleDarkMode = function () {
  document.body.classList.toggle('dark-mode');
  const darkMode = document.body.classList.contains('dark-mode');
  localStorage.setItem('modoOscuro', darkMode ? '1' : '0');
  const modoActual = document.body.classList.contains('dark-mode') ? 'Modo claro' : 'Modo oscuro';
  document.getElementById('modoToggleBtn').textContent = modoActual;

  // Actualizar colores de notas individuales
  document.querySelectorAll('#contenedor-notas .note-box').forEach(nota => {
    // Si tiene data-editor, usalo; si no, no cambies el color
    const editor = nota.getAttribute('data-editor');
    if (editor) {
      nota.style.background = colorPorEditor(editor);
    }
  });
  // Actualizar colores de notas grupales
  document.querySelectorAll('#contenedor-notas-grupo .note-box').forEach(nota => {
    const editor = nota.getAttribute('data-editor');
    if (editor) {
      nota.style.background = colorPorEditor(editor);
    }
  });
};
});

function cargarNotasUsuario() {fetch('main.php?action=listar&id_grupo=0')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.notas)) {
        mostrarNotasDesdeBackend(data.notas);
      } else {
        console.error('No se pudieron cargar las notas:', data.message);
      }
    })
    .catch(err => console.error('Error al obtener notas:', err));
}

function cargarGruposUsuario() {  fetch('main.php?action=listar_grupos')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.grupos)) {
        mostrarGruposDesdeBackend(data.grupos);
      } else {
        console.error('No se pudieron cargar los grupos:', data.message);
      }
    })
    .catch(err => console.error('Error al obtener grupos:', err));
}
 
function colorPorEditor(editor) {
  // Genera un color pastel claro u oscuro según el modo
  let hash = 0;
  for (let i = 0; i < editor.length; i++) {
    hash = editor.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  // Detectar modo oscuro
  const dark = document.body.classList.contains('dark-mode');
  if (dark) {
    // Pastel oscuro (más saturado, menos luminoso)
    return `hsl(${h}, 40%, 22%)`;
  } else {
    // Pastel claro (como antes)
    return `hsl(${h}, 70%, 85%)`;
  }
}


function mostrarNotasDesdeBackend(notas, id_grupo = null) {
  // Selecciona el contenedor correcto según el contexto
  let contenedor;
  if (id_grupo !== null) {
    contenedor = document.getElementById('contenedor-notas-grupo');
  } else {
    contenedor = document.getElementById('contenedor-notas');
  }
  if (!contenedor) return;
  // Elimina notas existentes (excepto el add-box)
  contenedor.querySelectorAll('.note-box').forEach(nota => nota.remove());
  notas.slice().reverse().forEach(nota => {
    const nuevaNota = document.createElement('div');
    nuevaNota.classList.add('note-box');
    nuevaNota.setAttribute('data-uuid', nota.uuid);

    let fechaTexto = nota.fecha ? new Date(nota.fecha).toLocaleString() : '';
    let editor = (id_grupo !== null) ? nota.editor : null;

     // Asignar color si hay editor
    if (editor) {
    nuevaNota.setAttribute('data-editor', editor);
    nuevaNota.style.background = colorPorEditor(editor);
    }

    if(id_grupo != null){
     nuevaNota.innerHTML = `
      <h3 class="note-title">${nota.titulo}</h3>
      <p class="note-content">${nota.contenido.replace(/\n/g, '<br>')}</p>
      <div class="note-footer">
        <div class="perfil">
        <img src="images/descarga.svg" alt="Foto de perfil" class="foto-miembro" id="fotoPerfilNota">
        <span class="nombre-usuario">${editor}</span>
        </div>
        <span class="note-date">${fechaTexto}</span>
        <button class="delete-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#76448a" stroke-width="2">
            <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    `
    setTimeout(() => {
    fetch('main.php?accion=foto_editor&editor='+ encodeURIComponent(editor)
    )
     .then(res => res.json())
     .then(data => {
       if (data.success && data.foto) {
        const fotoPerfilNota = nuevaNota.querySelector('#fotoPerfilNota')
        if(fotoPerfilNota){
          fotoPerfilNota.src = data.foto;
        }
       }
         
     })
     .catch(err => console.error('Error al obtener la foto del editor:', err));
    }, 0)}
    else{nuevaNota.innerHTML = `<h3 class="note-title">${nota.titulo}</h3>
      <p class="note-content">${nota.contenido.replace(/\n/g, '<br>')}</p>
      <div class="note-footer">
        <span class="note-date">${fechaTexto}${editor ? ' - ' + editor : ''}</span>
        <button class="delete-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#76448a" stroke-width="2">
            <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    `};
    nuevaNota.querySelector('.delete-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      const uuid = nuevaNota.getAttribute('data-uuid');
      let body = `accion=eliminar&uuid=${encodeURIComponent(uuid)}`;
      if (id_grupo && id_grupo !== 0 && id_grupo !== '0') {
        body += `&id_grupo=${encodeURIComponent(id_grupo)}`;
      }
      fetch('main.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body 
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            nuevaNota.remove();
          } else {
            alert('Error al eliminar la nota: ' + data.message);
          }
        })
        .catch(() => alert('Error al conectar con el servidor.'));
    });
    // Click para ampliar nota individual o grupal
    nuevaNota.addEventListener('click', function (e) {
      if (!e.target.classList.contains('delete-btn')) {
        ampliarNota(nuevaNota);
      }
    });
    const cajaAgregar = contenedor.querySelector('.add-box');
    contenedor.insertBefore(nuevaNota, cajaAgregar.nextSibling);
  });
}

// Variable global para el id del grupo actualmente abierto
let grupoActivoId = null;
let nombreGrupoActivo = '';

function mostrarGruposDesdeBackend(grupos) {
  const contenedor = document.getElementById('contenedor-grupos');
  if (!contenedor) return;
  // Elimina grupos existentes (excepto el add-box)
  contenedor.querySelectorAll('.grupo-creado').forEach(grupo => grupo.remove());
  grupos.forEach(grupo => {
    const divGrupo = document.createElement('div');
    divGrupo.className = 'add-box grupo-creado';
    divGrupo.innerHTML = `
      <div class="icon"><svg width="200" height="200" viewBox="0 0 100 64" xmlns="http://www.w3.org/2000/svg" fill="none">
  <circle cx="35" cy="20" r="8" fill="#b388eb" />
  <path fill="#b388eb" d="M20 42c0-6 30-6 30 0v6H20v-6z" />
  <circle cx="65" cy="20" r="8" fill="#a29bfe" />
  <path fill="#a29bfe" d="M50 42c0-6 30-6 30 0v6H50v-6z" />
  <circle cx="50" cy="16" r="10" fill="#6c5ce7" />
  <path fill="#6c5ce7" d="M30 42c0-8 40-8 40 0v6H30v-6z" />
</svg>
</div>
      <p>${grupo.nombre}</p>
      
       <button class="delete-grupo-btn" title="Eliminar grupo">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#a00"  border="none" >
              <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a 1 1 0 0 1 1-1h4a 1 1 0 0 1 1 1v2" />
            </svg>
          </button>
    `;
    // Evento para abrir grupo SOLO si no se hace click en el botón eliminar
    divGrupo.addEventListener('click', function (e) {
      if (e.target.classList.contains('delete-grupo-btn')) return;
      mostrarVistaGrupo(grupo.nombre, grupo.id);
    });
    // Evento para eliminar grupo
    divGrupo.querySelector('.delete-grupo-btn').addEventListener('click', function (e) {
      e.stopPropagation();
      salirdeGrupo(grupo.id, divGrupo);
    });
    // Insertar después del add-box
    const cajaAgregar = contenedor.querySelector('.add-box');
    contenedor.insertBefore(divGrupo, cajaAgregar.nextSibling);
  });
}

function mostrarVistaGrupo(nombreGrupo, idGrupo) {
  document.getElementById('barra-secciones').style.display = 'none'; // OCULTA la barra
  document.getElementById('notas-grupales').style.display = 'none';
  document.getElementById('vista-grupo').style.display = 'block';
  document.getElementById('nombre-del-grupo').innerText = nombreGrupo;
  // Asegurarse de que el id sea un número entero
  grupoActivoId = parseInt(idGrupo, 10);
  nombreGrupoActivo = nombreGrupo;
  // Limpiar las notas previas del contenedor de grupo
  const contenedorGrupo = document.getElementById('contenedor-notas-grupo');
  if (contenedorGrupo) {
    contenedorGrupo.querySelectorAll('.note-box').forEach(nota => nota.remove());
  }
  fetch('main.php?action=listar&id_grupo=' + encodeURIComponent(grupoActivoId))
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.notas)) {
        mostrarNotasDesdeBackend(data.notas, grupoActivoId);
      } else {
        alert('No se pudieron cargar las notas del grupo.');
      }
    })
    .catch(() => alert('Error al obtener notas del grupo.'));
}



function agregarNotaAGrupo() {
  if (!grupoActivoId) return;
  const contenedor = document.getElementById('contenedor-notas-grupo');
  const nuevaNota = document.createElement('div');
  nuevaNota.classList.add('note-box');
  const uuid = generarUUID();
  nuevaNota.setAttribute('data-uuid', uuid);
  const fechaHora = new Date();
  const fechaHoraTexto = fechaHora.toLocaleString();
  nuevaNota.innerHTML = `
        <h3 class="note-title" contenteditable="true">Título de nota</h3>
        <p class="note-content" contenteditable="true">Texto grupal :)</p>
        <div class="note-footer">
        <div class="perfil">
          <img src="images/descarga.svg" alt="Foto de perfil" class="foto-miembro" id="fotoPerfil">
          <span class="nombre-usuario">Nueva Nota</span>
          </div>
          <span class="note-date">${fechaHoraTexto}</span>
          </div>
          <button class="delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#76448a" stroke-width="2">
              <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a 1 1 0 0 1 1-1h4a 1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        
    `;
  nuevaNota.querySelector('.delete-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    const uuid = nuevaNota.getAttribute('data-uuid');
    fetch('main.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `accion=eliminar&uuid=${encodeURIComponent(uuid)}&id_grupo=${encodeURIComponent(grupoActivoId)}`
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          nuevaNota.remove();
        } else {
          alert('Error al eliminar la nota grupal: ' + data.message);
        }
      })
      .catch(() => alert('Error al conectar con el servidor.'));
  });
  nuevaNota.addEventListener('click', function (e) {
    if (!e.target.classList.contains('delete-btn')) {
      ampliarNota(nuevaNota);
    }
  });
  const cajaAgregar = contenedor.querySelector('.add-box');
  contenedor.insertBefore(nuevaNota, cajaAgregar.nextSibling);
}

function ampliarNota(notaOriginal) {
  const overlay = document.createElement('div');
  overlay.className = 'overlay';
  const notaClonada = document.createElement('div');
  notaClonada.className = 'ampliada';
  const tituloOriginal = notaOriginal.querySelector('.note-title').innerText;
  const contenidoOriginal = notaOriginal.querySelector('.note-content').innerText;
  const titulo = document.createElement('h3');
  titulo.className = 'note-title';
  titulo.contentEditable = true;
  titulo.innerText = tituloOriginal;
  const contenido = document.createElement('p');
  contenido.className = 'note-content';
  contenido.contentEditable = true;
  contenido.innerText = contenidoOriginal;
  const notaUuid = notaOriginal.getAttribute('data-uuid');

    // Botón mover a grupos
  const gruposBtn = document.createElement('button');
  gruposBtn.className = 'nota-btn';
  gruposBtn.title = 'Mover a grupo';
  gruposBtn.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="1.7" viewBox="0 0 24 24">
  <circle cx="7" cy="10" r="3"/>
  <circle cx="17" cy="10" r="3"/>
  <path d="M2 20c0-2.5 3-4.5 5-4.5s5 2 5 4.5"/>
  <path d="M12 20c0-2.5 3-4.5 5-4.5s5 2 5 4.5"/>
</svg>
`;
 gruposBtn.onclick = () => {
  // Limpiar la lista antes de cargar
  const lista = document.getElementById('listaGruposMover');
  lista.innerHTML = '';

  // Traer los grupos 
  fetch('main.php?action=listar_grupos')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.grupos)) {
        data.grupos.forEach(grupo => {
          const li = document.createElement('li');
          li.className = 'miembros-item';
          li.style.display = 'flex';
          li.style.justifyContent = 'space-between';
          li.style.alignItems = 'center';

          const nombre = document.createElement('span');
          nombre.textContent = grupo.nombre;

          const btnMover = document.createElement('button');
          btnMover.textContent = 'Mover';
          btnMover.className = 'btn';
          btnMover.onclick = () => {
            fetch('main.php', {method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: `accion=mover_nota&uuid=${encodeURIComponent(notaOriginal.getAttribute('data-uuid'))}&id_grupo=${encodeURIComponent(grupo.id)}&nuevo_uuid=${encodeURIComponent(generarUUID())}`
            })
            .then(res => res.json()) 
          };

          li.appendChild(nombre);
          li.appendChild(btnMover);
          lista.appendChild(li);
        });
      } else {
        lista.innerHTML = '<li>No se pudieron cargar los grupos.</li>';
      }
    })
    .catch(() => {
      lista.innerHTML = '<li>Error al conectar con el servidor.</li>';
    });

  
  document.getElementById('modalMoverAGrupo').classList.remove('oculto');
};

  // Botón historial
  let historialBtn = null;
  if (grupoActivoId && !isNaN(grupoActivoId)) {
    historialBtn = document.createElement('button');
    historialBtn.className = 'nota-btn';
    historialBtn.title = 'Ver historial';
    historialBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg"  fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>`;
    historialBtn.onclick = () => {
      overlay.remove()
      mostrarHistorialNota(notaUuid);
    };
    
  }


  // Botón cerrar 
  const cerrarBtn = document.createElement('button');
  cerrarBtn.className = 'nota-btn';
  cerrarBtn.innerHTML = '✖';
  cerrarBtn.onclick = () => {
  const nuevoTitulo = titulo.innerText;
  const nuevoContenido = contenido.innerText;
  if (nuevoTitulo !== tituloOriginal || nuevoContenido !== contenidoOriginal) {
    // Mostrar mini modal de confirmación
    mostrarModalConfirmarGuardar({
      onGuardar: () => {
        notaOriginal.querySelector('.note-title').innerText = nuevoTitulo;
        notaOriginal.querySelector('.note-content').innerText = nuevoContenido;
        overlay.remove();
        let body = `accion=guardar_nota&uuid=${encodeURIComponent(notaUuid)}&titulo=${encodeURIComponent(nuevoTitulo)}&contenido=${encodeURIComponent(nuevoContenido)}`;
        if (grupoActivoId && !isNaN(grupoActivoId)) {
          body += `&id_grupo=${encodeURIComponent(grupoActivoId)}`;
        }
        fetch('main.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              if (data.uuid) {
                notaOriginal.setAttribute('data-uuid', data.uuid);
              }
              const fechaSpan = notaOriginal.querySelector('.note-date');
              if (fechaSpan) {
                const ahora = new Date();
                fechaSpan.textContent = ahora.toLocaleString();
              }
            } else {
              alert('Error: ' + data.message);
            }
          if(grupoActivoId && !isNaN(grupoActivoId)) {
            // Actualizar notas del grupo
            mostrarVistaGrupo(nombreGrupoActivo,grupoActivoId);
          }
          else {
            // Actualizar notas individuales
            cargarNotasUsuario();
          }
        }).catch(() => alert('Error al conectar con el servidor.'));
      },
      onDescartar: () => {
        overlay.remove();
      },
      onCancelar: () => {
        // No hacer nada, solo cerrar el mini modal
      }
    });
  } else {
    overlay.remove();
  }
};



  // Botón descargar 
  const descargarBtn = document.createElement('button');
  descargarBtn.className = 'nota-btn';
  descargarBtn.title = 'Descargar nota';
  descargarBtn.innerHTML = `<svg  fill="currentColor" viewBox="0 0 24 24"><path d="M12 16l4-5h-3V4h-2v7H8l4 5zm-8 2v2h16v-2H4z"/></svg>`;
  descargarBtn.onclick = () => {
    const texto = `Título: ${titulo.innerText}\n\n${contenido.innerText}`;
    const blob = new Blob([texto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (titulo.innerText.trim() || 'nota') + '.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  // Agregá los botones arriba de la nota
  const acciones = document.createElement('div');
  acciones.style.display = 'flex';
  acciones.style.justifyContent = 'flex-end';
  acciones.style.gap = '8px';
  acciones.appendChild(gruposBtn);
   if (historialBtn) acciones.appendChild(historialBtn);
  acciones.appendChild(descargarBtn);
  acciones.appendChild(cerrarBtn);

  notaClonada.appendChild(acciones);
  notaClonada.appendChild(titulo);
  notaClonada.appendChild(contenido);
  overlay.appendChild(notaClonada);
  document.body.appendChild(overlay);
}

// Mostrar historial de una nota en el modal
function mostrarHistorialNota(uuid) {
  fetch('main.php?action=historial_nota&uuid=' + encodeURIComponent(uuid))
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.historial)) {
        console.log(data.historial)
        const contenedor = document.getElementById('historialNotasContenedor');
        contenedor.innerHTML = '';
        data.historial.forEach(version => {
          const variante = document.createElement('div');
          variante.className = 'note-box';
          variante.uuid = uuid;
          variante.editor = version.editor;
          let fechaTexto =  version.fecha ? new Date(version.fecha).toLocaleString() : '';
          //let editor = version.editor ? `${version.editor}` : '';
          variante.fecha = version.fecha;
          variante.style.background = colorPorEditor(version.editor);
          variante.innerHTML = `
            <h3 class="note-title">${version.titulo}</h3>
            <p class="note-content">${version.contenido}</p>
            <div class="note-footer">
              <div class="perfil">
              <img src="images/descarga.svg" alt="Foto de perfil" class="foto-miembro" id="fotoPerfilNotaHist">
              <span class="nombre-usuario">${version.editor}</span>
              </div>
              <span class="note-date">${fechaTexto}</span>
              </div>
            </div>
          `
    setTimeout(() => {
    fetch('main.php?accion=foto_editor&editor='+ encodeURIComponent(version.editor)
    )
     .then(res => res.json())
     .then(data => {
      console.log(version.editor)
      console.log(data.foto)
       if (data.success && data.foto) {
        const fotoPerfilNotaHist = variante.querySelector('#fotoPerfilNotaHist')
        if(fotoPerfilNotaHist){
          fotoPerfilNotaHist.src = data.foto;
        }
       }
         
     })
     .catch(err => console.error('Error al obtener la foto del editor:', err));
    }, 0);
          contenedor.appendChild(variante);
          variante.addEventListener('click', function () {ampliarNotaVariante(variante);});
        });
        document.getElementById('modalHistorialNota').classList.remove('oculto');
      } else {
        alert('No hay historial disponible para esta nota.');
      }
    })
    .catch(() => alert('Error al obtener el historial de la nota.'));
    console.error('Error en fetch historial:', err);
}

function ampliarNotaVariante(variante){

    document.getElementById('modalHistorialNota').classList.add('oculto');
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    const notaClonada = document.createElement('div');
    notaClonada.className = 'ampliada';

    const tituloOriginal = variante.querySelector('.note-title').innerText;
    const contenidoOriginal = variante.querySelector('.note-content').innerText;

    const titulo = document.createElement('h3');
    titulo.className = 'note-title';
    titulo.contentEditable = false;
    titulo.innerText = tituloOriginal;

    const contenido = document.createElement('p');
    contenido.className = 'note-content';
    contenido.contentEditable = false;
    contenido.innerText = contenidoOriginal;

    // Botón cerrar
    const cerrarBtn = document.createElement('button');
    cerrarBtn.className = 'nota-btn';
    cerrarBtn.innerHTML = '✖';
    cerrarBtn.onclick = () => {
        overlay.remove();
         document.getElementById('modalHistorialNota').classList.remove('oculto');
    };

    // Botón volver a esta versión
    const volverBtn = document.createElement('button');
    volverBtn.className = 'nota-btn';
    volverBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor"  viewBox="0 0 24 24">
  <polyline points="1 4 1 10 7 10"/>
  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`;
    volverBtn.onclick = () => {
      overlay.remove();
    // Aquí deberías hacer el fetch para actualizar la nota original con los datos de esta versión
    // Por ejemplo, suponiendo que tienes el uuid de la nota original:
    fetch('main.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'accion=restaurar_version&uuid=' + encodeURIComponent(variante.uuid) +
              '&fecha=' + encodeURIComponent(variante.fecha) // Fecha de la versión
              
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            overlay.remove();
            document.getElementById('modalHistorialNota').classList.add('oculto');
            mostrarVistaGrupo(nombreGrupoActivo,grupoActivoId); // O refresca el grupo si es grupal
        } else {
            alert('No se pudo restaurar la versión: ' + (data.message || 'Error'));
        }
    })
    .catch(() => alert('Error al conectar con el servidor.'));
};

    // Opcional: fecha y editor
    const footer = variante.querySelector('.note-footer').cloneNode(true);

    // Armado
    const acciones = document.createElement('div');
    acciones.style.display = 'flex';
    acciones.style.justifyContent = 'flex-end';
    acciones.style.gap = '8px';
    acciones.appendChild(cerrarBtn);
    acciones.appendChild(volverBtn);

    notaClonada.appendChild(acciones);
    notaClonada.appendChild(titulo);
    notaClonada.appendChild(contenido);
    notaClonada.appendChild(footer);

    overlay.appendChild(notaClonada);
    document.body.appendChild(overlay);
}


function cerrarModalHistorialNota() {
  document.getElementById('modalHistorialNota').classList.add('oculto');
}

function generarUUID() {
  // Generador simple de UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function agregarNota() {
  const contenedor = document.getElementById('contenedor-notas');
  const nuevaNota = document.createElement('div'); //crea la nota nueva
  nuevaNota.classList.add('note-box');
  // Generar y asignar UUID
  const uuid = generarUUID();
  nuevaNota.setAttribute('data-uuid', uuid);

 //separo la fecha de la hora 
  const fechaHora = new Date();
  const fecha = fechaHora.toLocaleDateString();    // "10/6/2025"
  const hora = fechaHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // "14:35"

  const fechaHoraTexto = `${fecha}<br>${hora}`;

  //aca le dice al atributo nuevaNota que va a tener dentro lo siguiente
  nuevaNota.innerHTML = ` 
        <h3 class="note-title">Título de nota</h3>
        <p class="note-content">Agregar texto :)</p>
        <div class="note-footer">
          <span class="note-date">${fechaHoraTexto}</span>
          </div>
          <button class="delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#76448a" stroke-width="2">
        <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a 1 1 0 0 1 1-1h4a 1 1 0 0 1 1 1v2" />
        </svg>
            </button>
          
      `;

  //funcion para borrar nota
  nuevaNota.querySelector('.delete-btn').addEventListener('click', function (e) {
    e.stopPropagation(); // esto por ahora no anda, va a servir en un futuro para ampliar la nota y que no se rompa nada
    // Eliminar de la base de datos
    const uuid = nuevaNota.getAttribute('data-uuid');
    // Si la nota no tiene título ni contenido (nota vacía y no guardada)
    const titulo = nuevaNota.querySelector('.note-title').innerText.trim();
    const contenido = nuevaNota.querySelector('.note-content').innerText.trim();
    if ((!titulo || titulo === 'Título de nota') && (!contenido || contenido === 'Agregar texto :)')) {
      // Nota vacía, simplemente eliminar del DOM
      nuevaNota.remove();
      return;
    }
    if (uuid) {
      fetch('main.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `accion=eliminar&uuid=${encodeURIComponent(uuid)}`
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            nuevaNota.remove();
          } else {
            alert('Error al eliminar la nota: ' + data.message);
          }
        })
        .catch(() => alert('Error al conectar con el servidor.'));
    } else {
      nuevaNota.remove();
    }
  });

  nuevaNota.addEventListener('click', function (e) {
    if (!e.target.classList.contains('delete-btn')) {
      ampliarNota(nuevaNota);
    }
  });

  const cajaAgregar = contenedor.querySelector('.add-box');
  contenedor.insertBefore(nuevaNota, cajaAgregar.nextSibling); //agrega la nueva nota despues del boton agregar nueva nota
}                                                              //funciona raro igual

function inicializarPerfil() {
  // abrir selector de archivos cuando apretas el perfil
  const foto = document.getElementById('fotoPerfil');
  const fotoPerfilMenu = document.getElementById('fotoPerfilMenu');
  const input = document.getElementById('inputFoto');

  foto.addEventListener('click', () => input.click());

  input.addEventListener('change', () => {
     const file = input.files[0];
  if (file) {
    const formData = new FormData();
    formData.append('accion', 'guardar_foto');
    formData.append('foto', file);

    fetch('main.php', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.fotoPerfil) {
        foto.src = data.fotoPerfil; // Actualiza la imagen del perfil
        fotoPerfilMenu.src = data.fotoPerfil; // Actualiza la imagen del menú
        localStorage.setItem('fotoPerfil', data.fotoPerfil);
        localStorage.setItem('fotoPerfilMenu', data.fotoPerfil); 
      } else {
        alert('Error al guardar la foto: ' + data.message);
      }
    })
    .catch(() => {
      alert('Error al conectar con el servidor.');
    });
  }
  });

  // cargar imagen de perfil desde el backend, en caso de error, cargar imagen guardada o imagen por defecto.
  fetch('main.php?action=obtener_foto')
  .then(res => res.json())
  .then(data => {
    if (data.success && data.foto && data.foto !== '') {
      foto.src = data.foto;
      fotoPerfilMenu.src = data.foto
      localStorage.setItem('fotoPerfil', data.foto);
    } else {
      const guardada = localStorage.getItem('fotoPerfil');
      const guardadaMenu = localStorage.getItem('fotoPerfilMenu');
      if (guardada) {
        foto.src = guardada;
        fotoPerfilMenu.src = guardadaMenu;
      } else {
        foto.src = 'images/descarga.svg'; // Imagen por defecto si no hay foto guardada
      }
    }
  })
  .catch(() => {
    const guardada = localStorage.getItem('fotoPerfil');
    if (guardada) {
      foto.src = guardada;
    } else {
      foto.src = 'images/descarga.svg'; // Imagen por defecto si no hay foto guardada
    }
  });
  
  // boton volver atras
  document.getElementById('btnVolver').addEventListener('click', () => {
    window.location.href = 'main.php';
  });
}
document.addEventListener('DOMContentLoaded', () => {
  inicializarPerfil();
});

const btnMenu = document.getElementById('btnMenu');
const menu = document.getElementById('menu');

btnMenu.addEventListener('click', () => {
  menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
});

function mostrarSeccion(seccion) {
  const individuales = document.getElementById('notas-individuales');
  const grupales = document.getElementById('notas-grupales');
  const btnInd = document.getElementById('btn-individual');
  const btnGrp = document.getElementById('btn-grupal');

  if (seccion === 'individual') {
    individuales.style.display = 'block';
    grupales.style.display = 'none';
    btnInd.classList.add('activo');
    btnGrp.classList.remove('activo');
  } else {
    cargarGruposUsuario(); // Cargar grupos al cambiar a la sección grupal
    individuales.style.display = 'none';
    grupales.style.display = 'block';
    btnGrp.classList.add('activo');
    btnInd.classList.remove('activo');
  }
}

function agregargrupo() {
  const modal = document.getElementById('modalGrupo');
  const input = document.getElementById('nombreGrupoInput');
  modal.style.display = 'flex';
  input.value = '';
  input.focus();
}

document.getElementById('btnCrearGrupo').addEventListener('click', (e) => {
  e.preventDefault();
  const nombre = document.getElementById('nombreGrupoInput').value.trim();
  const contenedor = document.getElementById('contenedor-grupos');
  if (nombre === '') {
    alert('Por favor, ingresa un nombre');
    return;
  }
  // Crear grupo en el backend y usar el id real
  fetch('main.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'accion=crear_grupo&nombre_grupo=' + encodeURIComponent(nombre)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.id_grupo) {
        mostrarVistaGrupo(nombre, data.id_grupo);
      } else {
        alert('Error al crear el grupo: ' + (data.message || 'Error desconocido'));
      }
    })
    .catch(() => alert('Error al conectar con el servidor.'));
  // Cerrar modal
  document.getElementById('modalGrupo').style.display = 'none';
});

// Cerrar el modal al hacer clic fuera del contenido
window.addEventListener('click', (e) => {
  if (e.target.id === 'modalGrupo') {
    document.getElementById('modalGrupo').style.display = 'none';
  }
});

function volverAGrupos() {
  grupoActivoId = null; // Resetear el grupo activo
  nombreGrupoActivo = ''; // Resetear el nombre del grupo activo
  document.getElementById('vista-grupo').style.display = 'none';
  document.getElementById('notas-grupales').style.display = 'block';
  document.getElementById('barra-secciones').style.display = 'flex'; // MUESTRA la barra
  cargarGruposUsuario();
}

// Mostrar el modal perfil
function abrirModalPerfil() {
  document.getElementById('modalPerfil').classList.remove('oculto');
}

// Cerrar el modal perfil
function cerrarModalPerfil() {
  document.getElementById('modalPerfil').classList.add('oculto');
}

// Click en la imagen para cambiarla
document.addEventListener('DOMContentLoaded', function () {
  const foto = document.getElementById('fotoPerfil');
  const input = document.getElementById('inputFoto');

  if (foto && input) {
    foto.addEventListener('click', () => input.click());

    input.addEventListener('change', function () {
      const archivo = this.files[0];
      if (archivo) {
        const lector = new FileReader();
        lector.onload = function (e) {
          foto.src = e.target.result;
        };
        lector.readAsDataURL(archivo);
      }
    });
  }
//Funcion para que se guarde el nuevo nombre en la BDD cuando se deja de editar
  const nombrePerfil = document.getElementById('nombrePerfil');
  if (nombrePerfil) {
    nombrePerfil.addEventListener('blur', function () {
      // Solo el texto, sin el SVG
      const nuevoNombre = nombrePerfil.childNodes[0].nodeValue.trim();
      if (nuevoNombre.length > 0) {
        fetch('main.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'accion=actualizar_nombre&nuevo_nombre=' + encodeURIComponent(nuevoNombre)
        })
        .then(res => res.json())
        .then(data => {
          if (!data.success) {
            alert('Error al actualizar el nombre: ' + data.message);
          }
        })
        .catch(() => alert('Error al conectar con el servidor.'));
      }
    });
  }
});

function agregarAmigoAGrupo() {
  document.getElementById('modalAgregarAmigo').classList.remove('oculto');
}

function cerrarModalAgregarAmigo() {
  document.getElementById('modalAgregarAmigo').classList.add('oculto');
}

function buscarUsuario() {
  const input = document.getElementById('buscadorUsuario').value.trim();
  const mensaje = document.getElementById('mensajeBusqueda');

  if (input === '') {
    mensaje.textContent = 'Ingresá un nombre de usuario.';
  } else {
    fetch('main.php', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: 'accion=buscar_usuario&nombre=' + encodeURIComponent(input) + '&id_grupo=' + encodeURIComponent(grupoActivoId)
    })
      .then(res => res.json())
      .then(data => {
        // Mostrar el mensaje del backend
        alert(data.message); // O puedes mostrarlo en el DOM, como prefieras
        // Mostrar el campo debug SIEMPRE en la consola para depuración
        if (data.debug) {
          console.log('[DEBUG invitación]:', data.debug);
        }
        if (data.success) {
          alert('Notificación enviada'); // Lógica adicional si fue exitoso
        } else {
          alert('Error en la notificación'); // Lógica si hubo error
        }
      })
      .catch(err => {
        console.error('Error al conectar con el servidor:', err);
      });
  }
}

cargarNotificaciones();

function toggleNotificaciones(e) {
  if (e) e.stopPropagation();
    const menu = document.getElementById('menu');
  if (menu && menu.style.display === 'block') {
    menu.style.display = 'none';
  }
  const bandeja = document.getElementById('bandejaNotificaciones');
  bandeja.classList.toggle('oculto');
  cargarNotificaciones(); // Cargar notificaciones al abrir la bandeja
}

function agregarNotificacion(mensaje, id, idGrupo) {
  const bandeja = document.getElementById("bandejaNotificaciones");
  const listaNotificaciones = document.getElementById('listaNotificaciones');

  // Crear notificación
  const noti = document.createElement("div");
  noti.className = "notificacion";

  const texto = document.createElement("p");
  texto.innerHTML = mensaje;

  const acciones = document.createElement("div");
  acciones.className = "acciones-notificacion";

  const aceptar = document.createElement("span");
  aceptar.className = "aceptar";
  aceptar.innerText = "✔️";
  aceptar.onclick = () => {
    noti.remove();
    fetch('main.php?action=agregar_miembro&id_grupo='+ encodeURIComponent(idGrupo))
    .then(res => res.json())
    .then(data => {
      if (data.success) { "Agregado a grupo exitosamente" }
      else { "error al agregar a grupo"}
    })
    .catch(err => console.error("Error al conectar con el servidor:", err));
    eliminarNotificacion(id);
    verificarNotificacionesVacias();
  };


  const eliminar = document.createElement("span");
  eliminar.className = "eliminar";
  eliminar.innerText = "❌";
  eliminar.onclick = () => {
    noti.remove();
    eliminarNotificacion(id);
    verificarNotificacionesVacias();
  };

  acciones.appendChild(aceptar);
  acciones.appendChild(eliminar);

  noti.appendChild(texto);
  noti.appendChild(acciones);

  bandeja.appendChild(noti);
}

//Funcion para eliminar la notificacion
function eliminarNotificacion(id) {
  fetch('main.php?action=eliminar_notificacion&id='+ encodeURIComponent(id) )
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log("Notificación eliminada");
      } else {
        console.error("Error al eliminar la notificación:", data.message);
      }
    })
    .catch(err => console.error("Error al conectar con el servidor:", err));
  }

function cargarNotificaciones() {
  const listaNotificaciones = document.getElementById('listaNotificaciones');
  if (listaNotificaciones) {
    listaNotificaciones.innerHTML = '';
  }
  // Limpiar también todas las notificaciones visuales previas
  const bandeja = document.getElementById('bandejaNotificaciones');
  if (bandeja) {
    bandeja.querySelectorAll('.notificacion').forEach(noti => noti.remove());
  }
  fetch('main.php?action=cargar_notificaciones')
    .then(res => res.json())
    .then(data => {
      if (data.success && Array.isArray(data.notificaciones)) {
        data.notificaciones.forEach(notificacion => {
          agregarNotificacion(notificacion.contenido, notificacion.id, notificacion.idGrupo);
        });
       // Mostrar el puntito si hay notificaciones
        const notiDot = document.getElementById('noti-dot');
        if (notiDot) {
          notiDot.style.display = data.notificaciones.length > 0 ? 'block' : 'none';
        }
      } else {
        // Ocultar el puntito si no hay notificaciones
        const notiDot = document.getElementById('noti-dot');
        if (notiDot) notiDot.style.display = 'none';
        console.error('No se pudieron cargar las notificaciones:', data.message);
      }
    })
    .catch(err => {
      // Ocultar el puntito si hay error
      const notiDot = document.getElementById('noti-dot');
      if (notiDot) notiDot.style.display = 'none';
      console.error('Error al obtener notificaciones:', err);
    });
}


function verificarNotificacionesVacias() {
  const bandeja = document.getElementById("bandejaNotificaciones");
  const mensajeDefault = document.getElementById("mensajeNotificacion");

  // Si no hay más notificaciones visibles
  const notificaciones = bandeja.querySelectorAll(".notificacion");
  if (listaNotificaciones.children.length === 0) {
  listaNotificaciones.innerHTML = '<li>Sin notificaciones</li>';
}
}

function salirdeGrupo(idGrupo, elementoGrupo) {
  if (!confirm('¿Seguro que quieres salir de este grupo?')) return;
  fetch('main.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'accion=abandonar_grupo&id_grupo=' + encodeURIComponent(idGrupo)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        elementoGrupo.remove();
      } else {
        alert('Error al eliminar el grupo: ' + (data.message || 'Error desconocido'));
      }
    })
    .catch(() => alert('Error al conectar con el servidor.'));
}

// Cerrar menú hamburguesa y bandeja de notificaciones al hacer clic fuera de ellos
document.addEventListener('click', function(e) {
  // Cerrar menú hamburguesa
  const menu = document.getElementById('menu');
  const btnMenu = document.getElementById('btnMenu');
  if (menu && btnMenu) {
    if (
      menu.style.display === 'block' &&
      !menu.contains(e.target) &&
      e.target !== btnMenu
    ) {
      menu.style.display = 'none';
    }
  }

  // Cerrar bandeja de notificaciones
  const bandeja = document.getElementById('bandejaNotificaciones');
  const btnNoti = document.getElementById('notificacionesBtn');
  if (bandeja && btnNoti) {
    if (
      !bandeja.classList.contains('oculto') &&
      !bandeja.contains(e.target) &&
      e.target !== btnNoti
    ) {
      bandeja.classList.add('oculto');
    }
  }
});

function mostrarMiembrosGrupo() {
  // Pedir miembros al backend
  fetch('main.php?action=miembros_grupo&id_grupo=' + encodeURIComponent(grupoActivoId))
    .then(res => res.json())
    .then(data => {
      const lista = document.getElementById('listaMiembrosGrupo');
      lista.innerHTML = '';
      lista.className = 'listaMiembrosGrupo';
      console.log('Respuesta del servidor:', data);
     if (data.success && Array.isArray(data.miembros)) {
        data.miembros.forEach(miembro => {
          const li = document.createElement('li');
          li.className ='miembros-item';
          

          // Nombre del miembro
          const nombreSpan = document.createElement('span');
          nombreSpan.className = 'miembro-email';
          nombreSpan.textContent = miembro.usuario;
          nombreSpan.title = miembro.usuario;
          // Botón expulsar
          const btnExpulsar = document.createElement('button');
          btnExpulsar.textContent = 'Expulsar';
          btnExpulsar.className = 'btn';
          btnExpulsar.onclick = function() {
            // Acá después ponés la lógica para expulsar
            if (!confirm('¿Seguro que quieres expulsar este miembro?')) return;
            fetch('main.php?action=expulsar_miembro&id_grupo=' + encodeURIComponent(grupoActivoId) + '&miembro=' + encodeURIComponent(miembro.correo))
              .then(res => res.json())
              .then(data => {
                if (data.success) {
                  li.remove(); // Elimina el elemento de la lista
                } else {
                  alert('Error al expulsar al miembro: ' + (data.message || 'Error desconocido'));
                }
              })
              .catch(() => alert('Error al conectar con el servidor.'));

          };

          li.appendChild(nombreSpan);
          li.appendChild(btnExpulsar);
          lista.appendChild(li);
        });
      } else {
        lista.innerHTML = '<li>No se pudieron cargar los miembros.</li>';
      }
      document.getElementById('modalMiembrosGrupo').classList.remove('oculto');
    })
    .catch(() => {
      const lista = document.getElementById('listaMiembrosGrupo');
      lista.innerHTML = '<li>Error al conectar con el servidor.</li>';
      document.getElementById('modalMiembrosGrupo').classList.remove('oculto');
    });
}

function cerrarModalMiembrosGrupo() {
  document.getElementById('modalMiembrosGrupo').classList.add('oculto');
}

function cerrarModalGruposNota() {
  document.getElementById('modalMoverAGrupo').classList.add('oculto');
}

// Cerrar modales al hacer clic fuera de ellos
window.addEventListener('click', function(e) {
  // Modal Miembros Grupo
  const modalMiembros = document.getElementById('modalMiembrosGrupo');
  if (modalMiembros && !modalMiembros.classList.contains('oculto')) {
    if (e.target === modalMiembros) {
      cerrarModalMiembrosGrupo();
    }
  }

  // Modal Agregar Amigo
  const modalAgregar = document.getElementById('modalAgregarAmigo');
  if (modalAgregar && !modalAgregar.classList.contains('oculto')) {
    if (e.target === modalAgregar) {
      cerrarModalAgregarAmigo();
    }
  }

  // Modal Historial Nota
  const modalHistorial = document.getElementById('modalHistorialNota');
  if (modalHistorial && !modalHistorial.classList.contains('oculto')) {
    if (e.target === modalHistorial) {
      cerrarModalHistorialNota();
    }
  }

  // Modal mover a grupo
  const modalmovergrupo = document.getElementById('modalMoverAGrupo');
  if (
    modalmovergrupo &&
    !modalmovergrupo.classList.contains('oculto') &&
    e.target === modalmovergrupo
  ) {
    cerrarModalGruposNota();
  }
});

function mostrarModalConfirmarGuardar({ onGuardar, onDescartar, onCancelar }) {
  const modal = document.getElementById('modalConfirmarGuardar');
  modal.classList.remove('oculto');
  // Limpiar handlers previos
  const btnGuardar = document.getElementById('btnGuardarCambios');
  const btnDescartar = document.getElementById('btnDescartarCambios');
  const btnCancelar = document.getElementById('btnCancelarCerrar');

  // Remover listeners previos
  btnGuardar.onclick = null;
  btnDescartar.onclick = null;
  btnCancelar.onclick = null;

  btnGuardar.onclick = () => {
    modal.classList.add('oculto');
    if (onGuardar) onGuardar();
  };
  btnDescartar.onclick = () => {
    modal.classList.add('oculto');
    if (onDescartar) onDescartar();
  };
  btnCancelar.onclick = () => {
    modal.classList.add('oculto');
    if (onCancelar) onCancelar();
  };
}
