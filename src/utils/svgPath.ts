import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
});

export const getSvgPath = (imgPath: string) => {
    if (!imgPath || !/\.svg$/i.test(imgPath)) throw new Error(
        "Please provide a valid SVG file path."
    );

    const filePath = path.resolve(process.cwd(), imgPath);

    if (!fs.existsSync(filePath)) {
        throw new Error(`SVG file not found: ${filePath}`);
    }

    const svgImage = fs.readFileSync(filePath, {
        encoding: "utf-8",
    });

    const svgData = parser.parse(svgImage);
    const svgPath = svgData.svg.g.path;

    return Array.isArray(svgPath) ? svgPath : [svgPath];
};

console.log(getSvgPath("public/map/Nigeria_map.svg").map(data => data.d))
