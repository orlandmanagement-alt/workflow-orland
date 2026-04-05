export class ChatRoom {
  state: DurableObjectState;
  env: any;
  sessions: any[];

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.sessions = [];
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      await this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response("Expected Upgrade: websocket", { status: 426 });
  }

  async handleSession(webSocket: WebSocket) {
    // Terima session
    //@ts-ignore
    webSocket.accept();
    this.sessions.push(webSocket);

    // Broadcast pesan ke semua anggota di room ini
    webSocket.addEventListener("message", async (msg) => {
      try {
        const data = JSON.parse(msg.data as string);
        
        // Simpan pesan persisten di D1 kalau perlu via env
        // await this.env.DB_LOGS.prepare('INSERT INTO messages...').run()

        const broadcastMsg = JSON.stringify({
          sender: data.senderId,
          text: data.text,
          timestamp: new Date().toISOString()
        });

        this.sessions.forEach((session) => {
          if (session !== webSocket) {
             try {
                session.send(broadcastMsg);
             } catch(err) {
                // Sesi mati
                this.sessions = this.sessions.filter(s => s !== session);
             }
          }
        });
      } catch (err) {
        webSocket.send(JSON.stringify({ error: "Invalid message format" }));
      }
    });

    webSocket.addEventListener("close", () => {
      this.sessions = this.sessions.filter(s => s !== webSocket);
    });
  }
}
