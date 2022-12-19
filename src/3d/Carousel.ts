import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";

import { isValidHexColor } from "../lib/isValidHexColor";
import { isValidUUID } from "../lib/isValidUUID";
import { getBoundingBox } from "../3d/getBoundingBox";
import { loadGLTF } from "../3d/loadGLTF";

import { loadTexture, loadVideo } from "../lib/loader";

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
  ANIMATION_DURATION,
  ANIMATION_DURATION_CARDS,
} from "../lib/constants";

import { getCardImageSource } from "../lib/getters";

// TODO: Obtain the aspect ratio using the sources (see lib/getters) and
// determine the width using the aspect ratio.
const CARD_WIDTH = 16;
const CARD_HEIGHT = 20;

const createPlane = (map: any, color: any) => {
  map.matrixAutoUpdate = true;
  const imageAspect = map.image.width / map.image.height;
  let imageWidth: number = CARD_WIDTH;
  let imageHeight: number = CARD_HEIGHT;

  if (imageAspect >= 1) {
    imageHeight = CARD_WIDTH / imageAspect;
  } else {
    imageWidth = CARD_HEIGHT * imageAspect;
  }
  const geometry = new THREE.PlaneGeometry(imageWidth, imageHeight);
  const material = new THREE.MeshBasicMaterial({
    color: color,
    map: map,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const plane = new THREE.Mesh(geometry, material);

  const planeGroup = new THREE.Group();
  planeGroup.add(plane);

  return planeGroup;
};

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
  raycaster = new THREE.Raycaster();

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

    let mainShape: any = undefined;

    if (shapePreset === SHAPE_PRESET_CUSTOM_MODEL) {
      const gltf: any = await loadGLTF(shapeOptions?.customModel?.cdnUrl);
      // Normalize the size of the 3D Model
      const boundingBox = getBoundingBox(gltf.scene);
      const maxSize = Math.max(...boundingBox.max.toArray());
      gltf.scene.scale.multiplyScalar(SHAPE_SIZE * (1 / maxSize));

      scene.add(gltf.scene);
      mainShape = gltf.scene;

      mainShape.traverse((mesh: THREE.Mesh) => {
        mesh.userData = {
          thingId: thing.id,
        };
      });
    } else {
      // const geometry = getGeometry(shapePreset, shapeOptions);
      const geometry = getGeometry(shapePreset);

      const color = isValidHexColor(colors.primary) ? colors.primary : DEFAULT_MESH_COLOR;

      const material = new THREE.MeshLambertMaterial({ color, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.scale.x = 0.01;
      mesh.scale.y = 0.01;
      mesh.scale.z = 0.01;

      mesh.userData = {
        thingId: thing.id,
      };

      mainShape = mesh;
    }

    this.mainShape = mainShape;

    return this.initCards();
  };

  initCards = async () => {
    const { thing, cardShapes, scene }: any = this;
    const { cards }: any = thing;

    let count = 0;

    for (const card of cards) {
      if (card.cardType === CARD_TYPE_IMAGE) {
        count += card.payload.sources.length;
      } else if (card.cardType === CARD_TYPE_SOCIAL_MEDIA) {
        if (!card.videoBackground?.cdnUrl) {
          continue;
        } else {
          count++;
        }
      } else {
        count++;
      }
    }

    const step = (Math.PI * 2) / count;

    for (const card of cards) {
      let plane: THREE.Mesh = undefined;
      let map: any = undefined;
      let color: any = DEFAULT_MESH_COLOR;

      switch (card.cardType) {
        case CARD_TYPE_IMAGE: {
          for (const source of card.payload.sources) {
            color = undefined;

            map = await loadTexture(source.cdnUrl);

            plane = createPlane(map, color);
            plane.rotation.y = cardShapes.length * step;
            cardShapes.push(plane);

            plane.userData = {
              thingId: thing.id,
              cardId: card.id,
            };
          }
          continue;
        }
        case CARD_TYPE_VIDEO: {
          color = undefined;

          const source: any = getCardImageSource(card);
          const video: any = await loadVideo(source.cdnUrl);
          const width = video.videoWidth;
          const height = video.videoHeight;

          map = new THREE.VideoTexture(video);
          map.image.width = width;
          map.image.height = height;

          plane = createPlane(map, color);
          break;
        }
        case CARD_TYPE_SOCIAL_MEDIA: {
          if (!card.videoBackground?.cdnUrl) {
            continue;
          }

          const video: any = await loadVideo(card.videoBackground?.cdnUrl);
          const width = video.videoWidth;
          const height = video.videoHeight;

          map = new THREE.VideoTexture(video);
          map.image.width = width;
          map.image.height = height;

          plane = createPlane(map, color);
          break;
        }
        case CARD_TYPE_MODEL: {
          const source: any = getCardImageSource(card);

          const gltf: any = await loadGLTF(source.cdnUrl);
          const boundingBox = getBoundingBox(gltf.scene);
          const maxSize = Math.max(...boundingBox.max.toArray());
          gltf.scene.scale.multiplyScalar(SHAPE_SIZE * (1 / maxSize));

          gltf.scene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
              child.material.transparent = true;

              child.material.opacity = 0;
            }
          });

          plane = gltf.scene;

          break;
        }
      }

      if (!plane) {
        continue;
      }

      plane.rotation.y = cardShapes.length * step;
      cardShapes.push(plane);

      plane.userData = {
        thingId: thing.id,
        cardId: card.id,
      };
    }

    return this.startAnimation();
  };

  startAnimation() {
    const { cardShapes, scene, mainShape }: any = this;
    scene.add(mainShape);
    new TWEEN.Tween(mainShape.scale).to({ x: 1, y: 1, z: 1 }, ANIMATION_DURATION).start();
    new TWEEN.Tween(mainShape.position).to({ y: 1 }, ANIMATION_DURATION).yoyo(true).repeat(Infinity).start();

    for (let i = 0; i < cardShapes.length; i++) {
      const card = cardShapes[i];

      if (card instanceof THREE.Group) {
        scene.add(card);

        const tempScale = card.scale.x;
        card.scale.set(0.1, 0.1, 0.1);
        new TWEEN.Tween(card.scale).to({ x: tempScale, y: tempScale, z: tempScale }, ANIMATION_DURATION_CARDS).start();

        const rotation = card.rotation.y;
        new TWEEN.Tween(card.position)
          .to({ z: 20 * Math.cos(rotation), x: 20 * Math.sin(rotation) }, ANIMATION_DURATION_CARDS)
          .start();

        card.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.material.opacity = 0;
            new TWEEN.Tween(child.material).to({ opacity: 1 }, ANIMATION_DURATION_CARDS).start();
          }
        });
      }
    }
  }

  getObjectDataAtPoint(point: THREE.Vector2) {
    const { raycaster, scene, camera }: any = this;
    raycaster.setFromCamera(point, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const { object } = intersection;
      let objectData = object.userData;
      object.traverseAncestors((mesh) => {
        const { userData } = mesh;
        if (!isValidUUID(userData.cardId)) {
          return;
        }
        objectData = userData;
      });
      return objectData;
    }
    return null;
  }

  update() {
    const { worldDirection, facingDirection, clock, camera, cardShapes }: any = this;

    TWEEN.update();

    // Update the scale, position and opacity of the main shape.
    const t = clock.getElapsedTime();
    // If the animation of cards is running, do not update the opacity of the cards.
    if (t * 1e3 < ANIMATION_DURATION_CARDS) {
      return;
    }

    camera.getWorldDirection(worldDirection);

    const theta = Math.atan2(worldDirection.x, worldDirection.z) + Math.PI;
    facingDirection.set(Math.sin(theta), 0, Math.cos(theta));

    // Obtain the minimum and maximum distance from the camera in order to
    // determine the card's opacity.

    const count = cardShapes.length;
    let minDistance = Infinity;
    let maxDistance = -Infinity;
    let cardShape: any = null;

    for (let i = 0; i < count; ++i) {
      cardShape = cardShapes[i];
      const distance = cardShape.position.distanceTo(facingDirection);
      maxDistance = Math.max(distance, maxDistance);
      minDistance = Math.min(distance, minDistance);
    }

    // Update the position and opacity of each card.
    for (let i = 0; i < count; ++i) {
      cardShape = cardShapes[i];
      const distance = cardShape.position.distanceTo(facingDirection);
      const cardOpacity = 1 - (distance - minDistance) / (maxDistance - minDistance);
      // TODO: If there is only a single card, the opacity is not applied properly.
      if (count > 1) {
        cardShape.traverse((mesh) => {
          if (!mesh.material) {
            return;
          }
          mesh.material.opacity = cardOpacity;
        });
      }
    }
  }
}
