figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === "apply-styles") {
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });  // It's important to know that any time we are changing the contents of a text node, we first need to load the font that the text node is using, that's why I have this line

    const cssUrl = msg.cssUrl;

    const identifier = extractIdentifier(cssUrl);

    // Production Kodekit URL
    // const kodekitUrl = `https://api.kodekit.io/api/GetKitCurrentRevision`;

    const currentRevisionURL = `https://kodekit-api-laura.azurewebsites.net/publicapi/GetKitCurrentRevision`;

    try {
      // console.log("Loading all pages...");
      await figma.loadAllPagesAsync();        // check if it is really necessary to load all pages
      // console.log("All pages loaded.");

      const currentRevision = await fetchCurrentKitRevision(currentRevisionURL, identifier);
      // console.log("Related Kits -> ", currentRevision);

      await applyStyles(currentRevision);

      figma.notify("CSS definitions applied to all pages.");
    } catch (error) {
      figma.notify("Failed to fetch or apply CSS.");
      console.error(error);
    }

    figma.closePlugin();
  }
};

function extractIdentifier(cssUrl: string): string {
  const urlParts = cssUrl.split("/");
  const cssFileName = urlParts[urlParts.length - 1];
  const identifier = cssFileName.replace(".css", "");
  return identifier;
}

async function fetchCurrentKitRevision(url: string, identifier: string) {
  const requestBody = JSON.stringify(identifier);
  // console.log("Request body for related kits:", requestBody);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestBody,    
  });
  // console.log("Response fetchCurrentKitRevision  -> ", response);

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const responseData = await response.json();
  // console.log("Response data for current kit revision:", responseData);

  return responseData;
}

interface Color {
  name: string;
  value: {
    hexValue: string;
  };
}

interface Font {
  family: string;
  size: {
    value: number;
  };
  lineHeight: {
    value: number;
    unit: string;
  };
}

interface TextStyleData {
  font: Font;
}

interface CurrentRevision {
  colors: Color[];
  headings: TextStyleData;
  paragraphs: TextStyleData;
  buttons: TextStyleData;
  inputs: TextStyleData;
}

async function applyColors(colors: Color[]) {
  // console.log("Applying colors:", colors);
  for (const color of colors) {
    const paintStyle = figma.createPaintStyle();
    paintStyle.name = color.name;
    paintStyle.paints = [{
      type: 'SOLID',
      color: hexToRgb(color.value.hexValue)
    }];
    // console.log("Paint style created:", paintStyle);
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

async function applyTextStyles(textStyleData: TextStyleData, type: string) {
  // console.log("Applying text styles:", textStyleData);
  const font = textStyleData.font;
  if (!font || !font.family || !font.size) return;

  const fontPromises: Promise<void>[] = [];

  if (font) {
    fontPromises.push(figma.loadFontAsync({ family: font.family, style: "Regular" }));
  }

  await Promise.all(fontPromises);

  const textStyle = figma.createTextStyle();
  textStyle.name = `${type}-${font.family}`;
  textStyle.fontSize = font.size.value;
  textStyle.fontName = { family: font.family, style: "Regular" };
  textStyle.lineHeight = { value: font.lineHeight.value, unit: font.lineHeight.unit === "px" ? "PIXELS" : "PERCENT" };
  // Add other text style attributes here if necessary

  // console.log("Text style created:", textStyle);
}

async function applyStyles(currentRevision: CurrentRevision) {
  console.log("Applying styles:", currentRevision);
  await applyColors(currentRevision.colors);
  await applyTextStyles(currentRevision.headings, "heading");
  await applyTextStyles(currentRevision.paragraphs, "paragraph");
  await applyTextStyles(currentRevision.buttons, "button");
  await applyTextStyles(currentRevision.inputs, "input");
}

