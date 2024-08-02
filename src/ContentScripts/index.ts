//@ts-expect-error style-loader
import shadowDomStyle from "./styles/shadowDom.css";

import {
  attachEventListeners,
  removeCrosshair,
  removeEventListeners,
} from "./handlers";

export const CLASSNAME_PREFIX = "__pip-anything";

export const TOGGLED_CLASSNAME = `${CLASSNAME_PREFIX}-selected`;
export const TOGGLED_SELECTOR = `.${TOGGLED_CLASSNAME}`;

const logger = (args?: unknown, ...optionalParams: unknown[]) => {
  console.log("[CSC]:", args, optionalParams);
};

logger("content script called");

const createShadowRoot = () => {
  const exisitingShadowHost = document.getElementById(
    `${CLASSNAME_PREFIX}-container`,
  );

  if (exisitingShadowHost?.shadowRoot) {
    return {
      shadowHost: exisitingShadowHost,
      shadowRoot: exisitingShadowHost.shadowRoot,
    };
  }
  const shadowHost = document.createElement("div");

  shadowHost.style.fontSize = "16px";
  shadowHost.id = `${CLASSNAME_PREFIX}-container`;
  document.body.appendChild(shadowHost);
  const shadowRoot = shadowHost.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.innerHTML = `
    @font-face {
      font-family: 'Inter';
      font-style: italic;
      font-weight: 100 900;
      src: URL('${chrome.runtime.getURL("fonts/Inter.ttf")}') format('truetype');
    }
  `;
  shadowRoot.appendChild(style);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  shadowDomStyle.use({ target: shadowRoot });

  return { shadowHost, shadowRoot };
};

let shadowHost: HTMLElement | undefined, shadowRoot: ShadowRoot | undefined;

export const getShadowHost = () => {
  if (!shadowHost || !shadowRoot) {
    throw new Error("Shadow host or shadow root not yet created");
  }
  return { shadowHost, shadowRoot };
};

export const closeTool = () => {
  removeCrosshair();
  const { shadowHost } = getShadowHost();
  shadowHost.remove();
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  shadowDomStyle.unuse();
  removeEventListeners();
};

const handleEscapeKey = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    e.preventDefault();
    e.stopPropagation();
    closeTool();
    document.removeEventListener("keydown", handleEscapeKey, {
      capture: true,
    });
  }
};

const initScript = () => {
  const exisitingShadowHost = document.getElementById(
    `${CLASSNAME_PREFIX}-container`,
  );

  if (exisitingShadowHost?.shadowRoot) {
    return;
  }
  ({ shadowHost, shadowRoot } = createShadowRoot());
  attachEventListeners();
  document.addEventListener("keydown", handleEscapeKey, {
    capture: true,
  });
};

initScript();
