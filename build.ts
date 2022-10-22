import shell from "shelljs";
import appConfig from "./app.json";
import { createWriteStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { faker } from "@faker-js/faker";
import { https } from "follow-redirects";
import sharp from "sharp";

function generateImages(amount: number = 5) {
  return Array.from({ length: amount }, () => faker.image.cats());
}

async function processImage(
  url: string,
  imagePath: string,
  thumbnailPath: string
) {
  const imageStream = createWriteStream(imagePath);
  const thumbnailStream = createWriteStream(thumbnailPath);
  https.get(url, (request) => {
    request.pipe(imageStream);
    const sharpInstance = sharp();
    sharpInstance
      .resize(200, 200, {
        fit: sharp.fit.cover,
      })
      .pipe(thumbnailStream);

    imageStream.on("finish", () => {
      imageStream.close();
    });

    request.pipe(sharpInstance);

    thumbnailStream.on("finish", () => {
      thumbnailStream.close();
    });
  });
}

(async function build() {
  console.log("Starting build process...");
  shell.rm("-rf", "public");
  shell.mkdir("public");
  shell.mkdir(path.join("public", "images"));
  shell.mkdir(path.join("public", "thumbnails"));

  console.log("Downloading images...");
  const imagesUrls = generateImages(10);
  await Promise.all(
    imagesUrls.map((imageUrl, index) =>
      processImage(
        imageUrl,
        path.join("public", "images", `${index}.jpg`),
        path.join("public", "thumbnails", `${index}.jpg`)
      )
    )
  );

  const imagesContent = imagesUrls
    .map(
      (_, index) => `
    <a href="/ssg-example-cats/images/${index}.jpg">
        <img src="/ssg-example-cats/thumbnails/${index}.jpg">
    </a>
  `
    )
    .join("");

  const imagesGrid = `
        <div class="images-grid">
            ${imagesContent}
        </div>
  `;

  const htmlFile = (await fs.readFile("index.html"))
    .toString()
    .replace("$TITLE", appConfig.title)
    .replace("$DESCRIPTION", appConfig.description)
    .replace("$CONTENT", imagesGrid);

  await fs.writeFile("public/index.html", htmlFile);
  console.log("Success!");
})();
