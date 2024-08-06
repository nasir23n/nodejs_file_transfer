const express = require('express');
const multer = require('multer');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

const devices = {};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/upload', upload.array('files'), (req, res) => {
  const { deviceId } = req.body;
  const files = req.files.map(file => ({
    filename: file.filename,
    path: `/uploads/${file.filename}`
  }));

  if (devices[deviceId]) {
    io.to(deviceId).emit('filesReceived', files);
  }

  res.json(files);
});

io.on('connection', (socket) => {
  console.log(`Device connected: ${socket.id}`);

  devices[socket.id] = socket;

  socket.on('disconnect', () => {
    console.log(`Device disconnected: ${socket.id}`);
    delete devices[socket.id];
    io.emit('updateDevices', Object.keys(devices).map(id => ({ id, name: devices[id].deviceName })));
  });

  socket.on('registerDevice', (deviceName) => {
    devices[socket.id].deviceName = deviceName;
    io.emit('updateDevices', Object.keys(devices).map(id => ({ id, name: devices[id].deviceName })));
  });

  io.emit('updateDevices', Object.keys(devices).map(id => ({ id, name: devices[id].deviceName })));
});

server.listen(PORT, () => {
  console.log(`Server running on http://192.168.0.102:${PORT}`);
});
