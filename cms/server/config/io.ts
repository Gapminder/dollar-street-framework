export const configIo = (app) => {
  const nconf = app.get('nconf');
  const io = require('socket.io')(parseInt(nconf.get('CMS_SOCKETS_PORT'), 10));

  io.on('connection', (socket) => {
    socket.on('eventSave', (data) => {
      socket.broadcast.emit('eventUpdate', data);
    });
  });

  app.set('io', io);
};
