import { Router, urlencoded } from "express";
import { notification } from "../validation/payment";
import { JSON_BODY_LIMIT } from "../constants/domain";
import { PAYFAST } from "../constants/payfast";
import { receiveNotification } from "../services/paymentService";

export const paymentsRouter = Router();
const parseForm = urlencoded({ extended: false, limit: JSON_BODY_LIMIT });
paymentsRouter.post(
  "/payfast/notify",
  (req, res, next) => {
    parseForm(req, res, (error: unknown) => {
      if (error) {
        res.end();
        return;
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const parsed = notification.safeParse(req.body);
      if (parsed.success) await receiveNotification(parsed.data);
    } catch {
      console.error(PAYFAST.notificationFailed);
    }
    res.end();
  },
);
