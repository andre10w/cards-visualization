import * as THREE from "three";

export const loadTexture = (url: string) => {
  return new Promise((resolve) => {
    new THREE.TextureLoader().load(url, resolve);
  });
};

export const loadVideo = (url: string) => {
  return new Promise((resolve, reject) => {
    const vElement = document.createElement("video");
    vElement.setAttribute("playsinline", "playsinline");
    vElement.crossOrigin = "anonymous";
    vElement.autoplay = true;
    vElement.muted = true;
    vElement.loop = true;
    vElement.src = url;
    vElement.load();
    vElement.play();
    vElement.addEventListener("canplaythrough", function () {
      resolve(vElement);
    });

    vElement.addEventListener("error", function () {
      reject(vElement);
    });
  });
};
