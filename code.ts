figma.showUI(__html__);


figma.ui.onmessage = async (msg) => {
  if (msg.type === 'apply-css') {
    const cssUrl = msg.cssUrl;
    try {
      console.log("Loading all pages...");
      await figma.loadAllPagesAsync();
      console.log("All pages loaded.");

      const response = await fetch(cssUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const cssText = await response.text();
      const cssRules = parseCSS(cssText);

      const allPages = figma.root.children as PageNode[];
      for (const page of allPages) {
        applyCSSRulesToNodes(cssRules, [...page.children]);
      }
      
      figma.notify("CSS definitions applied to all pages.");
    } catch (error) {
      figma.notify("Failed to fetch or apply CSS.");
      console.error(error);
    }

    figma.closePlugin();
  }
};

interface CSSRules {
  [selector: string]: {
    [property: string]: string;
  };
}

function parseCSS(cssText: string): CSSRules {
  const rules: CSSRules = {};
  const css = cssText.split('}');
  css.forEach(rule => {
    const [selectors, properties] = rule.split('{');
    if (!selectors || !properties) return;
    selectors.split(',').forEach(selector => {
      const cleanSelector = selector.trim();
      if (!rules[cleanSelector]) rules[cleanSelector] = {};
      properties.split(';').forEach(property => {
        const [prop, value] = property.split(':');
        if (prop && value) {
          rules[cleanSelector][prop.trim()] = value.trim();
        }
      });
    });
  });
  return rules;
}

function applyCSSRulesToNodes(cssRules: CSSRules, nodes: SceneNode[]) {
  nodes.forEach(node => {
    // Apply CSS rules to the node
    if ('fills' in node && cssRules['body']) {
      const fills = cssRules['body']['background-color'];
      if (fills) {
        node.fills = [{ type: 'SOLID', color: hexToRgb(fills) }];
      }
    }
    if ('fontSize' in node && cssRules['body']) {
      const fontSize = cssRules['body']['font-size'];
      if (fontSize) {
        node.fontSize = parseInt(fontSize);
      }
    }
    // More mappings will be added as needed, I only have these to test
  });
}

function hexToRgb(hex: string) {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}
