import { Request, Response, NextFunction } from "express";
import { Database } from "../db";

export const rbacMiddleware = (db: Database) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userEmail = req.headers['x-user-email'] as string;
    const { collection } = req.params;
    const method = req.method;

    if (!userEmail) {
      return res.status(401).json({ error: "Unauthorized: Missing user email header" });
    }

    try {
      const data = await db.getData(userEmail);
      const currentUser = data.currentUser;

      if (!currentUser) {
        return res.status(403).json({ error: "Forbidden: User not found" });
      }

      // Admin has full access
      if (currentUser.role === 'Admin') {
        return next();
      }

      // Delete is Admin only
      if (method === 'DELETE') {
        return res.status(403).json({ error: "Forbidden: Only Admin can delete items" });
      }

      // Teacher/TA restrictions
      if (['classes', 'homework', 'tests'].includes(collection)) {
        if (currentUser.role === 'TA') {
          return res.status(403).json({ error: "Forbidden: TA cannot manage classes, homework, or tests" });
        }
      }

      // If we got here, it's a Teacher or TA doing a permitted action
      next();
    } catch (error) {
      console.error("RBAC Error:", error);
      res.status(500).json({ error: "Internal Server Error during RBAC check" });
    }
  };
};
