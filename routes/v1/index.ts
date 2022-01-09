import {logger} from "firebase-functions";
import {Router} from "express";
import credentials from "../../config/credentials";
import countriesRoutes from "./countries";
import continentsRoutes from "./continents";
import citiesRoutes from "./cities";


const router = Router();

// Authentication Middleware for v1 routes
router.use((req, res, next) => {
  // Super permission if secret
  if (req.query.publickey===credentials.superPass) {
    logger.info("Requested with public key");
    next();
  } else if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer ")) {
    // If not bearer token
    res.status(403).send("Unauthorized");
    return;
  } else {
    // Provided Bearer token
    const bearerToken = req.headers.authorization!.split("Bearer ")[1];
    // Verify token
    if (bearerToken === credentials.bearerToken) next();
    else res.status(403).send("Unauthorized");
    return;
  }
});

// Index
router.get("/", (req, res)=>res.json({
  name: "GBA Geologis",
  description: "API for geographical information (countries, continents, cities, etc)",
  version: "1.1.0",
}));

// Countries routes
router.use("/countries", countriesRoutes);
// Continents routes
router.use("/continents", continentsRoutes);
// Cities routes
router.use("/cities", citiesRoutes);

export default router;
