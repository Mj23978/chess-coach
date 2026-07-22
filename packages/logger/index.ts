/**
 * @repo/logger — thin consola wrapper.
 *
 * Dropped the @repo/env dependency: the log level is read directly from
 * process.env so this package has no workspace deps and is safe to import
 * anywhere (server, desktop Bun main, tests).
 */
import { createConsola, LogLevels } from "consola";

const logger = createConsola({
  level:
    process.env.NODE_ENV === "production"
      ? LogLevels.info
      : LogLevels.debug,
  defaults: { tag: "chess-coach" },
});

export default logger;
