//warehouse.js
const socket = new WebSocket('ws://localhost:8080');
let rowCount = 1; // Contador para filas
let isSending = false; // Estado para evitar envíos duplicados

document.addEventListener('DOMContentLoaded', () => {
    const orderForm = document.getElementById('orderForm');
    socket.addEventListener('open', () => {
        console.log('Conectado al servidor WebSocket');
    });

    socket.addEventListener('error', (error) => {
        console.error('Error en WebSocket:', error);
        Swal.fire({
            title: 'Error',
            text: 'No se pudo conectar al servidor. Intente más tarde.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    });

    document.getElementById('inputContainer').addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('remove-row-button')) {
            const button = e.target.closest('.remove-row-button');
            if (button) {
                const rowId = button.getAttribute('data-row-id');
                const row = document.getElementById(`row-${rowId}`);
                if (row) {
                    row.remove();
                }
            }
        }
    });

});

// Update the validateForm function
async function validateForm() {
    const rows = document.querySelectorAll('#inputContainer .row');
    let isValid = true;

    for (let row of rows) {
        const fecha = row.querySelector('input[type="date"]').value;
        const numeroPedido = row.querySelector('input[id^="numeroPedido"]').value;
        const producto = row.querySelector('input[id^="producto"]').value;
        const presentacion = row.querySelector('input[id^="presentacion"]').value;
        const cantidad = row.querySelector('input[id^="cantidad"]').value;

        if (!fecha || !numeroPedido.trim() || !producto.trim() || !presentacion.trim() || !cantidad) {
            isValid = false;
            break;
        }

        // Add any additional validation rules here
    }

    if (!isValid) {
        Swal.fire('Error', 'Todos los campos son obligatorios en todas las filas.', 'error');
    }

    return isValid;
}

// Función para enviar órdenes
// Update the sendOrders function
async function sendOrders() {
    const rows = document.querySelectorAll('#inputContainer .row');
    const orders = Array.from(rows).map(row => {
        const fecha = row.querySelector('input[type="date"]').value;
        const numeroPedido = row.querySelector('input[id^="numeroPedido"]').value;
        const producto = row.querySelector('input[id^="producto"]').value;
        const presentacion = row.querySelector('input[id^="presentacion"]').value;
        const cantidad = row.querySelector('input[id^="cantidad"]').value;

        return {
            fecha: fecha,
            numeroPedido: numeroPedido,
            producto: producto,
            presentacion: presentacion,
            cantidad: parseInt(cantidad)
        };
    });

    try {
        for (let order of orders) {
            await sendOrder(order);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        Swal.fire({
            title: 'Éxito',
            text: 'Órdenes enviadas a producción.',
            icon: 'success',
            confirmButtonText: 'Aceptar'
        }).then(() => {
            document.getElementById('orderForm').reset();
        });
    } catch (error) {
        console.error('Error al enviar órdenes:', error);
        Swal.fire({
            title: 'Error',
            text: 'Hubo un problema al enviar las órdenes.',
            icon: 'error',
            confirmButtonText: 'Aceptar'
        });
    }
}

// Función para enviar una sola orden
function sendOrder(order) {
    return new Promise((resolve, reject) => {
        // Verifica si el WebSocket está listo para enviar datos
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(order));
            console.log('Orden enviada:', order);
            resolve();
        } else {
            // Maneja el caso en el que el WebSocket no está abierto
            console.error('WebSocket no está abierto. No se puede enviar la orden:', order);
            reject('WebSocket no está abierto');
        }
    });
}

// Maneja la reconexión automática en caso de que el WebSocket se cierre
socket.addEventListener('close', () => {
    console.log('WebSocket cerrado. Intentando reconectar...');
    // Aquí podrías implementar la lógica para volver a intentar la conexión
    // Por ejemplo, usando un intervalo para intentar reconectar
});

// Maneja los errores de conexión del WebSocket
socket.addEventListener('error', (error) => {
    console.error('Error en WebSocket:', error);
    // Aquí podrías implementar la lógica para manejar los errores de conexión
});
