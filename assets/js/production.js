//production.js
const socket = new WebSocket('ws://localhost:8080');
let orderDisplay;
let orderHistoryDisplay;

document.addEventListener('DOMContentLoaded', () => {
    orderDisplay = document.getElementById('orderDisplay');
    orderHistoryDisplay = document.getElementById('orderHistoryDisplay');

    socket.addEventListener('open', (event) => {
        console.log('Connected to WebSocket server');
        fetchExistingOrders();
        fetchOrderHistory();
    });

    socket.addEventListener('message', (event) => {
        console.log('Received message:', event.data);

        try {
            const order = JSON.parse(event.data);
            addOrderToDisplay(order);
            addOrderToHistory(order);
        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });

    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
});

function fetchExistingOrders() {
    fetch('http://localhost:3000/api/orders')
        .then(response => response.json())
        .then(orders => {
            orders.forEach(order => addOrderToDisplay(order));
        })
        .catch(error => console.error('Error fetching orders:', error));
}

function fetchOrderHistory() {
    fetch('http://localhost:3000/api/orders')
        .then(response => response.json())
        .then(orders => {
            // Clear existing history before adding new orders
            ordersHistory = [];
            if (historyDataTable) {
                historyDataTable.clear();
            }
            orders.forEach(order => addOrderToHistory(order));
            if (historyDataTable) {
                historyDataTable.draw();
            }
        })
        .catch(error => console.error('Error fetching order history:', error));
}

let ordersHistory = [];
let historyDataTable = null;

function addOrderToHistory(order) {
    ordersHistory.push(order);
    
    if (!historyDataTable) {
        let table = document.getElementById('ordersHistoryTable');
        if (!table) {
            table = document.createElement('table');
            table.id = 'ordersHistoryTable';
            table.className = 'table table-striped table-bordered';
            table.innerHTML = `
                <thead class="thead-dark">
                    <tr>
                        <th>ID de Orden</th>
                        <th>Cantidad</th>
                        <th>Producto</th>
                        <th>Status</th>
                        <th>Recibido a las</th>
                    </tr>
                </thead>
                <tbody id="ordersHistoryBody">
                </tbody>
            `;
            orderHistoryDisplay.appendChild(table);
        }
        
        historyDataTable = $('#ordersHistoryTable').DataTable({
            order: [[4, 'desc']],
            language: {
                url: 'assets/json/Spanish.json'
            },
            dom: 'Blfrtip', // Agregar la configuración de botones
            pageLength: 25,
            buttons: [
                {
                    extend: 'excelHtml5',
                    text: '<i class="fa fa-file-excel"></i> Excel',
                    titleAttr: 'Excel',
                    className: 'buttons-excel' // Clase personalizada para el botón de Excel
                },
                {
                    extend: 'pdfHtml5',
                    text: '<i class="fa fa-file-pdf"></i> PDF',
                    titleAttr: 'PDF',
                    className: 'buttons-pdf' // Clase personalizada para el botón de PDF
                }
            ]
        });
        
        
    }
    
    const truncatedId = order._id.slice(-10);
    historyDataTable.row.add([
        truncatedId,
        order.quantity,
        order.product,
        order.status,
        new Date(order.createdAt).toLocaleString()
    ]);
    
    // No llamamos a draw() aquí, se llamará una vez que se agreguen todas las órdenes
}



function addOrderToDisplay(order) {
    const orderDisplay = document.getElementById('orderDisplay');

    if (!document.getElementById('ordersTable')) {
        const table = document.createElement('table');
        table.id = 'ordersTable';
        table.className = 'table table-striped table-bordered';
        table.innerHTML = `
            <thead class="thead-dark">
                <tr>
                    <th>Fecha</th>
                    <th>Cantidad</th>
                    <th>Producto</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody id="ordersBody">
            </tbody>
        `;
        orderDisplay.appendChild(table);
        $(document).ready(function() {
            $('#ordersTable').DataTable({
                order: [[0, 'desc']],
                language: {
                    url: 'assets/json/Spanish.json'
                },
                pageLength: 25,
            });
        });
    }

    // Agregar la nueva fila a la tabla
    const ordersBody = document.getElementById('ordersBody');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${new Date(order.createdAt).toLocaleString()}</td>
        <td>${order.quantity}</td>
        <td>${order.product}</td>
        <td>${order.status}</td>
    `;
    ordersBody.insertBefore(row, ordersBody.firstChild);

    // Mostrar alerta con SweetAlert2
    Swal.fire({
        title: 'Nueva Orden Recibida',
        text: `Cantidad: ${order.quantity}, Producto: ${order.product}, Estado: ${order.status}`,
        icon: 'info',
        confirmButtonText: 'Aceptar'
    });

    // También puedes conservar el sonido si lo necesitas
    playAlertSound();
}

function playAlertSound() {
    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alert-bells-echo-765.mp3');
    audio.play();
}

function showNotification(title, body) {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
    } else if (Notification.permission === "granted") {
        new Notification(title, { body: body });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(function (permission) {
            if (permission === "granted") {
                new Notification(title, { body: body });
            }
        });
    }
}
