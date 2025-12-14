import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 5000;

import { sequelize } from "./models";
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected via Sequelize");
  } catch (error) {
    console.error("❌ Database connection failed", error);
  }
})();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});
