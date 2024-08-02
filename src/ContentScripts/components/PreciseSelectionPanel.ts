import { createElementWithClassNames } from "@src/utils/helpers";
import { CLASSNAME_PREFIX, getShadowHost } from "..";
import {
  createElementLabel,
  createToolbarButton,
  createTooltipElem,
} from "../dom";

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
  const cancelButton = container.appendChild(
    createToolbarButton("Cancel", () => {
      removePreciseSelection();
    }),
  );
  cancelButton.classList.add(`${CLASSNAME_PREFIX}-secondary`);
  cancelButton.id = `${CLASSNAME_PREFIX}-cancel-precise-selection`;
  const selectButton = container.appendChild(createToolbarButton("Select"));
  selectButton.id = `${CLASSNAME_PREFIX}-select-precise-selection`;

  return container;
};

export const getPreciseSelectionContainer = () => {
  const { shadowRoot } = getShadowHost();

  return shadowRoot.getElementById(`${CLASSNAME_PREFIX}-precise-selection`);
};

export const removePreciseSelection = () => {
  const container = getPreciseSelectionContainer();
  container?.remove();
};

export const buildPreciseSelectionPanel = (
  props: PreciseElementSelectionListProps,
) => {
  const { shadowRoot } = getShadowHost();
  const { selectedElementClickHandler } = props;
  const list = createPreciseElementSelectionList(props);

  let container = getPreciseSelectionContainer();

  if (!container) {
    container = createPreciseSelectionContainer();
  }
  container.style.display = "block";
  const tooltip = container.firstElementChild!;
  const selectButton = shadowRoot.getElementById(
    `${CLASSNAME_PREFIX}-select-precise-selection`,
  )!;
  const cancelButton = shadowRoot.getElementById(
    `${CLASSNAME_PREFIX}-cancel-precise-selection`,
  )!;
  (selectButton as HTMLButtonElement).onclick = selectedElementClickHandler;
  container.replaceChildren(tooltip, list, cancelButton, selectButton);
};

export const hidePreciseSelectionPanel = () => {
  const container = getPreciseSelectionContainer();
  container?.style.setProperty("display", "none");
};
