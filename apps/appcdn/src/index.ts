import { Hono } from 'hono'
const app = new Hono<{ Bindings: { ASSETS_BUCKET: any } }>()
app.get('/', (c) => c.text('Orland CDN Service'))
export default app
