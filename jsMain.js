//libreria sortable es para mover las notas si encontras una forma mejor cambialo
document.addEventListener("DOMContentLoaded", () => {
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
    fetch('main.php?action=listar')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.notas)) {
          mostrarNotasDesdeBackend(data.notas);
        } else {
          console.error('No se pudieron cargar las notas:', data.message);
        }
      })
      .catch(err => console.error('Error al obtener notas:', err));
});

function mostrarNotasDesdeBackend(notas) {
    const contenedor = document.getElementById('contenedor-notas');
    if (!contenedor) return;
    // Elimina notas existentes (excepto el add-box)
    contenedor.querySelectorAll('.note-box').forEach(nota => nota.remove());
    notas.forEach(nota => {
        const nuevaNota = document.createElement('div');
        nuevaNota.classList.add('note-box');
        nuevaNota.setAttribute('data-uuid', nota.uuid);
        // Solo una columna de fecha
        let fechaTexto = nota.fecha ? new Date(nota.fecha).toLocaleString() : '';
        nuevaNota.innerHTML = `
            <h3 class="note-title">${nota.titulo}</h3>
            <p class="note-content">${nota.contenido}</p>
            <div class="note-footer">
              <span class="note-date">${fechaTexto}</span>
              <button class="delete-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#76448a" stroke-width="2">
            <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
              </button>
            </div>
        `;
        nuevaNota.querySelector('.delete-btn').addEventListener('click', function (e) {
            e.stopPropagation();
            // Eliminar de la base de datos
            const uuid = nuevaNota.getAttribute('data-uuid');
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
        const cajaAgregar = contenedor.querySelector('.add-box');
        contenedor.insertBefore(nuevaNota, cajaAgregar.nextSibling);
    });
}

function generarUUID() {
    // Generador simple de UUID v4
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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

    const fechaHora = new Date();
    const fechaHoraTexto = fechaHora.toLocaleString();

    //aca le dice al atributo nuevaNota que va a tener dentro lo siguiente
    nuevaNota.innerHTML = ` 
        <h3 class="note-title">Título de nota</h3>
        <p class="note-content">Agregar texto :)</p>
        <div class="note-footer">
          <span class="note-date">${fechaHoraTexto}</span>
          <button class="delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#76448a" stroke-width="2">
        <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
            </button>
          </div>
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

    const cajaAgregar = contenedor.querySelector('.add-box');
    contenedor.insertBefore(nuevaNota, cajaAgregar.nextSibling); //agrega la nueva nota despues del boton agregar nueva nota
}                                                              //funciona raro igual

// detecta el click y abre la nota
document.addEventListener('click', function (e) {
    const nota = e.target.closest('.note-box');
    if (nota && !e.target.classList.contains('delete-btn')) {
        ampliarNota(nota);
    }
});

function ampliarNota(notaOriginal) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    // mejor en lugar de clonar la nota hago una copia visual
    const notaClonada = document.createElement('div');
    notaClonada.className = 'ampliada';

    // agarro lo original
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

    // Obtener uuid de la nota si existe
    const notaUuid = notaOriginal.getAttribute('data-uuid');

    // el boton de cerrar pero tmb guarda cambios
    const cerrarBtn = document.createElement('button');
    cerrarBtn.className = 'cerrar-btn';
    cerrarBtn.innerHTML = '✖';
    cerrarBtn.onclick = () => {
        // guardar cambios en la original
        const nuevoTitulo = titulo.innerText;
        const nuevoContenido = contenido.innerText;
        notaOriginal.querySelector('.note-title').innerText = nuevoTitulo;
        notaOriginal.querySelector('.note-content').innerText = nuevoContenido;
        overlay.remove();
        // Enviar los datos al backend, incluyendo uuid si existe
        let body = `titulo=${encodeURIComponent(nuevoTitulo)}&contenido=${encodeURIComponent(nuevoContenido)}`;
        if (notaUuid) {
            body += `&uuid=${encodeURIComponent(notaUuid)}`;
        }
        fetch('main.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log('Nota guardada correctamente');
                // Si el backend devuelve el uuid, actualizar el data-uuid
                if (data.uuid) {
                    notaOriginal.setAttribute('data-uuid', data.uuid);
                }
                // Actualizar la fecha local en la nota
                const fechaSpan = notaOriginal.querySelector('.note-date');
                if (fechaSpan) {
                    const ahora = new Date();
                    fechaSpan.textContent = ahora.toLocaleString();
                }
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(() => alert('Error al conectar con el servidor.'));
    };

    // agregar todo
    notaClonada.appendChild(cerrarBtn);
    notaClonada.appendChild(titulo);
    notaClonada.appendChild(contenido);
    overlay.appendChild(notaClonada);
    document.body.appendChild(overlay);

    
}

function inicializarPerfil() {
// abrir selector de archivos cuando apretas el perfil
const foto = document.getElementById('fotoPerfil');
const input = document.getElementById('inputFoto');

foto.addEventListener('click', () => input.click());

input.addEventListener('change', () => {
  const file = input.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = e => {
      foto.src = e.target.result;
      // guarda en localstorage para mantenerlo al recargar:
      localStorage.setItem('fotoPerfil', e.target.result);
    };
    reader.readAsDataURL(file);
  }
});

// por si ya hay una imagen guardada
const guardada = localStorage.getItem('fotoPerfil');
if (guardada) {
  foto.src = guardada;
}

  // boton volver atras
  document.getElementById('btnVolver').addEventListener('click', () => {
    window.location.href = 'main.html';
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
    individuales.style.display = 'none';
    grupales.style.display = 'block';
    btnGrp.classList.add('activo');
    btnInd.classList.remove('activo');
  }
}

function agregargrupo() {
  const modal = document.getElementById('modal');
  const input = document.getElementById('nombreGrupoInput');
  modal.style.display = 'flex';
  input.value = '';
  input.focus();
}

document.getElementById('btnCrearGrupo').addEventListener('click', () => {
  const nombre = document.getElementById('nombreGrupoInput').value.trim();
  const contenedor = document.getElementById('contenedor-grupos');
  if (nombre === '') {
    alert('Por favor, ingresa un nombre');
    return;
  }
//crear grupo
  const grupo = document.createElement('div');
  grupo.className = 'add-box grupo-creado';
  grupo.onclick = () => {
    mostrarVistaGrupo(nombre);
  };
  grupo.innerHTML = `
  <div class="icon">📁</div>
  <p>${nombre}</p>
`;
  contenedor.appendChild(grupo);


  // Cerrar modal
  document.getElementById('modal').style.display = 'none';

});

// Cerrar el modal al hacer clic fuera del contenido
window.addEventListener('click', (e) => {
  if (e.target.id === 'modal') {
    document.getElementById('modal').style.display = 'none';
  }
});

function mostrarVistaGrupo(nombreGrupo) {
  // ocultar otras secciones
  document.getElementById('notas-grupales').style.display = 'none';
  document.getElementById('vista-grupo').style.display = 'block';

  // mostrar el nombre del grupo
  document.getElementById('nombre-del-grupo').innerText = nombreGrupo;
}

function volverAGrupos() {
  document.getElementById('vista-grupo').style.display = 'none';
  document.getElementById('notas-grupales').style.display = 'block';
}

function agregarNotaAGrupo() {
  const contenedor = document.getElementById('contenedor-notas-grupo');
  const nuevaNota = document.createElement('div');
  nuevaNota.classList.add('note-box');

  const fechaHora = new Date();
  const fechaHoraTexto = fechaHora.toLocaleString();

  nuevaNota.innerHTML = `
        <h3 class="note-title">Título de nota</h3>
        <p class="note-content">Texto grupal :)</p>
        <div class="note-footer">
          <span class="note-date">${fechaHoraTexto}</span>
          <button class="delete-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#76448a" stroke-width="2">
              <path d="M3 6h18M5 6l1 16h12l1-16H5z" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
    `;

  nuevaNota.querySelector('.delete-btn').addEventListener('click', function (e) {
    e.stopPropagation();
    nuevaNota.remove();
  });

  contenedor.appendChild(nuevaNota);
}
