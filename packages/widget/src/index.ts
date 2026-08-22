import { mountWidget } from "./app";

function start() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => mountWidget());
  } else {
    mountWidget();
  }
}

start();
