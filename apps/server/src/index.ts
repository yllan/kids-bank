import { env } from "cloudflare:workers";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { db, kidsTable } from "@kids-bank/db"
import { eq } from "drizzle-orm";

const app = new Hono();

app.use(logger());
app.use(
	"/*",
	cors({
		origin: env.CORS_ORIGIN || "",
		allowMethods: ["GET", "POST", "OPTIONS"],
	}),
);

app.get("/", (c) => {
	return c.text("OK");
});

// 取得所有小孩的資料
app.get("/kids", async (c) => {
	const kids = await db.select().from(kidsTable);
	return c.json(kids);
});

// 取得特定小孩的資料
app.get("/kids/:id", async (c) => {
	const id = c.req.param("id");
	const kid = await db.select().from(kidsTable).where(eq(kidsTable.id, id));

	if (kid.length === 0) {
		return c.json({ error: "Kid not found" }, 404);
	}

	return c.json(kid[0]);
});

// 新增小孩
app.post("/kids", async (c) => {
	const body = await c.req.json();

	const newKid = await db.insert(kidsTable).values({
		name: body.name,
		birthday: body.birthday,
	}).returning()

	return c.json(newKid[0], 201);
});

export default app;
