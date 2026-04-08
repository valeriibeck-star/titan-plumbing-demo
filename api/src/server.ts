import app from "./app.js";
import { config } from "./config/env.js";

app.listen(config.port, () => {
  console.log(
    `[kompozit-erp] API running on http://localhost:${config.port} (${config.nodeEnv})`
  );
});
