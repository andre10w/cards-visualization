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
  CARD_TYPE_SOCIAL_MEDIA,
  CARD_TYPE_MODEL,
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

  return new THREE.SphereGeometry(10, 32, 16);
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

      mesh.scale.x = 0.1;
      mesh.scale.y = 0.1;
      mesh.scale.z = 0.1;

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
      const createPlane = (map: any) => {
        const geometry = new THREE.PlaneGeometry(CARD_WIDTH, CARD_HEIGHT);
        const material = new THREE.MeshBasicMaterial({
          color: color,
          map: map,
          side: THREE.DoubleSide,
          transparent: true,
        });

        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.y = i * step;

        cardShapes.push(plane);
      };

      switch (card.cardType) {
        case CARD_TYPE_IMAGE: {
          const source: any = getCardImageSource(card);
          map = new THREE.TextureLoader().load(source.cdnUrl, fixTexture);

          color = undefined;
          createPlane(map);
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

          // const sourceElement = document.createElement("source");
          // sourceElement.setAttribute("src", source.cdnUrl);
          // sourceElement.setAttribute("type", source.mimeType);
          // video.appendChild(sourceElement);
          video.src = source.cdnUrl;
          video.load();
          video.play();

          map = new THREE.VideoTexture(video);
          video.addEventListener(
            "loadedmetadata",
            function () {
              // retrieve dimensions
              const height = this.videoHeight;
              const width = this.videoWidth;

              map.image.width = width;
              map.image.height = height;

              fixTexture(map);
              createPlane(map);
            },
            false
          );
          break;
        }
        case CARD_TYPE_SOCIAL_MEDIA: {
          console.log(card);
          color = undefined;
          // const source: any = getCardImageSource(card);
          const video = document.createElement("video");
          video.setAttribute("autoplay", "autoplay");
          video.setAttribute("playsinline", "playsinline");
          video.setAttribute("loop", "loop");
          video.setAttribute("crossorigin", "anonymous");
          video.muted = true;

          video.src = card.videoBackground.cdnUrl;
          video.load();
          video.play();

          map = new THREE.VideoTexture(video);
          createPlane(map);
          // video.addEventListener(
          //   "loadedmetadata",
          //   function () {

          //     // retrieve dimensions
          //     const height = this.videoHeight;
          //     const width = this.videoWidth;

          //     map.image.width = width;
          //     map.image.height = height;
          //     fixTexture(map);

          //     createPlane(map);

          //   },
          //   false
          // );
          break;
        }
        case CARD_TYPE_MODEL: {
          const source: any = getCardImageSource(card);

          const gltf: any = await loadGLTF(source.cdnUrl);

          const boundingBox = getBoundingBox(gltf.scene);
          const maxSize = Math.max(...boundingBox.max.toArray());

          gltf.scene.scale.multiplyScalar(SHAPE_SIZE * (1 / maxSize));

          gltf.scene.rotation.y = i * step;

          cardShapes.push(gltf.scene);

          break;
        }
      }
    }

    return this.startAnimation();
  };
  startAnimation() {
    const { cardShapes, scene, mainShape }: any = this;
    scene.add(mainShape);
    new TWEEN.Tween(mainShape.scale).to({ x: 1, y: 1, z: 1 }, 2000).start();
    new TWEEN.Tween(mainShape.position).to({ y: 1 }, 2000).yoyo(true).repeat(Infinity).start();

    for (let i = 0; i < cardShapes.length; i++) {
      const mesh = cardShapes[i];
      const rotation = mesh.rotation.y;
      scene.add(mesh);
      new TWEEN.Tween(mesh.position).to({ z: 20 * Math.cos(rotation), x: 20 * Math.sin(rotation) }, 3000).start();
    }
  }
  update() {
    const { worldDirection, facingDirection, cardDistance, clock, camera, mainShape, cardShapes }: any = this;
    let { currentPercentage } = this;
    if (currentPercentage < 1) {
      currentPercentage = Math.min(1, currentPercentage + ANIMATION_STEP);
      this.currentPercentage = currentPercentage;
    }

    const count = cardShapes.length;
    const step = (Math.PI * 2) / count;

    camera.getWorldDirection(worldDirection);

    const theta = Math.atan2(worldDirection.x, worldDirection.z) + Math.PI;
    facingDirection.set(Math.sin(theta), 0, Math.cos(theta));

    const radius = CARD_DISTANCE * currentPercentage;

    // Update the scale, position and opacity of the main shape.
    const t = clock.getElapsedTime();

    if (mainShape) {
      mainShape.position.y = -1 + Math.sin(t);
      if (mainShape.scale) {
        mainShape.scale.set(currentPercentage, currentPercentage, currentPercentage);
      }
      if (mainShape.material) {
        mainShape.material.opacity = currentPercentage;
      }
    }

    // Obtain the minimum and maximum distance from the camera in order to
    // determine the card's opacity.
    let minDistance = Infinity;
    let maxDistance = -Infinity;
    let cardShape: any = null;

    for (let i = 0; i < count; ++i) {
      const x = radius * Math.sin(i * step);
      const z = radius * Math.cos(i * step);
      cardDistance.set(x, 0, z);
      const distance = cardDistance.distanceTo(facingDirection);
      maxDistance = Math.max(distance, maxDistance);
      minDistance = Math.min(distance, minDistance);
    }

    // Update the position and opacity of each card.
    for (let i = 0; i < count; ++i) {
      cardShape = cardShapes[i];

      const x = radius * Math.sin(i * step);
      const z = radius * Math.cos(i * step);
      cardShape.position.set(x, 0, z);

      cardDistance.set(x, 0, z);

      const distance = cardDistance.distanceTo(facingDirection);
      const cardOpacity = 1 - (distance - minDistance) / (maxDistance - minDistance);
      // TODO: If there is only a single card, the opacity is not applied properly.
      if (count > 1) {
        cardShape.material.opacity = cardOpacity * currentPercentage;
      }
    }
  }
}
