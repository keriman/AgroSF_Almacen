const socket = new WebSocket('ws://127.0.0.1:8080');

document.addEventListener('DOMContentLoaded', () => {
    socket.addEventListener('message', (event) => {
        console.log('Received message:', event.data);
        try {
            const order = JSON.parse(event.data);
            addOrderToHistory(order);
             Swal.fire({
                title: 'Nueva Orden Recibida',
                text: `Cantidad: ${order.cantidad}, Producto: ${order.producto}, Presentación: ${order.presentacion}`,
                icon: 'info',
                confirmButtonText: 'Aceptar',
                timer: 3000,
                timerProgressBar: true
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
    fetch('http://127.0.0.1:3000/api/orders')
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
    if (!historyDataTable) {
        let table = document.getElementById('ordersHistoryTable');
        if (!table) {
            table = document.createElement('table');
            table.id = 'ordersHistoryTable';
            table.className = 'table table-striped table-hover table-bordered';
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
            dom:  '<"top"f>rt<"bottom"Blip><"clear">',
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
    const currentDate = moment().format('YYYY-MM-DD'); 
    const nextDay = moment().add(1, 'days').format('YYYY-MM-DD'); 
   
    const rowNode = historyDataTable.row.add([
        formattedDate,
        order.numeroPedido ? order.numeroPedido.toUpperCase() : '',
        order.producto ? order.producto.toUpperCase() : '',
        order.presentacion,
        order.cantidad
    ]).draw().node(); 

    $('#ordersHistoryTable tbody tr').removeClass('highlight-orange highlight-red');
    
    let count = 0;
    $('#ordersHistoryTable tbody tr').each(function(index) {
        const dateCellText = $(this).find('td').eq(0).text().trim();
        const isCurrentOrFuture = moment(dateCellText).isSameOrAfter(nextDay) || moment(dateCellText).isSame(currentDate, 'day');

        if (isCurrentOrFuture && count < 3) {
            $(this).find('td').addClass('highlight-orange');
            count++;
        } else {
            $(this).find('td').removeClass('highlight-orange');
        }        
        if (moment(dateCellText).isBefore(currentDate)) {
            $(this).addClass('highlight-red');
        }
    });
    
    if (moment(formattedDate).isBefore(currentDate)) {
        $(rowNode).addClass('highlight-red');
    }
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
