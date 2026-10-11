const required = (name: string): string => {
  const value = process.env[name];
  if (!value)
    throw new Error(`Falta la variable de entorno ${name} (ver .env.example)`);

  return value;
};

const withoutTrailingSlash = (url: string) => url.replace(/\/+$/, "");

export const env = {
  /** Issuer del gate (Better Auth oauth-provider), incluye su basePath */
  OIDC_ISSUER: withoutTrailingSlash(
    process.env.OIDC_ISSUER ?? "http://localhost:3000/api/auth",
  ),
  OIDC_CLIENT_ID: required("OIDC_CLIENT_ID"),
  OIDC_CLIENT_SECRET: required("OIDC_CLIENT_SECRET"),
  /** Identifier del Resource registrado en el gate; viaja como `aud` del access token */
  OIDC_RESOURCE: withoutTrailingSlash(
    process.env.OIDC_RESOURCE ?? "http://localhost:4200/api",
  ),
};
