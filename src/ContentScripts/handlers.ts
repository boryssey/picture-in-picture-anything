import { CLASSNAME_PREFIX, closeTool, getShadowHost } from ".";
import debounce from "lodash/debounce";
import {
  copyStyleSheetIntoPipWindow,
  createElementWithClassNames,
  createQuerySelector,
  getElementBackgroundColor,
  getRelevantStyles,
} from "@src/utils/helpers";
import { StorageValue } from "@src/utils/storage";
import {
  buildPreciseSelectionPanel,
  createCheckbox,
  createToolbarButton,
} from "./dom";

let selectedElement: HTMLElement | null = null;
let elementOverlay: HTMLElement | null = null;

const preciseSelectionValue = new StorageValue<boolean>(
  "preciseSelection",
  false,
);

const lastUsedElementQuerySelector = new StorageValue<string>(
  `lastUsedElement: ${document.location.host}`,
);

export const removeCrosshair = () => {
  if (selectedElement) {
    selectedElement.style.cursor = "";
  }
};

export const setSelection = (element: HTMLElement | null) => {
  selectedElement = element;
  buildSelectionOverlay();
};

const buildSelectionOverlay = () => {
  if (!elementOverlay) {
    const { shadowRoot } = getShadowHost();

    elementOverlay = shadowRoot.appendChild(
      createElementWithClassNames(
        "div",
        `${CLASSNAME_PREFIX}-selection-overlay`,
      ),
    );
  }
  if (!selectedElement) {
    hideSelectionOverlay();
    return;
  }
  elementOverlay.style.display = "block";
  const boundingRect = selectedElement.getBoundingClientRect();
  elementOverlay.style.top = `${boundingRect.top}px`;
  elementOverlay.style.left = `${boundingRect.left}px`;
  elementOverlay.style.height = `${boundingRect.height}px`;
  elementOverlay.style.width = `${boundingRect.width}px`;
};

const hideSelectionOverlay = () => {
  if (!elementOverlay) return;
  elementOverlay.style.display = "none";
};

const handleMouseMoveEvent = debounce((e: Event) => {
  if (!(e instanceof MouseEvent)) return;

  const elementAtPoint = document.elementFromPoint(e.clientX, e.clientY);

  if (!(elementAtPoint instanceof HTMLElement)) {
    return;
  }
  const { shadowHost } = getShadowHost();
  if (shadowHost.contains(elementAtPoint)) {
    return;
  }
  const isPreciseSelectionMode = preciseSelectionValue.getLocal();
  if (e.shiftKey || isPreciseSelectionMode) {
    elementAtPoint.style.cursor = "crosshair";
  } else {
    elementAtPoint.style.cursor = "";
  }
  if (elementAtPoint !== selectedElement) {
    if (selectedElement) {
      selectedElement.style.cursor = "";
    }

    selectedElement = elementAtPoint;
  }
  buildSelectionOverlay();
}, 10);

const setPreciseSelectionElement = (element: HTMLElement) => {
  const listItemHandlers = {
    mouseover: (element: HTMLElement) => (_e: Event) => {
      selectedElement = element;
      buildSelectionOverlay();
    },
    mouseout: (_element: HTMLElement) => (_e: Event) => {
      selectedElement = null;
      buildSelectionOverlay();
    },
    click: (element: HTMLElement) => (_e: Event) => {
      selectedElement = element;
      buildSelectionOverlay();
      setPreciseSelectionElement(element);
    },
  };
  const selectedElementClickHandler = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    createPictureInPicture(element).catch((e) => console.error(e));
  };

  buildPreciseSelectionPanel({
    element,
    listItemEventHandlers: listItemHandlers,
    selectedElementClickHandler,
  });
};

const handleElementClick = (e: Event) => {
  if (!(e instanceof MouseEvent)) return;
  const { shadowHost } = getShadowHost();

  if (shadowHost.contains(e.target as Node)) {
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  if (!selectedElement || !(selectedElement instanceof HTMLElement)) {
    return;
  }
  const isPreciseSelectionMode = preciseSelectionValue.getLocal();

  if (e.shiftKey || isPreciseSelectionMode) {
    setPreciseSelectionElement(selectedElement);
    removeCrosshair();
    document.removeEventListener("mousemove", handleMouseMoveEvent);
    document.removeEventListener("click", handleElementClick, {
      capture: true,
    });
    return;
  }

  createPictureInPicture(selectedElement).catch((e) => console.error(e));
  document.removeEventListener("mousemove", handleMouseMoveEvent);
  document.removeEventListener("click", handleElementClick, {
    capture: true,
  });
};

const copyStylesIntoPipWindow = (pipWindow: Window, element: HTMLElement) => {
  copyStyleSheetIntoPipWindow(document, pipWindow);

  pipWindow.document.documentElement.style.cssText = getRelevantStyles(
    document.documentElement,
  );
  pipWindow.document.body.style.cssText = getRelevantStyles(document.body);

  pipWindow.document.body.style.backgroundColor =
    getElementBackgroundColor(element);
};

const saveQuerySelector = (element: HTMLElement) => {
  const queryString = createQuerySelector(element);
  lastUsedElementQuerySelector.set(queryString).catch((e) => console.error(e));
};

const createPictureInPicture = async (element: HTMLElement) => {
  closeTool();
  saveQuerySelector(element);

  if (!("documentPictureInPicture" in window)) {
    console.error("Document Picture-in-Picture API is not supported");
    alert("Document Picture-in-Picture API is not supported");
    return;
  }

  const { previousSibling, nextSibling, parentElement: parent } = element;
  const pipWindow = await documentPictureInPicture
    .requestWindow()
    .catch((e) => {
      console.error("error while requesting window", e);
      throw new Error("Error while requesting window");
    });

  copyStylesIntoPipWindow(pipWindow, element);

  pipWindow.document.body.append(element);

  pipWindow.addEventListener("resize", (e) => {
    const newEvent = new Event("resize", { ...e });
    window.dispatchEvent(newEvent);
  });
  pipWindow.addEventListener("pagehide", () => {
    if (previousSibling) {
      previousSibling?.after(element);
    } else if (nextSibling) {
      nextSibling?.before(element);
    } else if (parent) {
      parent.appendChild(element);
    }
    const newEvent = new Event("resize");
    window.dispatchEvent(newEvent);
    closeTool();
  });
};

const handleScrollEvent = () => {
  buildSelectionOverlay();
};

const createToolbar = () => {
  const { shadowRoot } = getShadowHost();
  const controlPanel = shadowRoot.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-toolbar`),
  );
  const { label, checkbox } = createCheckbox({
    label: "Precise Selection",
    tooltipText: 'You can also press "Shift" when you click on an element',
    onChange: (e) => {
      const { checked } = e.target as HTMLInputElement;
      preciseSelectionValue.set(checked).catch((e) => console.error(e));
    },
    checkboxProps: {
      attributes: {
        type: "checkbox",
        id: `${CLASSNAME_PREFIX}-precise-checkbox`,
      },
      className: `${CLASSNAME_PREFIX}-checkbox`,
    },
  });

  preciseSelectionValue
    .get()
    .then((value) => {
      checkbox.checked = !!value;
    })
    .catch((e) => console.error(e));

  controlPanel.appendChild(label);

  const lastUsedElementButton = controlPanel.appendChild(
    createToolbarButton("Last Used Element"),
  );
  lastUsedElementButton.style.display = "none";
  lastUsedElementQuerySelector
    .get()
    .then((value) => {
      if (!value) return;
      const element = document.querySelector(value);
      if (!element) return;
      lastUsedElementButton.style.display = "block";
      lastUsedElementButton.addEventListener("click", () => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        selectedElement = element as HTMLElement;
        buildSelectionOverlay();
        setPreciseSelectionElement(element as HTMLElement);
      });
    })
    .catch((e) => console.error(e));
  controlPanel.appendChild(createToolbarButton("Close", closeTool));
};

export const attachEventListeners = () => {
  createToolbar();
  document.addEventListener("mousemove", handleMouseMoveEvent);
  document.addEventListener("click", handleElementClick, {
    capture: true,
  });
  document.addEventListener("scroll", handleScrollEvent);
};

export const removeEventListeners = () => {
  document.removeEventListener("mousemove", handleMouseMoveEvent);
  document.removeEventListener("click", handleElementClick, {
    capture: true,
  });
  document.removeEventListener("scroll", handleScrollEvent);
};