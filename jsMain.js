function agregarNota() {
  const contenedor = document.getElementById('contenedor-notas');
  const nuevaNota = document.createElement('div'); //crea la nota nueva
  nuevaNota.classList.add('note-box');
  //aca le dice al atributo nuevaNota que va a tener dentro lo siguiente
  nuevaNota.innerHTML = ` 
      <button class="delete-btn">🗑</button>
      <h3 class="note-title">Titulo de nota</h3>
      <p class="note-content">agregar texto :)</p>
    `;

  //funcion para borrar nota
  nuevaNota.querySelector('.delete-btn').addEventListener('click', function (e) {
    e.stopPropagation(); // esto por ahora no anda, va a servir en un futuro para ampliar la nota y que no se rompa nada
    nuevaNota.remove();
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

  // el boton de cerrar pero tmb guarda cambios
  const cerrarBtn = document.createElement('button');
  cerrarBtn.className = 'cerrar-btn';
  cerrarBtn.innerHTML = '✖';
  cerrarBtn.onclick = () => {
    // guardar cambios en la original
    notaOriginal.querySelector('.note-title').innerText = titulo.innerText;
    notaOriginal.querySelector('.note-content').innerText = contenido.innerText;
    overlay.remove();
  };

  // agregar todo
  notaClonada.appendChild(cerrarBtn);
  notaClonada.appendChild(titulo);
  notaClonada.appendChild(contenido);
  overlay.appendChild(notaClonada);
  document.body.appendChild(overlay);
}
