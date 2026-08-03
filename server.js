const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;
const root = __dirname;

app.disable("x-powered-by");

app.use(
  express.static(root, {
    extensions: ["html"],
    maxAge: "1h",
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(root, "Dashboard_DPO_5S_Completo.html"));
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(root, "Dashboard_DPO_5S_Completo.html"));
});

app.listen(port, () => {
  console.log(`Dashboard DPO 5S listening on port ${port}`);
});
