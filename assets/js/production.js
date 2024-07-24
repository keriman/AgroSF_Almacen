const socket = new WebSocket('ws://192.168.127.132:8080');

document.addEventListener('DOMContentLoaded', () => {
    socket.addEventListener('open', (event) => {
        console.log('Connected to WebSocket server');
        fetchOrderHistory(); 
    });

    socket.addEventListener('message', (event) => {
        console.log('Received message:', event.data);
        try {
            const order = JSON.parse(event.data);
            addOrderToHistory(order);
             Swal.fire({
                title: 'Nueva Orden Recibida',
                text: `Cantidad: ${order.cantidad}, Producto: ${order.producto}, Presentación: ${order.presentacion}`,
                icon: 'info',
                confirmButtonText: 'Aceptar'
            });
            playAlertSound();
            showNotification('Nueva Orden', `Cantidad: ${order.cantidad}, Producto: ${order.producto}`);

        } catch (error) {
            console.error('Error parsing JSON:', error);
        }
    });

    if ("Notification" in window && Notification.permission !== "granted") {
        Notification.requestPermission();
    }
});

function fetchOrderHistory() {
    fetch('http://192.168.127.132:3000/api/orders')
        .then(response => response.json())
        .then(orders => {
            initializeTable();
            orders.forEach(order => addOrderToHistory(order));
        })
        .catch(error => console.error('Error fetching order history:', error));
}

function initializeTable() {
    if (!historyDataTable) {
        historyDataTable = $('#ordersHistoryTable').DataTable({
            language: {
                url: 'assets/json/Spanish.json'
            },
            dom: 'Blfrtip',
            pageLength: 25,
            buttons: [
                {
                    extend: 'excelHtml5',
                    text: '<i class="fa fa-file-excel"></i> Excel',
                    titleAttr: 'Excel',
                    className: 'buttons-excel'
                },
                {
                    extend: 'pdfHtml5',
                    text: '<i class="fa fa-file-pdf"></i> PDF',
                    titleAttr: 'PDF',
                    className: 'buttons-pdf'
                }
            ],
            order: [[0, 'desc']],
            columns: [
                { 
                    title: 'Fecha',
                    data: 'fecha',
                    render: function(data) {
                        return new Date(data).toLocaleString('es-ES');
                    }
                },
                { title: 'Pedido', data: 'numeroPedido' },
                { title: 'Producto', data: 'producto' },
                { title: 'Presentación', data: 'presentacion' },
                { title: 'Cantidad', data: 'cantidad' }
            ],
        });
    }
}


function fetchOrderHistory() {
    fetch('http://192.168.127.132:3000/api/orders')
        .then(response => response.json())
        .then(orders => {
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
                        <th>Fecha</th>
                        <th>Pedido</th>
                        <th>Producto</th>
                        <th>Presentación</th>
                        <th>Cantidad</th>
                    </tr>
                </thead>
                <tbody id="ordersHistoryBody">
                </tbody>
            `;
            document.getElementById('orderHistoryDisplay').appendChild(table);
        }
        
        historyDataTable = $('#ordersHistoryTable').DataTable({
            language: {
                url: 'assets/json/Spanish.json'
            },
            dom: 'Blfrtip',
            pageLength: 25,
            buttons: [
                {
                    extend: 'excelHtml5',
                    text: '<i class="fa fa-file-excel"></i> Excel',
                    titleAttr: 'Excel',
                    className: 'buttons-excel'
                },
                {
                    extend: 'pdfHtml5',
                    text: '<i class="fa fa-file-pdf"></i> PDF',
                    titleAttr: 'PDF',
                    className: 'buttons-pdf'
                }
            ],
            order: [[0, 'desc']],
            columns: [
                { title: 'Fecha' },
                { title: 'Pedido' },
                { title: 'Producto' },
                { title: 'Presentación' },
                { title: 'Cantidad' }
            ]
        });
    }

    const formattedDate = moment.utc(order.fecha).format('YYYY-MM-DD');
    
    historyDataTable.row.add([
        formattedDate,
        order.numeroPedido,
        order.producto,
        order.presentacion,
        order.cantidad
    ]).draw();
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
