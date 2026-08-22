import { JwtPayload, UserContext } from "./interfaces";
import { Store } from "@/database/models/Store";
import { PermissionStructure } from "@/shared/middleware/permission.middleware";
import { SystemPermissionStructure } from "@/database/models/SystemRole";

declare global {
  namespace Express {
    // Override Passport's User interface to be JwtPayload
    interface User extends JwtPayload {}

    interface Request {
      user?: JwtPayload;
      userContext?: UserContext | null;
      permissions?: SystemPermissionStructure | PermissionStructure;
      employeeId?: string;
      storeCode?: string;
      store?: Store;
      cookies: {
        access_token?: string;
        refresh_token?: string;
        [key: string]: any;
      };
    }
  }
}

export {};
