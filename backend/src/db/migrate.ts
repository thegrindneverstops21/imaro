import { ExitCode, SEED_ONLY_ARG, SqlFile } from "../constants/domain";
import { applySqlFiles } from "./applySqlFiles";
import { pool } from "./pool";

// npm run db:setup  -> schema + seed (wipes existing data)
// npm run db:seed   -> seed only
const files =
  process.argv[2] === SEED_ONLY_ARG
    ? [SqlFile.Seed]
    : [SqlFile.Schema, SqlFile.Seed];

applySqlFiles(files)
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = ExitCode.Failure;
  })
  .finally(() => pool.end());
