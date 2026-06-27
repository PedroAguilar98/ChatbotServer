import { Request, Response, NextFunction } from "express";

export function noCacheMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    res.set("Cache-Control", "no-store");
    next();
}