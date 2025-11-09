import "dotenv/config";

export const config = {
  port: Number.parseInt(process.env.PORT || "3000", 10),
};
