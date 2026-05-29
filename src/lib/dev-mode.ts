export const isLocalDevAuthBypass =
  process.env.NODE_ENV !== "production" &&
  (!process.env.AUTH_DISCORD_ID || !process.env.AUTH_DISCORD_SECRET);
