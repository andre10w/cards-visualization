import * as THREE from "three";
import { reduceVertices } from "@google/model-viewer/src/three-components/ModelUtils";

export const getBoundingBox = (mesh, box = new THREE.Box3()) => {
  const bound = (box, vertex) => {
    return box.expandByPoint(vertex);
  };

  return reduceVertices(mesh, bound, box);
};
