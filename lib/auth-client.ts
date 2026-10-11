import { createAuthClient } from "better-auth/react";

// Mismo origen que la app: usa /api/auth del propio isc-tmr
export const authClient = createAuthClient();
