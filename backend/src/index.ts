import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.middleware";
import { logger } from "./utils/logger";
import { router } from "./routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use("/api", router);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  logger.info(`NutriScan AI backend listening on port ${env.port}`, { env: env.nodeEnv, aiChatProvider: env.aiChatProvider });
});
