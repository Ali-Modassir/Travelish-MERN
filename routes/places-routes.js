const express = require("express");
const router = express.Router();
const { check } = require("express-validator");
const checkauth = require("../middleware/check-auth");

const placesControllers = require("../controllers/places-controllers");
const fileUpload = require("../middleware/file-upload");

router.get("/:pid", placesControllers.getPlaceByID);

router.get("/users/:uid", placesControllers.getPlacesByUserID);

router.use(checkauth);

router.post(
  "/",
  fileUpload.single("image"),
  [
    check("title").not().isEmpty(),
    check("description").isLength({ min: 5 }),
    check("address").not().isEmpty(),
  ],
  placesControllers.createPlace
);

router.patch(
  "/:pid",
  [check("title").not().isEmpty(), check("description").isLength({ min: 5 })],
  placesControllers.updatePlace
);

router.delete("/:pid", placesControllers.deletePlace);

module.exports = router;
