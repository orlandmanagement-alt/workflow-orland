import { Hono } from 'hono'
const app = new Hono<{ Bindings: { CORE_API: any } }>()
app.get('/', async (c) => {
  // Contoh memanggil appapi via Service Binding
  // const apiRes = await c.env.CORE_API.fetch('http://internal/health')
  return c.html(`<h1>Dashboard ${c.req.url}</h1><p>Hono TS SSR Frontend</p>`)
})
export default app
