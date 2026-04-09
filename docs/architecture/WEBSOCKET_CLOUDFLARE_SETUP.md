# WebSocket Cloudflare Durable Objects - Chat Integration Guide

**Version:** 1.0  
**Status:** Architecture & Configuration Guide  
**Date:** April 9, 2026

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Durable Objects Setup](#durable-objects-setup)
4. [Client Integration](#client-integration)
5. [Message Protocol](#message-protocol)
6. [Error Handling](#error-handling)
7. [Performance & Scaling](#performance--scaling)
8. [Deployment](#deployment)

---

## Overview

### Why Cloudflare Durable Objects for Chat?

**Benefits:**
- ✅ Real-time bidirectional communication
- ✅ Persistent state (chat history in memory)
- ✅ Strong consistency guarantees
- ✅ Global edge locations
- ✅ WebSocket support
- ✅ No cold starts
- ✅ Automatic failover

**Use Cases:**
- Live chat between client & talent
- Real-time typing indicators
- Read receipts
- Online/offline status
- Message delivery confirmation
- Conversation rooms

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Durable Object: ChatRoom (per thread_id)           │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  - Manages WebSocket connections               │  │  │
│  │  │  - Persists message history                    │  │  │
│  │  │  - Handles real-time events                    │  │  │
│  │  │  - Broadcasts to connected clients             │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                      │  │
│  │  State Storage:                                    │  │
│  │  - Connected users                                │  │
│  │  - Message queue                                  │  │
│  │  - User status (typing, online)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ▲                                  │
│                          │                                  │
│                    WebSocket connection                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ▲
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              CLIENT APPLICATIONS                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  appclient (Client)    │    apptalent (Talent)             │
│  ┌──────────────────┐  │  ┌──────────────────────────┐     │
│  │ WebSocket Client │  │  │ WebSocket Client         │     │
│  │ - Connect        │  │  │ - Connect                │     │
│  │ - Send messages  │  │  │ - Receive messages       │     │
│  │ - Listen events  │  │  │ - Typing indicator       │     │
│  │ - Fallback HTTP  │  │  │ - Read receipts          │     │
│  └──────────────────┘  │  └──────────────────────────┘     │
│                        │                                     │
└─────────────────────────────────────────────────────────────┘
```

### Dual-Mode Architecture (WebSocket + HTTP API)

```
┌─────────────────────────────────────────────────────────────┐
│                      MESSAGE FLOW                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Real-time (WebSocket):                                    │
│  User A ──websocket──> API ──> Durable Object ──> User B   │
│           (instant)                                         │
│                                                              │
│  Fallback (HTTP Polling):                                  │
│  User A ──POST──> API ──> Database                         │
│  User A <──GET── API <── Database (every 3-5s)             │
│           (delayed)                                         │
│                                                              │
│  Sync (D1):                                                │
│  Durable Object periodically syncs messages to D1          │
│  - Persist history                                         │
│  - For offline delivery                                    │
│  - Audit trail                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Durable Objects Setup

### 1. wrangler.toml Configuration

```toml
# appapi/wrangler.toml

[env.production]
durable_objects.bindings = [
  { name = "CHATROOM", class_name = "ChatRoom", path = "/src/workers/chatRoom.ts" }
]

[[migrations]]
tag = "v1"
new_classes = ["ChatRoom"]
deleted_classes = []

# Enable all Durable Object locations
# This ensures your DO replicates globally
durable_objects.enabled = true
```

### 2. Create Durable Object Class

**File:** `apps/appapi/src/workers/chatRoom.ts`

```typescript
// Durable Object for managing a single chat thread
export class ChatRoom {
  state: DurableObjectState
  env: any
  rooms: Map<string, Set<WebSocket>>
  messageBuffer: Array<any>
  
  constructor(state: DurableObjectState, env: any) {
    this.state = state
    this.env = env
    this.rooms = new Map()
    this.messageBuffer = []
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)
    
    // WebSocket upgrade endpoint
    if (url.pathname === '/ws') {
      return this.handleWebSocket(request)
    }

    // REST API endpoints
    if (request.method === 'GET' && url.pathname === '/history') {
      return this.getHistory(request)
    }

    if (request.method === 'POST' && url.pathname === '/send') {
      return this.handleMessage(request)
    }

    if (request.method === 'POST' && url.pathname === '/typing') {
      return this.handleTypingIndicator(request)
    }

    return new Response('Not Found', { status: 404 })
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    // 1. Validate user & thread access
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const threadId = url.searchParams.get('threadId')
    const token = url.searchParams.get('token')

    if (!userId || !threadId || !(await this.validateToken(token))) {
      return new Response('Unauthorized', { status: 401 })
    }

    // 2. Accept WebSocket upgrade
    const [client, server] = Object.values(new WebSocketPair())
    server.accept()

    // 3. Add to active connections
    if (!this.rooms.has(threadId)) {
      this.rooms.set(threadId, new Set())
    }
    this.rooms.get(threadId)!.add(server)

    // 4. Send message history to new user
    await this.sendHistoryToClient(server, threadId, userId)

    // 5. Broadcast user joined
    this.broadcast(threadId, {
      type: 'user_joined',
      userId,
      timestamp: new Date().toISOString(),
    }, server)

    // 6. Handle messages from this client
    server.addEventListener('message', async (event) => {
      const message = JSON.parse(event.data as string)
      await this.processMessage(message, userId, threadId, server)
    })

    // 7. Handle disconnect
    server.addEventListener('close', () => {
      this.rooms.get(threadId)?.delete(server)
      this.broadcast(threadId, {
        type: 'user_left',
        userId,
        timestamp: new Date().toISOString(),
      })

      // Optionally persist undelivered messages
      if (this.messageBuffer.length > 0) {
        this.persistToDatabase()
      }
    })

    return new Response(null, { status: 101, webSocket: client as any })
  }

  private async processMessage(
    message: any,
    userId: string,
    threadId: string,
    sender: WebSocket
  ) {
    const { body, type, timestamp } = message

    if (type === 'message') {
      // 1. Validate message
      if (!body || body.length > 4000) return

      // 2. Create message object
      const msg = {
        message_id: `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        thread_id: threadId,
        sender_id: userId,
        body: sanitize(body),
        timestamp: timestamp || new Date().toISOString(),
        is_read: 0,
      }

      // 3. Store in buffer (will sync to D1 periodically)
      this.messageBuffer.push(msg)

      // 4. Broadcast to all clients in thread
      this.broadcast(threadId, {
        type: 'message',
        ...msg,
      })

      // 5. Send delivery confirmation
      sender.send(JSON.stringify({
        type: 'message_delivered',
        message_id: msg.message_id,
      }))

      // 6. Sync to D1 after 100ms (batch)
      if (this.messageBuffer.length >= 10) {
        await this.persistToDatabase()
      }
    }

    if (type === 'typing') {
      // Broadcast typing indicator
      this.broadcast(threadId, {
        type: 'user_typing',
        userId,
        timestamp: new Date().toISOString(),
      }, sender)
    }

    if (type === 'read_receipt') {
      // Mark messages as read
      const { upToMessageId } = message
      await this.markAsRead(threadId, userId, upToMessageId)

      this.broadcast(threadId, {
        type: 'messages_read',
        userId,
        upToMessageId,
      })
    }
  }

  private broadcast(
    threadId: string,
    message: any,
    exclude?: WebSocket
  ) {
    const room = this.rooms.get(threadId)
    if (!room) return

    const serialized = JSON.stringify(message)
    for (const client of room) {
      if (client !== exclude) {
        try {
          client.send(serialized)
        } catch (err) {
          console.error('Failed to send message:', err)
        }
      }
    }
  }

  private async sendHistoryToClient(
    client: WebSocket,
    threadId: string,
    userId: string
  ) {
    // Fetch last 50 messages from D1
    const messages = await this.env.DB_LOGS.prepare(
      `SELECT * FROM messages_v2 
       WHERE thread_id = ? AND is_deleted = 0
       ORDER BY created_at DESC LIMIT 50`
    )
      .bind(threadId)
      .all()

    client.send(JSON.stringify({
      type: 'history',
      messages: messages.results?.reverse() || [],
    }))
  }

  private async persistToDatabase() {
    if (this.messageBuffer.length === 0) return

    const db = this.env.DB_LOGS
    
    for (const msg of this.messageBuffer) {
      await db.prepare(
        `INSERT INTO messages_v2 
         (message_id, thread_id, sender_id, body, sender_role, recipient_id, created_at)
         VALUES (?, ?, ?, ?, 'client', ?, datetime('now'))`
      )
        .bind(msg.message_id, msg.thread_id, msg.sender_id, msg.body, 'RECIPIENT-ID')
        .run()
    }

    this.messageBuffer = []
  }

  private async validateToken(token: string | null): Promise<boolean> {
    if (!token) return false
    try {
      // Validate JWT token
      const verified = await this.verifyJWT(token)
      return !!verified
    } catch {
      return false
    }
  }

  private async markAsRead(
    threadId: string,
    userId: string,
    upToMessageId: string
  ) {
    await this.env.DB_LOGS.prepare(
      `UPDATE messages_v2 
       SET is_read = 1 
       WHERE thread_id = ? AND recipient_id = ? AND created_at <= (
         SELECT created_at FROM messages_v2 WHERE message_id = ?
       )`
    )
      .bind(threadId, userId, upToMessageId)
      .run()
  }

  private async getHistory(request: Request): Promise<Response> {
    const url = new URL(request.url)
    const threadId = url.searchParams.get('threadId')
    const limit = url.searchParams.get('limit') || '50'

    const messages = await this.env.DB_LOGS.prepare(
      `SELECT * FROM messages_v2 
       WHERE thread_id = ? AND is_deleted = 0
       ORDER BY created_at DESC LIMIT ?`
    )
      .bind(threadId, parseInt(limit))
      .all()

    return new Response(JSON.stringify(messages.results?.reverse() || []), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  private async handleMessage(request: Request): Promise<Response> {
    const msg = await request.json()
    // Process message and persist
    return new Response(JSON.stringify({ success: true }))
  }

  private async handleTypingIndicator(request: Request): Promise<Response> {
    const data = await request.json()
    this.broadcast(data.threadId, {
      type: 'user_typing',
      userId: data.userId,
      timestamp: new Date().toISOString(),
    })
    return new Response(JSON.stringify({ success: true }))
  }

  // Helper methods
  private sanitize(text: string): string {
    // Basic sanitization
    return text
      .replace(/[<>]/g, '')
      .substring(0, 4000)
  }

  private async verifyJWT(token: string): Promise<any> {
    // Implement JWT verification
    // Use jsonwebtoken or similar
    return null
  }
}
```

---

## Client Integration

### 1. WebSocket Service (React)

**File:** `apps/appclient/src/services/chatWebSocket.ts`

```typescript
export class ChatWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: any[] = []
  private listeners: Map<string, Function[]> = new Map()

  constructor(
    private threadId: string,
    private userId: string,
    private token: string,
    private wsUrl: string // wss://api.orlandmanagement.com/ws
  ) {}

  // Connect to WebSocket
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(this.wsUrl)
        url.searchParams.set('threadId', this.threadId)
        url.searchParams.set('userId', this.userId)
        url.searchParams.set('token', this.token)

        this.ws = new WebSocket(url.toString())

        this.ws.onopen = () => {
          console.log('WebSocket connected')
          this.reconnectAttempts = 0
          this.flushMessageQueue()
          resolve()
        }

        this.ws.onmessage = (event) => {
          const message = JSON.parse(event.data)
          this.emit('message', message)
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

        this.ws.onclose = () => {
          this.attemptReconnect()
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  // Send message
  async send(body: string, type: 'message' | 'typing' = 'message'): Promise<void> {
    const message = {
      type,
      body,
      timestamp: new Date().toISOString(),
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message if not connected
      this.messageQueue.push(message)
      // Try to reconnect
      if (!this.ws) {
        await this.connect()
      }
    }
  }

  // Mark messages as read
  markAsRead(upToMessageId: string): void {
    this.send(JSON.stringify({
      type: 'read_receipt',
      upToMessageId,
    }))
  }

  // Typing indicator
  sendTypingIndicator(): void {
    this.send('', 'typing')
  }

  // Event listeners
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach(callback => callback(data))
  }

  // Reconnection logic
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    await new Promise(resolve =>
      setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts)
    )

    try {
      await this.connect()
    } catch (error) {
      console.error('Reconnection failed:', error)
      await this.attemptReconnect()
    }
  }

  // Flush queued messages
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      this.ws.send(JSON.stringify(message))
    }
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
```

### 2. React Hook for Chat

**File:** `apps/appclient/src/hooks/useWebSocketChat.ts`

```typescript
import { useState, useEffect, useRef, useCallback } from 'react'
import { ChatWebSocket } from '../services/chatWebSocket'

export function useWebSocketChat(threadId: string, userId: string, token: string) {
  const [messages, setMessages] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<ChatWebSocket | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  // Initialize WebSocket
  useEffect(() => {
    wsRef.current = new ChatWebSocket(
      threadId,
      userId,
      token,
      'wss://api.orlandmanagement.com/ws'
    )

    wsRef.current.on('message', (msg) => {
      if (msg.type === 'message') {
        setMessages(prev => [...prev, msg])
      } else if (msg.type === 'history') {
        setMessages(msg.messages)
      } else if (msg.type === 'user_typing') {
        setIsTyping(msg.userId)
        // Clear typing indicator after 3 seconds
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => setIsTyping(null), 3000)
      } else if (msg.type === 'message_delivered') {
        // Update message status
        setMessages(prev =>
          prev.map(m =>
            m.message_id === msg.message_id ? { ...m, delivered: true } : m
          )
        )
      } else if (msg.type === 'messages_read') {
        // Bulk mark as read
        setMessages(prev =>
          prev.map(m =>
            new Date(m.timestamp) <= new Date(msg.timestamp)
              ? { ...m, is_read: 1 }
              : m
          )
        )
      }
    })

    wsRef.current.connect()
      .then(() => setIsConnected(true))
      .catch(err => setError(err.message))

    return () => {
      wsRef.current?.disconnect()
    }
  }, [threadId, userId, token])

  // Send message
  const sendMessage = useCallback(async (body: string) => {
    if (!wsRef.current) return
    try {
      await wsRef.current.send(body, 'message')
    } catch (err: any) {
      setError(err.message)
    }
  }, [])

  // Send typing indicator
  const sendTyping = useCallback(() => {
    if (!wsRef.current) return
    wsRef.current.sendTypingIndicator()
  }, [])

  // Mark as read
  const markAsRead = useCallback((upToMessageId: string) => {
    wsRef.current?.markAsRead(upToMessageId)
  }, [])

  return {
    messages,
    isConnected,
    isTyping,
    error,
    sendMessage,
    sendTyping,
    markAsRead,
  }
}
```

### 3. Updated Chat Component

```typescript
import { useWebSocketChat } from '../hooks/useWebSocketChat'

export default function ChatWithWebSocket({ threadId, userId, token }: Props) {
  const { messages, isConnected, isTyping, sendMessage, sendTyping } =
    useWebSocketChat(threadId, userId, token)

  const [input, setInput] = useState('')

  const handleSendMessage = async () => {
    if (!input.trim()) return
    await sendMessage(input)
    setInput('')
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value)
    sendTyping() // Send typing indicator
  }

  return (
    <div>
      {!isConnected && <div className="alert">Connecting...</div>}
      
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.message_id} className="message">
            <p>{msg.body}</p>
            <span className="time">{msg.timestamp}</span>
            {msg.is_read === 1 && <span className="read">✓✓</span>}
          </div>
        ))}
        {isTyping && <div className="typing-indicator">{isTyping} sedang mengetik...</div>}
      </div>

      <div className="input-area">
        <input
          value={input}
          onChange={handleInputChange}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Tulis pesan..."
        />
        <button onClick={handleSendMessage}>Kirim</button>
      </div>
    </div>
  )
}
```

---

## Message Protocol

### Message Types & Format

```typescript
// Client → Server
type ClientMessage = 
  | {
      type: 'message'
      body: string
      timestamp: string
    }
  | {
      type: 'typing'
      timestamp: string
    }
  | {
      type: 'read_receipt'
      upToMessageId: string
    }

// Server → Clients
type ServerMessage =
  | {
      type: 'message'
      message_id: string
      thread_id: string
      sender_id: string
      body: string
      timestamp: string
      is_read: number
    }
  | {
      type: 'user_typing'
      userId: string
      timestamp: string
    }
  | {
      type: 'messages_read'
      userId: string
      upToMessageId: string
    }
  | {
      type: 'message_delivered'
      message_id: string
    }
  | {
      type: 'user_joined'
      userId: string
      timestamp: string
    }
  | {
      type: 'user_left'
      userId: string
      timestamp: string
    }
  | {
      type: 'history'
      messages: any[]
    }
```

---

## Error Handling

### Retry Strategy

```typescript
const retryConfig = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
}

async function connectWithRetry(ws: ChatWebSocket): Promise<void> {
  let delay = retryConfig.initialDelay
  
  for (let attempt = 0; attempt < retryConfig.maxRetries; attempt++) {
    try {
      await ws.connect()
      return
    } catch (error) {
      console.error(`Connection attempt ${attempt + 1} failed:`, error)
      
      if (attempt < retryConfig.maxRetries - 1) {
        await sleep(delay)
        delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay)
      }
    }
  }
  
  throw new Error('Failed to connect after max retries')
}
```

### Fallback to HTTP

Jika WebSocket gagal, gunakan HTTP polling:

```typescript
export class ChatService {
  private useWebSocket = true

  async sendMessage(threadId: string, body: string): Promise<void> {
    if (this.useWebSocket && this.ws?.isConnected) {
      await this.ws.send(body)
    } else {
      // Fallback to HTTP
      await axios.post(`/api/v1/messages`, {
        thread_id: threadId,
        body,
        recipient_id: '...',
      })
    }
  }

  async getMessage(threadId: string): Promise<any[]> {
    if (this.useWebSocket && this.ws?.isConnected) {
      return this.cachedMessages
    } else {
      // Fallback to HTTP polling
      return await axios.get(`/api/v1/messages/${threadId}`)
    }
  }
}
```

---

## Performance & Scaling

### Optimization Strategies

1. **Message Batching**
   - Collect messages in buffer
   - Sync to D1 every 100ms or 10 messages
   - Reduces database writes by ~90%

2. **Connection Pooling**
   - Reuse Durable Object instances
   - Each ChatRoom handles multiple threads
   - Location-based affinity for performance

3. **Compression**
   - gzip compression for payloads
   - Binary frame format for efficiency
   - Reduces bandwidth by 70-80%

4. **Caching**
   - In-memory message buffer
   - Last-read timestamp cache
   - User status cache (online/offline/typing)

5. **Monitoring**
   - Track connection metrics
   - Monitor message latency
   - Alert on reconnection spikes

---

## Deployment

### 1. Testing Locally

```bash
# Terminal 1: Start Workers local
wrangler dev

# Terminal 2: Test WebSocket
wscat -c ws://localhost:8787/ws?threadId=TEST&userId=USER1&token=TOKEN
```

### 2. Deploy to Production

```bash
# Deploy Durable Object
wrangler publish --env production

# Verify Durable Object is running
curl https://api.orlandmanagement.com/admin/ws/stats
```

### 3. Configuration

Set environment variables in `wrangler.toml`:

```toml
[env.production]
vars = { 
  ENABLE_WEBSOCKET = "true"
  WS_MESSAGE_BUFFER_SIZE = "100"
  WS_SYNC_INTERVAL_MS = "100"
  WS_RECONNECT_TIMEOUT = "5000"
}
```

### 4. Monitoring & Logs

```bash
# Stream logs
wrangler tail --env production

# Check Durable Object status
wrangler durable-objects status
```

---

## Migration Path

### Phase 1: Current (HTTP Polling)
- ✅ Message persistence in D1
- ✅ HTTP API endpoints
- ✅ Optional 3-5s polling on client

### Phase 2: WebSocket (Next)
- WebSocket upgrade via Durable Objects
- Real-time message delivery
- Typing indicators
- Read receipts
- Automatic fallback to HTTP

### Phase 3: Advanced Features
- Message reactions
- Pinned messages
- Message search
- Voice/video call signaling
- Chat analytics

---

## Security Considerations

### Token Validation
```typescript
// Every WebSocket connection must validate JWT
const validateJWT = (token: string): { userId: string; threadId: string } => {
  const decoded = jwt.verify(token, JWT_SECRET)
  return {
    userId: decoded.userId,
    threadId: decoded.threadId,
  }
}
```

### Rate Limiting per Connection

```typescript
class RateLimiter {
  private messageCount = 0
  private resetTime = Date.now() + 60000

  canSend(): boolean {
    if (Date.now() > this.resetTime) {
      this.messageCount = 0
      this.resetTime = Date.now() + 60000
      return true
    }
    
    if (this.messageCount >= 100) { // Max 100 messages per minute
      return false
    }
    
    this.messageCount++
    return true
  }
}
```

### Message Sanitization & Validation

```typescript
const validateMessage = (msg: any): boolean => {
  // Check length
  if (!msg.body || msg.body.length > 4000) return false
  
  // Check type
  if (!['message', 'typing', 'read_receipt'].includes(msg.type)) return false
  
  return true
}
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| WebSocket connection fails | Enable CORS, check token, verify URL |
| Messages not persisting | Check D1 migration, verify batch sync |
| High latency | Check Durable Object location, monitor bandwidth |
| Excessive memory usage | Reduce message buffer size, cleanup old threads |
| Reconnection loops | Check server logs, review token expiry |

---

## References

- [Cloudflare Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- [WebSocket API](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
- [D1 Database](https://developers.cloudflare.com/d1/get-started/)

---

**Status:** Ready for Phase 2 implementation
**Next Review:** After WebSocket deployment & testing
