import * as THREE from "three";

export const loadTexture = (url: string, onProgress, manager) => {
  return new Promise((resolve, reject) => {
    new THREE.TextureLoader(manager).load(url, resolve, onProgress, reject);
  });
};
