import express from "express";
import cors from "cors";

import authRouter from "./routes/auth";
import postsRouter from "./routes/posts";
import waitlistRouter from "./routes/waitlist";
import usersRouter from "./routes/users";
import followRouter from "./routes/follow";
import notificationsRouter from "./routes/notifications";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/waitlist", waitlistRouter);
app.use("/api/users", usersRouter);
app.use("/api/follow", followRouter);
app.use("/api/notifications", notificationsRouter);

app.get("/", (_req, res) => {
  res.json({ message: "BridgeCN API is running 🚀" });
});

app.listen(4000, () => {
  console.log("Server running on http://localhost:4000");
});