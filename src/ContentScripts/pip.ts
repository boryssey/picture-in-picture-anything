import {
  copyStyleSheetIntoPipWindow,
  getElementBackgroundColor,
  getRelevantStyles,
} from "@src/utils/helpers";

// Shared between the isolated content script (Chrome) and the MAIN-world entry
// (Firefox). See pip-main.ts / handlers.ts.
export const PIP_REQUEST_EVENT = "__pip-anything:request";
export const PIP_CLOSED_EVENT = "__pip-anything:closed";
export const PIP_TARGET_ATTR = "data-pip-anything-target";

const getPipWindowSizeProportions = (
  elementWidth: number,
  elementHeight: number,
) => {
  let width = elementWidth;
  let height = elementHeight;
  if (elementWidth === 0 || elementHeight === 0) {
    width = window.innerWidth;
    height = window.innerHeight;
  }
  const aspectRatio = width / height;
  const maxWidth = 500;
  const maxHeight = 500;

  if (width > height) {
    width = Math.min(maxWidth, elementWidth);
    return { width, height: width / aspectRatio };
  }
  height = Math.min(maxHeight, elementHeight);

  return {
    width: height * aspectRatio,
    height,
  };
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

// Pure-DOM Picture-in-Picture creation. No extension (browser.*) APIs, so it is
// safe to run in either the isolated content-script world (Chrome) or the page's
// MAIN world (Firefox). onClose runs after the element is restored on window close.
export const openPictureInPicture = async (
  element: HTMLElement,
  onClose?: () => void,
) => {
  if (!("documentPictureInPicture" in window)) {
    console.error("Document Picture-in-Picture API is not supported");
    alert("Document Picture-in-Picture API is not supported");
    return;
  }

  const boundingRect = element.getBoundingClientRect();
  const { width, height } = boundingRect;
  const { width: pipWidth, height: pipHeight } = getPipWindowSizeProportions(
    width,
    height,
  );

  const { previousSibling, nextSibling, parentElement: parent } = element;
  const pipWindow = await documentPictureInPicture
    .requestWindow({
      width: pipWidth,
      height: pipHeight,
    })
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
    onClose?.();
  });
};
