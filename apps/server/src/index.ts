import { env } from 'cloudflare:workers'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import apis from './api'

type Bindings = {
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()
console.log('CORS_ORIGIN:', env.CORS_ORIGIN)
app.use(logger())
app.use(
	'/*',
	cors({
		origin: env.CORS_ORIGIN || '',
		allowMethods: ['GET', 'POST', 'OPTIONS'],
	}),
);

app.get('/', (c) => {
	return c.text('OK')
})

// API routes
app.route('/api', apis)

export default app