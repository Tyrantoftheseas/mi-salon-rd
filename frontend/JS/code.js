// Prioridad 1
(function () {

  //  Datos simulados (mock) — luego se reemplazan por fetch al backend
  const clientes = [
 { id: '1', nombre: 'Miguel Rosa', telefono: '809-555-1001' },
 { id: '2', nombre: 'Carlos Sosa', telefono: '829-222-9944' },
 { id: '3', nombre: 'Alan Javier', telefono: '849-300-7788' },
 { id: '4', nombre: 'Rosario Antonio', telefono: '809-111-2233' },
 { id: '5', nombre: 'Michell Asa', telefono: '829-555-6677' },
 { id: '6', nombre: 'Diego Ricardo', telefono: '849-444-1212' },
 { id: '7', nombre: 'Marta Castillo', telefono: '809-123-4567' },
 { id: '8', nombre: 'Elena Cruz', telefono: '829-765-4321' }
  ];

   //  Referencias al DOM (campo de cliente y lista de sugerencias)
   const input = document.getElementById('cliente-input');
  const lista = document.getElementById('cliente-sugerencias');

  // Si no existen esos elementos, termina el script
  if (!input || !lista) return;

  //  Escuchar cuando el usuario escribe
  input.addEventListener('input', (evento) => {
    const texto = evento.target.value.trim(); // texto ingresado

    // Si el campo esta vacio, limpiar la lista
     if (texto === '') {
      lista.innerHTML = '';
      return;
    }

     //  Buscar coincidencias por nombre o telefono
    const resultados = clientes.filter(cliente => 
      cliente.nombre.toLowerCase().includes(texto.toLowerCase()) ||
      cliente.telefono.includes(texto)
    );

    //  Limpiar lista antes de mostrar nuevos resultados
    lista.innerHTML = '';

    //  Crear y mostrar elementos <li> con los resultados
    resultados.forEach(cliente => {
      const item = document.createElement('li');
      item.textContent = `${cliente.nombre} (${cliente.telefono})`;
      lista.appendChild(item);

      //  Al hacer clic, llenar el input y guardar el id del cliente
      item.addEventListener('click', () => {
        input.value = `${cliente.nombre} (${cliente.telefono})`;
        input.dataset.clienteId = cliente.id; // guarda id para otras HU
        lista.innerHTML = ''; // limpiar sugerencias
      });
    });

    //  Si no hay coincidencias, mostrar mensaje
    if (resultados.length === 0) {
      lista.innerHTML = '<li>Sin resultados</li>';
    }
  });

})();