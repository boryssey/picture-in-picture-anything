import {
  openPictureInPicture,
  PIP_CLOSED_EVENT,
  PIP_REQUEST_EVENT,
  PIP_TARGET_ATTR,
} from "./pip";

// Injected into the page's MAIN world on Firefox. Creating the PiP window here
// gives it the page's principal, so its document is accessible — unlike from the
// isolated content-script sandbox, where the window is a cross-origin object.
// The isolated content script marks the target element and dispatches
// PIP_REQUEST_EVENT synchronously (preserving the click's transient activation).
window.addEventListener(PIP_REQUEST_EVENT, () => {
  const element = document.querySelector(`[${PIP_TARGET_ATTR}]`);
  if (!(element instanceof HTMLElement)) {
    return;
  }
  element.removeAttribute(PIP_TARGET_ATTR);
  void openPictureInPicture(element, () => {
    window.dispatchEvent(new CustomEvent(PIP_CLOSED_EVENT));
  });
});
