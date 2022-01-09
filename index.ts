/**
 * GBA Geologis Microservice APP
 *
 * @author: Gregorio Alvarez <galvarez@gbalogistic.com>
 * @description: Express API Microservices to manage Geographic data (as countries, continents and cities)
 * @copyright: GBA Logistics
 */
import * as express from "express";
import * as cors from "cors";
import routes from "./routes";

const app = express();

// Automatically allow cross-origin requests
app.use(cors({origin: true}));

// Global middleware
app.use((req, res, next)=>{
  // Not too much for now
  next();
});

/**
 * Routes
 */
app.use("/", routes);

// Rest
app.get("*", (req, res) => res.status(404).json({
  error: "not-found",
  message: "Invalid route",
}));

// Expose Express API as a single Cloud Function:
export default app;
