import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
import { Server } from 'socket.io'
import { createServer } from 'http'
import authRoutes from './routes/auth.routes'
import postRoutes from './routes/post.routes'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// Configure Socket.IO with CORS
const io = new Server(httpServer, {
  cors: { 
    origin: true, // Allow all origins for Socket.io (handled by Express CORS below)
    methods: ['GET', 'POST'],
    credentials: true
  }
})

// --- MIDDLEWARE ---
app.use(helmet())

// CORS Configuration for Production
const allowedOrigins = [
  'http://localhost:5173',       // Local Dev
  'https://bridgecn.vercel.app', // Your Vercel Production URL (Update this after deploying)
  /vercel\.app$/                // Regex to allow all Vercel preview deployments
]

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list or matches regex
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') return allowed === origin;
      return allowed.test(origin);
    });

    if (isAllowed) {
      callback(null, true)
    } else {
      console.log(`Blocked by CORS: ${origin}`)
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// --- ROUTES ---
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/posts', postRoutes)

app.use('*', (_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(' Server Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// --- SOCKET.IO REAL-TIME LOGIC ---
io.on('connection', (socket) => {
  console.log(` User connected: ${socket.id}`)

  socket.on('join-user-room', (userId: string) => {
    socket.join(userId)
    console.log(`User ${socket.id} joined room: ${userId}`)
  })

  socket.on('send-private-message', ({ targetUserId, messageData }) => {
    io.to(targetUserId).emit('receive-message', messageData)
    console.log(`Message sent to user: ${targetUserId}`)
  })

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`)
  })
})

// --- START SERVER ---
const PORT = process.env.PORT || 4000

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`)
})

export { app, io }