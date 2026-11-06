// Copies src/styles.css to dist/styles.css.
// Consumers import it so Tailwind finds the class names used inside this package.
import { copyFileSync } from "node:fs";

copyFileSync("src/styles.css", "dist/styles.css");
