import { isValidHexColor } from "../lib/isValidHexColor";
import { getBoundingBox } from "../3d/getBoundingBox";
import { loadGLTF } from "../3d/loadGLTF";
import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";
import { fixTexture } from "../lib/utils";
// const THREE = (window as any).THREE;
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_MESH_COLOR,
  CARD_TYPE_IMAGE,
  CARD_TYPE_VIDEO,
  SHAPE_SIZE,
  SHAPE_PRESET_CUSTOM_MODEL,
  SHAPE_PRESET_SPHERE,
  SHAPE_PRESET_CUBE,
  SHAPE_PRESET_CYLINDER,
  SHAPE_PRESET_CONE,
  SHAPE_PRESET_TORUS,
} from "../lib/constants";

import { getCardImageSource } from "../lib/getters";

// TODO: Obtain the aspect ratio using the sources (see lib/getters) and
// determine the width using the aspect ratio.
const CARD_WIDTH = 16;
const CARD_HEIGHT = 20;
const CARD_DISTANCE = 20;
const ANIMATION_STEP = 0.01;

const getGeometry = (shapePreset: any) => {
  switch (shapePreset) {
    case SHAPE_PRESET_SPHERE:
      return new THREE.SphereGeometry(SHAPE_SIZE, 32, 16);
    case SHAPE_PRESET_CUBE:
      return new THREE.BoxGeometry(SHAPE_SIZE, SHAPE_SIZE, SHAPE_SIZE);
    case SHAPE_PRESET_CYLINDER:
      return new THREE.CylinderGeometry(0.5 * SHAPE_SIZE, 0.5 * SHAPE_SIZE, SHAPE_SIZE, 32);
    case SHAPE_PRESET_CONE:
      return new THREE.ConeGeometry(0.5 * SHAPE_SIZE, SHAPE_SIZE, 32);
    case SHAPE_PRESET_TORUS:
      return new THREE.TorusGeometry(SHAPE_SIZE, 0.25 * SHAPE_SIZE, 32, 100);
  }
  console.warn(`Unknown preset: ${shapePreset}`);
  return new THREE.SphereGeometry(SHAPE_SIZE, 32, 16);
};

export class Carousel {
  thing = null;
  clock: any = null;
  renderer = null;
  scene = null;
  camera = null;
  mainShape: any = null;
  cardShapes = [];

  // These Vector instances are re-used in the main animation loop in order to
  // prevent memory allocation.
  worldDirection = new THREE.Vector3();
  facingDirection = new THREE.Vector3();
  cardDistance = new THREE.Vector3();

  // The current status of the initial animation. This percentage is used in
  // order to determine the opacity and distance of the cards which should
  // appear from the main shape.
  // This implementation might be replaced using TWEEN.JS.

  currentPercentage = 0;

  constructor(thing: any, renderer: any, scene: any, camera: any) {
    this.thing = thing;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.clock = new THREE.Clock();
    this.init();
  }

  init = async () => {
    const { thing, scene, renderer }: any = this;
    const { shapePreset, shapeOptions, colors }: any = thing;
    // Apply background color, if set.
    if (isValidHexColor(colors.background)) {
      renderer.setClearColor(new THREE.Color(colors.background), 1);
    } else {
      renderer.setClearColor(new THREE.Color(DEFAULT_BACKGROUND_COLOR), 1);
    }

    if (shapePreset === SHAPE_PRESET_CUSTOM_MODEL) {
      const gltf: any = await loadGLTF(shapeOptions?.customModel?.cdnUrl);
      // Normalize the size of the 3D Model
      const boundingBox = getBoundingBox(gltf.scene);
      const maxSize = Math.max(...boundingBox.max.toArray());
      gltf.scene.scale.multiplyScalar(SHAPE_SIZE * (1 / maxSize));

      scene.add(gltf.scene);
      this.mainShape = gltf.scene;
    } else {
      // const geometry = getGeometry(shapePreset, shapeOptions);
      const geometry = getGeometry(shapePreset);

      const color = isValidHexColor(colors.primary) ? colors.primary : DEFAULT_MESH_COLOR;

      const material = new THREE.MeshLambertMaterial({ color, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);
      const twSphere = new TWEEN.Tween(mesh.position).to({ y: 1 }, 2000).yoyo(true).repeat(Infinity).start();

      scene.add(mesh);
      this.mainShape = mesh;
    }
    return this.initCards();
  };

  initCards = async () => {
    const { thing, scene, cardShapes }: any = this;
    const { cards }: any = thing;
    const step = (Math.PI * 2) / cards.length;

    for (let i = 0; i < cards.length; ++i) {
      const card = cards[i];

      let map: any = undefined;
      let color: any = DEFAULT_MESH_COLOR;

      switch (card.cardType) {
        case CARD_TYPE_IMAGE: {
          const source: any = getCardImageSource(card);
          map = new THREE.TextureLoader().load(source.cdnUrl, fixTexture);
          color = undefined;
          break;
        }
        case CARD_TYPE_VIDEO: {
          color = undefined;
          const source: any = getCardImageSource(card);
          const video = document.createElement("video");
          video.setAttribute("autoplay", "autoplay");
          video.setAttribute("playsinline", "playsinline");
          video.setAttribute("loop", "loop");
          video.setAttribute("crossorigin", "anonymous");
          video.muted = true;

          const sourceElement = document.createElement("source");
          sourceElement.setAttribute("src", source.cdnUrl);
          sourceElement.setAttribute("type", source.mimeType);
          video.appendChild(sourceElement);
          video.load();
          video.play();
          map = new THREE.VideoTexture(video);
          break;
        }
      }

      const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        map: map,
        side: THREE.DoubleSide,
        transparent: true,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.rotation.y = i * step;
      const twPlane = new TWEEN.Tween(plane.position)
        .to({ z: 20 * Math.cos(i * step), x: 20 * Math.sin(i * step) }, 3000)
        .start();
      scene.add(plane);
      cardShapes.push(plane);
    }
  };
}
