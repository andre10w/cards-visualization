import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import GLTFMaterialsVariantsExtension from "three-gltf-extensions/loaders/KHR_materials_variants/KHR_materials_variants.js";

export const loadGLTF = (source: any, onProgress: any = undefined, manager: any = undefined) => {
  return new Promise((resolve, reject) => {
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("/draco/");
    const loader = new GLTFLoader(manager);
    loader.register((parser: any) => new GLTFMaterialsVariantsExtension(parser));
    loader.setCrossOrigin("anonymous");
    loader.setDRACOLoader(dracoLoader);
    loader.load(source, resolve, onProgress, reject);
  });
};
