import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/health", (_request, response) => {
  response.status(200).json({
    data: {
      service: "api",
      status: "ok"
    }
  });
});

export { healthRouter };
