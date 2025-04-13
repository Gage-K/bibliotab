const { Router } = require("express");
const router = Router();
const usersController = require("../../controllers/usersController");
const passport = require("passport");

router.get(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  usersController.getUser
); // need session false to ignore the session middleware
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  usersController.updateUserEmail
);
router.post(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  usersController.insertUser
);
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  usersController.deleteUser
);

module.exports = router;
