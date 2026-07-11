import { Response } from "express";
import { AuthRequest } from "../middleware/auth.js";
import {
  AccountRequestError,
  deleteAccount,
  streamAccountExport,
} from "../services/account.service.js";

export const exportAccount = async (req: AuthRequest, res: Response) => {
  try {
    await streamAccountExport(req.userId!, res);
  } catch (error) {
    if (res.headersSent) {
      res.destroy();
      return;
    }

    const statusCode =
      error instanceof AccountRequestError ? error.statusCode : 500;
    return res.status(statusCode).json({
      message:
        error instanceof AccountRequestError
          ? error.message
          : "The account export could not be prepared.",
    });
  }
};

export const removeAccount = async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as {
      currentPassword?: string;
      confirmationPhrase?: string;
    } | undefined;
    const currentPassword = body?.currentPassword;
    const confirmationPhrase = body?.confirmationPhrase;

    if (
      typeof currentPassword !== "string" ||
      typeof confirmationPhrase !== "string"
    ) {
      return res.status(400).json({
        message: "Current password and confirmation phrase are required.",
      });
    }

    await deleteAccount(
      req.userId!,
      currentPassword,
      confirmationPhrase,
    );
    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    const statusCode =
      error instanceof AccountRequestError ? error.statusCode : 500;
    return res.status(statusCode).json({
      message:
        error instanceof AccountRequestError
          ? error.message
          : "The account could not be deleted.",
    });
  }
};
