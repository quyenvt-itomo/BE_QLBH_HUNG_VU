import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema, z } from "zod";
import { IError, ValidationError } from "@/shared/types/errors";
import { ErrorsMessages } from "../constants/errors";

type WhereValidate = "body" | "query" | "params";

export const getErrorsMessagess = (error: z.ZodError): IError[] => {
  const errorCodes: IError[] = [];

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    let errorCode: string;
    switch (issue.code) {
      case "invalid_type":
        errorCode = ErrorsMessages.invalid;
        break;
      case "invalid_format":
        if (
          issue.message?.toLowerCase().includes("required") ||
          issue.message?.toLowerCase().includes("undefined") ||
          issue.message?.toLowerCase().includes("expected")
        ) {
          errorCode = ErrorsMessages.required;
        } else {
          errorCode = ErrorsMessages.invalid;
        }
        break;

      case "too_small":
        errorCode = ErrorsMessages.min;
        break;

      case "too_big":
        errorCode = ErrorsMessages.max;
        break;

      case "custom":
        errorCode = ErrorsMessages.incorrect;
        break;

      default:
        errorCode = ErrorsMessages.incorrect;
    }

    errorCodes.push({
      field: path,
      code: errorCode,
    });
  });

  return [...new Set(errorCodes)]; // loại bỏ trùng lặp
};

export const zodValidate = (schema: ZodSchema, where: WhereValidate) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (where === "body") {
        req.body = schema.parse(req.body);
      } else if (where === "query") {
        const validated = schema.parse(req.query);
        // Force replace req.query with validated data using Object.defineProperty
        Object.defineProperty(req, "query", {
          value: validated,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else if (where === "params") {
        const validated = schema.parse(req.params);
        // Force replace req.params with validated data
        Object.defineProperty(req, "params", {
          value: validated,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = getErrorsMessagess(error);

        next(new ValidationError(`input.invalid`, errorMessages));
      } else {
        next(error);
      }
    }
  };
};
