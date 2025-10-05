import { Context, Next } from "hono";
import { z } from "zod";

type ValidateTarget = "json" | "query" | "param" | "header";

/**
 * Custom validation middleware using Zod
 * Alternative to @hono/zod-validator
 */
export function validate<T extends z.ZodType>(
  target: ValidateTarget,
  schema: T,
) {
  return async (c: Context, next: Next) => {
    let data: unknown;

    // Get data based on target
    switch (target) {
      case "json":
        data = await c.req.json();
        break;
      case "query":
        data = c.req.query();
        break;
      case "param":
        data = c.req.param();
        break;
      case "header":
        // Convert Headers to plain object
        data = Object.fromEntries(c.req.raw.headers.entries());
        break;
    }

    // Validate with Zod
    const result = schema.safeParse(data);

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: {
            message: `Invalid ${target}`,
            issues: result.error.issues,
          },
        },
        400,
      );
    }

    // Store validated data in context
    c.set(`validated_${target}`, result.data);

    return next();
  };
}

/**
 * Get validated data from context
 */
export function getValidated<T>(c: Context, target: ValidateTarget): T {
  return c.get(`validated_${target}`) as T;
}
