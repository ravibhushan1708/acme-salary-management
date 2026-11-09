import "./env.js";
import { PrismaClient } from "@prisma/client";
import { createApp } from "./app.js";
import { port } from "./env.js";

const prisma = new PrismaClient();
const app = createApp(prisma);

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
