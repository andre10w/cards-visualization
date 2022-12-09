import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

export const loadGLTF = (source) => {
  return new Promise((resolve, reject) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");

    const loader = new GLTFLoader();
    loader.setCrossOrigin("anonymous");
    loader.setDRACOLoader(dracoLoader);
    loader.load(source, resolve, undefined, reject);
  });
};
