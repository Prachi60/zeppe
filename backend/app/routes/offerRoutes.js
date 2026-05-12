import express from "express";
import multer from "multer";
import {
  getPublicOffers,
  getAdminOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  reorderOffers,
} from "../controller/offerController.js";
import {
  getPublicOfferSections,
  getAdminOfferSections,
  createOfferSection,
  updateOfferSection,
  deleteOfferSection,
  reorderOfferSections,
  uploadOfferSectionImage,
} from "../controller/offerSectionController.js";
import { verifyToken, allowRoles } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/offers", getPublicOffers);
router.get("/offer-sections", getPublicOfferSections);

router.get(
  "/admin-offers",
  verifyToken,
  allowRoles("admin"),
  getAdminOffers,
);

router.post(
  "/admin-offers",
  verifyToken,
  allowRoles("admin"),
  createOffer,
);

router.put(
  "/admin-offers/reorder",
  verifyToken,
  allowRoles("admin"),
  reorderOffers,
);

router.put(
  "/admin-offers/:id",
  verifyToken,
  allowRoles("admin"),
  updateOffer,
);

router.delete(
  "/admin-offers/:id",
  verifyToken,
  allowRoles("admin"),
  deleteOffer,
);

router.get(
  "/admin-offer-sections",
  verifyToken,
  allowRoles("admin"),
  getAdminOfferSections,
);
router.post(
  "/admin-offer-sections",
  verifyToken,
  allowRoles("admin"),
  createOfferSection,
);
router.put(
  "/admin-offer-sections/reorder",
  verifyToken,
  allowRoles("admin"),
  reorderOfferSections,
);
router.put(
  "/admin-offer-sections/:id",
  verifyToken,
  allowRoles("admin"),
  updateOfferSection,
);
router.delete(
  "/admin-offer-sections/:id",
  verifyToken,
  allowRoles("admin"),
  deleteOfferSection,
);

router.post(
  "/admin-offer-sections/upload",
  verifyToken,
  allowRoles("admin"),
  upload.single("image"),
  uploadOfferSectionImage,
);

export default router;

