import * as THREE from "three";
import { reduceVertices } from "@google/model-viewer/src/three-components/ModelUtils";

export const getBoundingBox = (mesh: any, box: any = new THREE.Box3()) => {
  const bound = (box: any, vertex: any) => {
    return box.expandByPoint(vertex);
  };

  return reduceVertices(mesh, bound, box);
};
