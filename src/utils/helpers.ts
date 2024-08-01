export const createElementWithClassNames = (
  tagName: string,
  ...className: string[]
) => {
  const newElement = document.createElement(tagName);

  newElement.classList.add(...className);
  return newElement;
};

export const createElementWithAttributes = (
  tagName: string,
  attributes?: Record<string, string> | null,
  ...className: string[]
) => {
  const newElement = document.createElement(tagName);

  attributes &&
    Object.entries(attributes).forEach(([key, value]) => {
      newElement.setAttribute(key, value);
    });

  newElement.classList.add(...className);

  return newElement;
};

export const downloadCanvas = (canvas: HTMLCanvasElement) => {
  const link = document.createElement("a");
  link.download = "screenshot.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
};

export function dumpCSSText(element: Element) {
  let s = "";
  const o = getComputedStyle(element);
  for (const style of o) {
    s += style + ": " + o.getPropertyValue(style) + ";";
  }
  return s;
}
const transparentValues = ["rgba(0, 0, 0, 0)", "transparent"];

export const getElementBackgroundColor = (element: HTMLElement): string => {
  const backgroundColor = window.getComputedStyle(element).backgroundColor;

  if (!transparentValues.includes(backgroundColor)) {
    return backgroundColor;
  }
  if (!element.parentElement) {
    return "white";
  }
  return getElementBackgroundColor(element.parentElement);
};

export const createQuerySelector = (element: HTMLElement, deep = 4): string => {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : "";
  if (id) {
    deep = 0;
  }
  const classes = element.className
    ? `.${element.className.split(" ").join(".")}`
    : "";
  const parent = element.parentElement;
  let selector = `${tagName}${id}${classes}`;
  if (deep !== 0 && parent && element.tagName !== "BODY") {
    const parentSelector = createQuerySelector(element.parentElement, deep - 1);
    selector = `${parentSelector} > ${selector}`;
  }
  return selector;
};

export function synchronizeCssStyles(
  src: HTMLElement,
  destination: HTMLElement,
  recursively: boolean,
) {
  // if recursively = true, then we assume the src dom structure and destination dom structure are identical (ie: cloneNode was used)

  // window.getComputedStyle vs document.defaultView.getComputedStyle
  // @TBD: also check for compatibility on IE/Edge
  if (!document.defaultView) {
    return;
  }
  destination.style.cssText = document.defaultView.getComputedStyle(
    src,
    "",
  ).cssText;

  if (recursively) {
    const vSrcElements = src.getElementsByTagName("*");
    const vDstElements = destination.getElementsByTagName("*");

    for (let i = vSrcElements.length; i--; ) {
      const vSrcElement = vSrcElements[i];
      const vDstElement = vDstElements[i];
      //          console.log(i + " >> " + vSrcElement + " :: " + vDstElement);
      if (document.defaultView) {
        if (vDstElement instanceof HTMLElement) {
          vDstElement.style.cssText = document.defaultView.getComputedStyle(
            vSrcElement,
            "",
          ).cssText;
        }
      }
    }
  }
}

export const addTooltip = (
  element: Element,
  text: string | string[],
  positionY?: "top" | "bottom",
  positionX?: "right" | "left" | "center",
) => {
  if (Array.isArray(text)) {
    element.setAttribute("pip-tooltip", text[0]);
    element.setAttribute("pip-tooltip-ln2", text[1]);
  } else {
    element.setAttribute("pip-tooltip", text);
  }

  element.setAttribute("pip-tooltip-position-y", positionY ?? "top");
  element.setAttribute("pip-tooltip-position-x", positionX ?? "center");
};

export const deepElementCopy = (element: Element) => {
  const clone = element.cloneNode() as Element;
  if (clone instanceof Element) {
    clone.append = document.createElement("div").append.bind(clone);
  }

  const children = Array.from(element.children);
  for (const child of children) {
    const newChild = deepElementCopy(child);
    // console.log("🚀 ~ deepElementCopy ~ newChild:", newChild);
    clone.append(newChild);
  }

  return clone;
};

const relevantStyles = [
  "background-olor",
  "color",
  "font-size",
  "font-family",
  "font-weight",
  "font-style",
  "color-scheme",
];

export const getRelevantStyles = (element: HTMLElement) => {
  const styles = window.getComputedStyle(element);
  let relevantStylesString = "";

  for (const style of relevantStyles) {
    const value = styles.getPropertyValue(style);
    if (value !== "" && value !== "none") {
      relevantStylesString += style + ": " + value + ";";
    }
  }
  return relevantStylesString;
};

export const copyStyleSheetIntoPipWindow = (
  document: Document,
  pipWindow: Window,
) => {
  [...document.styleSheets].forEach((styleSheet) => {
    try {
      const cssRules = [...styleSheet.cssRules]
        .map((rule) => rule.cssText)
        .join("");
      const style = document.createElement("style");

      style.textContent = cssRules;
      pipWindow.document.head.appendChild(style);
    } catch (_err) {
      const link = document.createElement("link");

      link.rel = "stylesheet";
      link.type = styleSheet.type;
      link.media = styleSheet.media.toString();
      link.href = styleSheet.href!;
      pipWindow.document.head.appendChild(link);
    }
  });
};
