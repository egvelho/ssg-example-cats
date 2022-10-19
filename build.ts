import shell from "shelljs";
import appConfig from "./app.json";
import fs from "fs/promises";

(async function build() {
  console.log("Starting build process...");
  shell.rm("-rf", "public");
  shell.mkdir("public");

  const htmlFile = (await fs.readFile("index.html"))
    .toString()
    .replace("$TITLE", appConfig.title)
    .replace("$DESCRIPTION", appConfig.description)
    .replace("$CONTENT", appConfig.content);

  await fs.writeFile("public/index.html", htmlFile);
  console.log("Success!");
})();
