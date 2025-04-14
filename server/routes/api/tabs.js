const { Router } = require("express");
const router = Router();
const tabsController = require("../../controllers/tabsController");
// const { isAuth } = require("../../middleware/authMiddleware");
const passport = require("passport");

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  tabsController.getAllTabs
);
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  tabsController.createTab
);
router.get(
  "/:tabId",
  passport.authenticate("jwt", { session: false }),
  tabsController.getTab
);
router.put(
  "/:tabId",
  passport.authenticate("jwt", { session: false }),
  tabsController.updateTab
);
router.delete(
  "/:tabId",
  passport.authenticate("jwt", { session: false }),
  tabsController.deleteTab
);

module.exports = router;
