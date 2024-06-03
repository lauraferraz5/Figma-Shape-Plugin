figma.showUI(__html__);

figma.ui.onmessage = async (msg) => {
  if (msg.type === "apply-css") {
    const cssUrl = msg.cssUrl;

    const identifier = extractIdentifier(cssUrl);
    const kodekitUrl = `https://api.kodekit.io/api/GetKit`;

    try {
      console.log("Loading all pages...");
      await figma.loadAllPagesAsync();
      console.log("All pages loaded.");

      const kodekitData = await fetchKodekitKit(kodekitUrl, identifier);
      console.log("Kodekit data -> ", kodekitData);

      applyStylesToLayers(kodekitData.styles);      

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

// First code that worked
// async function fetchKodekitKit(url: string, identifier: string): Promise<unknown> {
//   const requestBody = JSON.stringify(identifier);
//   console.log("Request body:", requestBody);

//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: requestBody,
//   });
//   console.log("Response fetchKodekitKit -> ", response);

//   if (!response.ok) {
//     throw new Error("Network response was not ok");
//   }

//   const responseData = await response.json();
//   console.log("Response data:", responseData);

//   return responseData;
// }

async function fetchKodekitKit(url: string, identifier: string): Promise<{ styles: Record<string, Record<string, string | number>> }> {
  const requestBody = JSON.stringify(identifier);
  console.log("Request body:", requestBody);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: requestBody,
  });
  console.log("Response fetchKodekitKit -> ", response);

  if (!response.ok) {
    throw new Error("Network response was not ok");
  }

  const responseData = await response.json();
  console.log("Response data:", responseData);

  return responseData;
}

function applyStylesToLayers(styles: Record<string, Record<string, string | number>>) {
  const allPages = figma.root.children as PageNode[];
  for (const page of allPages) {
    const layers = page.findAll(node => "name" in node && node.name in styles) as SceneNode[];
    for (const layer of layers) {
      const style = styles[layer.name];
      for (const property in style) {
        layer.setPluginData(property, style[property].toString());
      }
    }
  }
}

// interface Kit {
//   styles: {
//     [selector: string]: {
//       [property: string]: string | number;
//     };
//   };
//   // Outras propriedades do kit podem ser adicionadas aqui conforme necessário
// }

