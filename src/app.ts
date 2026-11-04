import express from "express";
import helmet from "helmet";
import teacherRoutes from "./routes/teacher.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.use("/api", teacherRoutes);

app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorHandler); // must be last

export default app;