import { Router } from "express";

import productRoutes from "../modules/product/product.routes.js";
import authRoutes from "../modules/auth/auth.routes.js";
import cartRoutes from "../modules/cart/cart.routes.js";
import orderRoutes from "../modules/orders/orders.routes.js";
// import paypalRoutes from "../modules/payments/paypal/paypal.routes.js";
import userRoutes from "../modules/user/user.routes.js";
import enquiryRoutes from "../modules/enquiry/enquiry.routes.js";
import logRoutes from "../modules/logs/logs.routes.js";
import nowpaymentsRoutes from "../modules/payments/nowpayments/nowpayments.routes.js";
import bypassRoutes from "../modules/payments/bypass/bypass.routes.js";
import gameCategoryRoutes from "../modules/game-category/game-category.routes.js";
import disputeRoutes from "../modules/dispute/dispute.routes.js";
import walletRoutes from "../modules/wallet/wallet.routes.js";
import emailRoutes from "../modules/email/email.routes.js";

const apiRouter = Router();

apiRouter.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to the SmurfElite API!",
    version: "1.0",
  });
});

apiRouter.use("/products", productRoutes);
apiRouter.use("/auth", authRoutes);
apiRouter.use("/cart", cartRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/payments/nowpayments", nowpaymentsRoutes);
apiRouter.use("/payments/bypass", bypassRoutes);
apiRouter.use("/users", userRoutes);
apiRouter.use("/enquiries", enquiryRoutes);
apiRouter.use("/game-categories", gameCategoryRoutes);
apiRouter.use("/disputes", disputeRoutes);
apiRouter.use("/wallets", walletRoutes);
apiRouter.use("/email", emailRoutes);
apiRouter.use("/logs", logRoutes);

// Catch any routes that fall through
apiRouter.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

export default apiRouter;
