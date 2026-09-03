// const express = require('express');
// const http = require('http');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const { Server } = require('socket.io');
// const jwt = require('jsonwebtoken');
// const config = require('./config');

// const authRoutes = require('./routes/auth');
// const adminRoutes = require('./routes/admin');
// const contactsRoutes = require('./routes/contacts');
// const alertsRoutes = require('./routes/alerts');

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.use('/auth', authRoutes);
// app.use('/auth', adminRoutes);
// app.use('/contacts', contactsRoutes);
// app.use('/alerts', alertsRoutes);

// async function main() {
//   await mongoose.connect(config.mongodbUri, { useNewUrlParser: true, useUnifiedTopology: true });
//   const server = http.createServer(app);
//   const io = new Server(server, {
//     cors: { origin: "http://localhost:3000" ,
//         credentials: true
//     },
//     connectionStateRecovery: {
//       maxDisconnectionDuration: 2 * 60 * 1000,
//       skipMiddlewares: true,
//     },
//   });
//   app.set('io', io);

//   // Socket.IO middleware for authentication
//   io.use((socket, next) => {
//     try {
//       const token = socket.handshake.auth.token;
//       if (!token) {
//         return next(new Error('Authentication token required'));
//       }

//       // Extract token from "Bearer {token}" format
//       const tokenValue = token.startsWith('Bearer ') ? token.slice(7) : token;

//       // Verify token
//       jwt.verify(tokenValue, 'your-secret-key', (err, decoded) => {
//         if (err) {
//           return next(new Error('Invalid token'));
//         }
//         socket.userId = decoded.id;
//         socket.user = decoded;
//         next();
//       });
//     } catch (error) {
//       next(new Error('Authentication failed'));
//     }
//   });

//   io.on('connection', (socket) => {
//     console.log(`User ${socket.userId} connected via Socket.IO`);

//     // Auto-join user's room for receiving their alerts
//     socket.join(String(socket.userId));

//     // Handle explicit join event
//     socket.on('join', (userId) => {
//       socket.join(String(userId));
//       console.log(`Socket ${socket.id} joined room ${userId}`);
//     });

//     socket.on('disconnect', () => {
//       console.log(`User ${socket.userId} disconnected`);
//     });

//     // Handle errors
//     socket.on('error', (error) => {
//       console.error(`Socket error for ${socket.userId}:`, error);
//     });
//   });

//   server.listen(config.port, () => {
//     console.log(`Server listening on port ${config.port}`);
//     console.log(`Socket.IO enabled with authentication`);
//   });
// }

// main().catch((err) => {
//   console.error('Startup error', err);
//   process.exit(1);
// });




const fs = require('fs');
const util = require('util');
const logFile = fs.createWriteStream('./sos_debug.log', { flags: 'a' });
const originalLog = console.log;
const originalError = console.error;
console.log = function (...args) {
  logFile.write(util.format(...args) + '\n');
  originalLog.apply(console, args);
};
console.error = function (...args) {
  logFile.write('ERROR: ' + util.format(...args) + '\n');
  originalError.apply(console, args);
};

const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const contactsRoutes = require('./routes/contacts');
const alertsRoutes = require('./routes/alerts');

const app = express();

/* =========================
   MIDDLEWARE
========================= */

app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json({
  strict: false,
  limit: '2mb',
  verify: (req, _res, buf) => {
    try {
      JSON.parse(buf.toString('utf8'));
    } catch (error) {
      req.invalidJson = true;
    }
  }
}));

app.use((req, res, next) => {
  if (req.invalidJson) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  next();
});

app.use((err, req, res, next) => {
  const isJsonParseError =
    err instanceof SyntaxError ||
    err?.type === 'entity.parse.failed' ||
    err?.name === 'SyntaxError' ||
    err?.status === 400;

  if (isJsonParseError) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  next(err);
});

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/* =========================
   ROUTES
========================= */

app.use('/auth', authRoutes);
app.use('/admin', adminRoutes); // changed from /auth to avoid conflict
app.use('/contacts', contactsRoutes);
app.use('/alerts', alertsRoutes);

// Health check / Ping
app.get('/ping', (req, res) => {
  console.log('[Ping] Received ping request');
  res.json({ ok: true, message: 'Server is reachable', time: new Date().toISOString() });
});


/* =========================
   MAIN SERVER FUNCTION
========================= */

async function main() {
  try {

    // MongoDB connection
    try {
      await mongoose.connect(config.mongodbUri);
      console.log("MongoDB Connected");
    } catch (dbErr) {
      console.warn("MongoDB unavailable, continuing without database persistence:", dbErr.message);
    }

    const server = http.createServer(app);

    const io = new Server(server, {
      cors: {
        origin: "*",
        credentials: true
      },
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true
      }
    });

    app.set('io', io);

    /* =========================
       SOCKET AUTH
    ========================= */

    io.use((socket, next) => {
      try {

        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error("Authentication token required"));
        }

        const tokenValue = token.startsWith("Bearer ")
          ? token.slice(7)
          : token;

        jwt.verify(tokenValue, config.jwtSecret || "your-secret-key", (err, decoded) => {

          if (err) {
            return next(new Error("Invalid token"));
          }

          socket.userId = decoded.id;
          socket.user = decoded;

          next();
        });

      } catch (error) {
        next(new Error("Authentication failed"));
      }
    });

    /* =========================
       SOCKET CONNECTION
    ========================= */

    io.on('connection', (socket) => {

      console.log(`User ${socket.userId} connected via Socket.IO`);

      // join personal room
      socket.join(String(socket.userId));

      socket.on('join', (userId) => {
        socket.join(String(userId));
        console.log(`Socket ${socket.id} joined room ${userId}`);
      });

      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`);
      });

      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.userId}:`, error);
      });

    });

    /* =========================
       START SERVER
    ========================= */

    server.listen(config.port, '0.0.0.0', () => {
      console.log(`Server listening on port ${config.port}`);
      console.log("Socket.IO enabled with authentication");
    });

  } catch (err) {

    console.error("Startup error:", err);
    process.exit(1);

  }
}

/* Start app */

main();