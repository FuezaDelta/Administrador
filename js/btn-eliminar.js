// document.getElementById('btnEliminar').addEventListener('click', function () {
//     const cedula = document.getElementById('cedula').value.trim();

//     if (cedula === '') {
//         alert('Por favor ingresa una cédula para eliminar.');
//         return;
//     }

//     if (confirm('¿Estás seguro que deseas eliminar este cliente?')) {
//         // Asumiendo que usas Firebase Database y tienes una referencia lista como "database"
//         const clienteRef = ref(database, 'clientes/' + cedula);

//         remove(clienteRef)
//             .then(() => {
//                 alert('Cliente eliminado correctamente.');
//                 document.getElementById('formulario').reset(); // O resetea campos manualmente si quieres
//             })
//             .catch((error) => {
//                 console.error('Error eliminando el cliente:', error);
//                 alert('Ocurrió un error al eliminar el cliente.');
//             });
//     }
// });

