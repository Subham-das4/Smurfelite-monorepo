import { Router } from "express";

import productRoutes from "../modules/product/product.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";

const apiRouter = Router();

apiRouter.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the SmurfElite API!",
    version: "1.0",
  });
});

apiRouter.use("/products", productRoutes);
apiRouter.use("/auth", authRoutes);

// Catch any routes that fall through
apiRouter.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

export default apiRouter;
