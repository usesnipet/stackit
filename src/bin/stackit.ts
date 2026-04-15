import { pathToFileURL } from "node:url";
import { main } from "../index.js";

async function run() {
  try {
    await main(process.argv);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(String((err as any)?.message || err));
    process.exitCode = 1;
  }
}

const invokedAsScript = import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedAsScript) run();

