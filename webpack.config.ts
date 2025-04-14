import type { WebpackEnvOptions } from "@callstack/repack";
import type { Argv } from "webpack-cli";

export { type Argv };
export type Env = Argv["env"] &
  WebpackEnvOptions & {
    publicPath?: string;
  };

export default async (env: Env, argv: Argv) => {
  env ??= {};
  env.mode ??= argv.mode;
  env.platform ??= process.env.PLATFORM;
  if (!env.platform) {
    throw new Error("Missing platform");
  }

  const { default: config } =
    env.platform === "web"
      ? await import("./webpack.config.web.ts")
      : await import("./webpack.config.native.mjs");
  return config(env);
};
