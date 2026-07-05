import { CLASSNAME_PREFIX, closeTool, getShadowHost } from ".";
import debounce from "lodash/debounce";
import {
  createElementWithClassNames,
  deserializeQuerySelector,
  getSerializedQuerySelector,
} from "@src/utils/helpers";
import {
  openPictureInPicture,
  PIP_CLOSED_EVENT,
  PIP_REQUEST_EVENT,
  PIP_TARGET_ATTR,
} from "./pip";
import { StorageValue } from "@src/utils/storage";
import { createCheckbox, createToolbarButton } from "./dom";
import {
  buildPreciseSelectionPanel,
  getPreciseSelectionContainer,
} from "./components/PreciseSelectionPanel";

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

export const setSelection = (
  element: HTMLElement | null,
  withCrosshair?: boolean,
) => {
  removeCrosshair();
  selectedElement = element;
  if (withCrosshair && element) {
    element.style.cursor = "crosshair";
  }
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
  const isPreciseSelectionMode = e.shiftKey || preciseSelectionValue.getLocal();

  if (elementAtPoint !== selectedElement) {
    setSelection(elementAtPoint, isPreciseSelectionMode);
  }
}, 10);

const setPreciseSelectionElement = (element: HTMLElement) => {
  const listItemHandlers = {
    mouseover: (element: HTMLElement) => (_e: Event) => {
      setSelection(element);
    },
    click: (element: HTMLElement) => (_e: Event) => {
      setSelection(element);
      setPreciseSelectionElement(element);
    },
  };
  const selectedElementClickHandler = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    createPictureInPicture(element).catch((e) => {
      console.error("error while creating picture in picture", e);
    });
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
  const isPreciseSelectionMode = !!preciseSelectionValue.getLocal();
  const preciseSelectionContainerExists = !!getPreciseSelectionContainer();
  if (e.shiftKey || isPreciseSelectionMode || preciseSelectionContainerExists) {
    setPreciseSelectionElement(selectedElement);
    return;
  }

  createPictureInPicture(selectedElement).catch((e) => console.error(e));
};

const saveQuerySelector = (element: HTMLElement) => {
  // Compute the selector synchronously, while the element is still in place
  // (it gets moved into the PiP window right after this).
  const querySelectorString = getSerializedQuerySelector(element);
  // Firefox rejects the storage write (NS_ERROR_UNEXPECTED) when it shares a task
  // with opening the PiP window (the synchronous requestWindow in the MAIN world).
  // Deferring it to the next task lets it run after the PiP window has opened.
  setTimeout(() => {
    lastUsedElementQuerySelector
      .set(querySelectorString)
      .catch((e) => console.error("error while saving query selector", e));
  }, 0);
};

const createPictureInPicture = async (element: HTMLElement) => {
  closeTool();
  removeCrosshair();
  document.removeEventListener("mousemove", handleMouseMoveEvent);
  document.removeEventListener("click", handleElementClick, {
    capture: true,
  });
  saveQuerySelector(element);

  if (__BROWSER__ === "firefox") {
    // Firefox: a PiP window created from the isolated content-script sandbox is a
    // cross-origin object we can't touch, so create it in the page's MAIN world.
    element.setAttribute(PIP_TARGET_ATTR, "");
    window.addEventListener(PIP_CLOSED_EVENT, () => closeTool(), {
      once: true,
    });
    // Synchronous dispatch keeps the click's transient activation valid for requestWindow.
    // Use window.CustomEvent (page-realm constructor): a CustomEvent built in the isolated
    // content-script compartment throws NS_ERROR_UNEXPECTED when dispatched onto the page
    // window in Firefox (Bug 999586). window.CustomEvent === CustomEvent in Chrome.
    window.dispatchEvent(new window.CustomEvent(PIP_REQUEST_EVENT));
    return;
  }

  await openPictureInPicture(element, closeTool);
};

const handleScrollEvent = () => {
  buildSelectionOverlay();
};

const createToolbar = () => {
  const { shadowRoot } = getShadowHost();
  const controlPanel = shadowRoot.appendChild(
    createElementWithClassNames("div", `${CLASSNAME_PREFIX}-toolbar`),
  );

  const lastUsedElementButton = createToolbarButton("Last Used Element");

  lastUsedElementButton.style.display = "none";
  lastUsedElementQuerySelector
    .get()
    .then((value) => {
      if (!value) return;
      const { querySelectorString, nThChildSelectorString } =
        deserializeQuerySelector(value);

      const element =
        document.querySelector(querySelectorString) ??
        document.querySelector(nThChildSelectorString);

      if (!element) return;
      lastUsedElementButton.style.display = "block";
      lastUsedElementButton.addEventListener("click", () => {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setSelection(element as HTMLElement);
        setPreciseSelectionElement(element as HTMLElement);
      });
    })
    .catch((e) => console.error(e));

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
  const closeButton = createToolbarButton("Close", closeTool);
  closeButton.classList.add(`${CLASSNAME_PREFIX}-secondary`);
  controlPanel.appendChild(closeButton);
  controlPanel.appendChild(label);
  controlPanel.appendChild(lastUsedElementButton);

  preciseSelectionValue
    .get()
    .then((value) => {
      checkbox.checked = !!value;
    })
    .catch((e) => console.error(e));
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
