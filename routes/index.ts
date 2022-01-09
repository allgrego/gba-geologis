/**
 * All routes organized by version
 */
import {Router} from "express";
import v1Routes from "./v1";
// import v2Routes from "./v2";

const router = Router();

// Version 1
router.use("/v1", v1Routes);
// Version 2 [NOT YET]
// router.use("/v2", v2Routes);

export default router;
