import {
  addTooltip,
  createElementWithAttributes,
  createElementWithClassNames,
} from "@src/utils/helpers";
import { CLASSNAME_PREFIX, getShadowHost } from ".";

export const createTooltipElem = (
  text: string | string[],
  position: {
    y?: "top" | "bottom";
    x?: "right" | "left" | "center";
  } = {
    y: "top",
    x: "center",
  },
) => {
  const div = document.createElement("div");
  const svg = div.appendChild(
    document.createElementNS("http://www.w3.org/2000/svg", "svg"),
  );
  svg.setAttribute("width", "24");
  svg.setAttribute("height", "24");
  svg.setAttribute("viewBox", "0 0 16 16");
  svg.setAttribute("fill", "none");

  svg.innerHTML = `
      <path d="M8 1C6.61553 1 5.26216 1.41054 4.11101 2.17971C2.95987 2.94888 2.06266 4.04213 1.53285 5.32122C1.00303 6.6003 0.86441 8.00777 1.13451 9.36563C1.4046 10.7235 2.07129 11.9708 3.05026 12.9497C4.02922 13.9287 5.2765 14.5954 6.63437 14.8655C7.99224 15.1356 9.3997 14.997 10.6788 14.4672C11.9579 13.9373 13.0511 13.0401 13.8203 11.889C14.5895 10.7378 15 9.38447 15 8C15 6.14348 14.2625 4.36301 12.9497 3.05025C11.637 1.7375 9.85652 1 8 1ZM8 14C6.81332 14 5.65328 13.6481 4.66658 12.9888C3.67989 12.3295 2.91085 11.3925 2.45673 10.2961C2.0026 9.19974 1.88378 7.99334 2.11529 6.82946C2.3468 5.66557 2.91825 4.59647 3.75736 3.75736C4.59648 2.91824 5.66558 2.3468 6.82946 2.11529C7.99335 1.88378 9.19975 2.0026 10.2961 2.45672C11.3925 2.91085 12.3295 3.67988 12.9888 4.66658C13.6481 5.65327 14 6.81331 14 8C14 9.5913 13.3679 11.1174 12.2426 12.2426C11.1174 13.3679 9.5913 14 8 14Z" fill="white"></path>
      <path d="M8 12.5C8.41421 12.5 8.75 12.1642 8.75 11.75C8.75 11.3358 8.41421 11 8 11C7.58579 11 7.25 11.3358 7.25 11.75C7.25 12.1642 7.58579 12.5 8 12.5Z" fill="white"></path>
      <path d="M8.50001 4.00001H7.75001C7.45435 3.99935 7.16147 4.05709 6.88819 4.16993C6.61491 4.28277 6.36661 4.44848 6.15755 4.65755C5.94848 4.86661 5.78277 5.11491 5.66993 5.38819C5.55709 5.66147 5.49935 5.95435 5.50001 6.25001V6.50001H6.50001V6.25001C6.50001 5.91848 6.6317 5.60054 6.86612 5.36612C7.10054 5.1317 7.41848 5.00001 7.75001 5.00001H8.50001C8.83153 5.00001 9.14947 5.1317 9.38389 5.36612C9.61831 5.60054 9.75001 5.91848 9.75001 6.25001C9.75001 6.58153 9.61831 6.89947 9.38389 7.13389C9.14947 7.36831 8.83153 7.50001 8.50001 7.50001H7.50001V9.75001H8.50001V8.50001C9.09674 8.50001 9.66904 8.26295 10.091 7.841C10.513 7.41904 10.75 6.84674 10.75 6.25001C10.75 5.65327 10.513 5.08097 10.091 4.65902C9.66904 4.23706 9.09674 4.00001 8.50001 4.00001Z" fill="white"></path>
    `;
  addTooltip(div, text, position.y, position.x);
  return div;
};

export const createElementLabel = (element: HTMLElement) => {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(`<${element.tagName.toLowerCase()}`));
  if (element.id) {
    div.appendChild(document.createTextNode(' id="'));
    const span = document.createElement("span");
    span.innerText = `${element.id}`;
    div.appendChild(span);
    div.appendChild(document.createTextNode('"'));
  }
  if (element.classList.length) {
    div.appendChild(document.createTextNode(' class="'));
    const span = document.createElement("span");
    span.innerText = `${element.className}`;
    div.appendChild(span);
    div.appendChild(document.createTextNode('"'));
  }
  div.appendChild(document.createTextNode(">"));
  return div;
};

export const createToolbarButton = (
  text: string,
  handler?: (e: MouseEvent) => void,
) => {
  const button = createElementWithClassNames(
    "button",
    `${CLASSNAME_PREFIX}-toolbar-button`,
  );
  button.textContent = text;
  handler && button.addEventListener("click", handler);
  return button;
};

const ignoreElements = [
  "SCRIPT",
  "STYLE",
  "META",
  "LINK",
  "NOSCRIPT",
  "TEMPLATE",
  "HTML",
  "HEAD",
];

const DEPTH_LIMIT = 2;

interface PreciseElementSelectionListProps {
  element: HTMLElement;
  listItemEventHandlers: Record<
    string,
    (element: HTMLElement) => (e: Event) => void
  >;
  selectedElementClickHandler: (e: Event) => void;
}

const getElementTree = ({
  listItemEventHandlers,
  selectedElementClickHandler,
}: Omit<PreciseElementSelectionListProps, "element">) => {
  return function buildElementTree(
    element: Element,
    target: Element,
    currentlySelected: HTMLElement,
    depth: number,
  ) {
    if (ignoreElements.includes(element.tagName)) {
      return;
    }
    const children = element.children;
    const li = document.createElement("li");
    const label = createElementLabel(element as HTMLElement);
    li.appendChild(label);
    target.appendChild(li);
    Object.entries(listItemEventHandlers).forEach(([eventName, handler]) =>
      label.addEventListener(eventName, handler(element as HTMLElement)),
    );

    const currentEl = element.isEqualNode(currentlySelected);
    if (currentEl) {
      li.classList.add("current-child");
      label.addEventListener("dblclick", selectedElementClickHandler);
    }
    if (!children.length) {
      return;
    }
    if (currentEl || depth + 1 < DEPTH_LIMIT) {
      const ul = document.createElement("ul");

      li.appendChild(ul);
      for (const child of children) {
        buildElementTree(child, ul, currentlySelected, depth + 1);
      }
    }
  };
};

export const createPreciseElementSelectionList = (
  props: PreciseElementSelectionListProps,
) => {
  const { element, listItemEventHandlers, selectedElementClickHandler } = props;

  const ul = document.createElement("ul");
  const parentElement =
    element.parentElement && element.parentElement.tagName !== "HTML"
      ? element.parentElement
      : null;

  getElementTree({ listItemEventHandlers, selectedElementClickHandler })(
    parentElement ? parentElement : element,
    ul,
    element,
    parentElement ? 0 : 1,
  );
  return ul;
};

export const createPreciseSelectionContainer = () => {
  const { shadowRoot } = getShadowHost();
  const container = shadowRoot.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-precise-selection`),
  );
  container.id = `${CLASSNAME_PREFIX}-precise-selection`;
  const div = container.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-tooltip-wrapper`),
  );
  div.appendChild(
    createTooltipElem(
      [
        "Click on list item to select a new element",
        "Double click on selected item in the list to open it in Picture-in-Picture",
      ],
      {
        y: "top",
        x: "right",
      },
    ),
  );
  container.appendChild(createToolbarButton("Select"));
  return container;
};

export const buildPreciseSelectionPanel = (
  props: PreciseElementSelectionListProps,
) => {
  const { selectedElementClickHandler } = props;
  const list = createPreciseElementSelectionList(props);
  const { shadowRoot } = getShadowHost();

  let container = shadowRoot.getElementById(
    `${CLASSNAME_PREFIX}-precise-selection`,
  );
  if (!container) {
    container = createPreciseSelectionContainer();
  }
  container.style.display = "block";
  const tooltip = container.firstElementChild!;
  const selectButton = container.lastElementChild!;
  (selectButton as HTMLButtonElement).onclick = selectedElementClickHandler;
  container.replaceChildren(tooltip, list, selectButton);
};

export const hidePreciseSelectionPanel = () => {
  const { shadowRoot } = getShadowHost();
  const container = shadowRoot.getElementById(
    `${CLASSNAME_PREFIX}-precise-selection`,
  );
  container?.style.setProperty("display", "none");
};

interface CheckboxProps {
  label: string;
  onChange: (e: Event) => void;
  tooltipText?: string;
  checkboxProps: {
    attributes: Record<string, string>;
    className: string;
  };
}

export const createCheckbox = ({
  label,
  onChange,
  tooltipText,
  checkboxProps: { attributes, className },
}: CheckboxProps) => {
  const labelElem = document.createElement("label");
  labelElem.innerText = label;
  if (tooltipText) {
    addTooltip(labelElem, tooltipText);
  }
  const checkbox = createElementWithAttributes(
    "input",
    {
      type: "checkbox",
      ...attributes,
    },
    className,
  ) as HTMLInputElement;
  checkbox.addEventListener("change", onChange);
  labelElem.appendChild(checkbox);
  return { label: labelElem, checkbox };
};
