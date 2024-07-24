const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://192.168.127.132:27017/fertilizer_factory', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const orderSchema = new mongoose.Schema({
  fecha: Date,
  numeroPedido: String,
  producto: String,
  presentacion: String,
  cantidad: Number,
  createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

const wss = new WebSocket.Server({ port: 8080, host: '0.0.0.0' });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');

  ws.on('message', async (message) => {
    console.log('Received:', message.toString());

    try {
      const orderData = JSON.parse(message);

      const newOrder = new Order({
        fecha: new Date(orderData.fecha),
        numeroPedido: orderData.numeroPedido,
        producto: orderData.producto,
        presentacion: orderData.presentacion,
        cantidad: orderData.cantidad
      });
      
      await newOrder.save();
      console.log('Order saved to database');

      wss.clients.forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(newOrder));
        }
      });
    } catch (error) {
      console.error('Error processing order:', error);
      ws.send(JSON.stringify({ error: 'Invalid order data or database error' }));
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ fecha: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders from database' });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
});