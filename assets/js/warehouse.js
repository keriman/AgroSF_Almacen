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

async function validateForm() {
    const rows = document.querySelectorAll('#inputContainer .row');
    let isValid = true;

    for (let row of rows) {
        const quantity = row.querySelector('select').value;
        const product = row.querySelector('input[id^="product"]').value;
        const status = row.querySelector('select[id^="status"]').value;

        if (!quantity || !product.trim() || !status.trim()) {
            isValid = false;
            break;
        }

        if (!/^[a-zA-Z0-9\s\-()]+$/.test(product)) {
            isValid = false;
            Swal.fire('Error', 'El nombre del producto debe contener solo letras, números, espacios, guiones y paréntesis', 'error');
            break;
        }

        if (!/^[a-zA-Z\s]+$/.test(status)) {
            isValid = false;
            Swal.fire('Error', 'El estado debe contener solo letras y espacios', 'error');
            break;
        }
    }

    if (!isValid) {
        Swal.fire('Error', 'Todos los campos son obligatorios en todas las filas.', 'error');
    }

    return isValid;
}

// Función para enviar órdenes
async function sendOrders() {
    const rows = document.querySelectorAll('#inputContainer .row');
    const orders = Array.from(rows).map(row => {
        const quantity = row.querySelector('select').value;
        const product = row.querySelector('input[id^="product"]').value;
        const status = row.querySelector('select[id^="status"]').value;

        return {
            quantity: parseInt(quantity),
            product: product,
            status: status
        };
    });

    try {
        for (let order of orders) {
            await sendOrder(order);
            await new Promise(resolve => setTimeout(resolve, 100)); // Retraso de 100ms
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
