import * as THREE from "three";
import * as TWEEN from "@tweenjs/tween.js";

import {
  CARD_WIDTH,
  CARD_HEIGHT,
  SHAPE_PRESET_CUSTOM_MODEL,
  SHAPE_PRESET_SPHERE,
  SHAPE_PRESET_CUBE,
  SHAPE_PRESET_CYLINDER,
  SHAPE_PRESET_CONE,
  SHAPE_PRESET_TORUS,
  ANIMATION_DURATION,
  ANIMATION_DURATION_CARDS,
  CARD_GAP,
  CARD_TYPE_CHROMA_KEY_VIDEO,
  CARD_TYPE_IMAGE,
  CARD_TYPE_MODEL,
  CARD_TYPE_VIDEO,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_MESH_COLOR,
  SHAPE_SIZE,
  ANIMATION_CARD,
} from "../lib/constants";
import { getCardById, getCardImageSource, getFirstSource, getSourceByType } from "../lib/getters";
import { isValidHexColor } from "../lib/isValidHexColor";
import { isValidObject } from "../lib/isValidObject";
import { isValidURL } from "../lib/isValidURL";
import { loadTexture } from "../lib/loadTexture";
import { loadVideo } from "../lib/loadVideo";
import { isValidUUID } from "../lib/isValidUUID";
import { getBoundingBox } from "./getBoundingBox";
import { loadGLTF } from "./loadGLTF";
import { isValidArray } from "../lib/isValidArray";

const createPlane = (maps: any, color: any = null, rotation: number) => {
  const distanceOffset = 1;
  const planeGroup = new THREE.Group();
  let mapArray: any;

  mapArray = isValidArray(maps) ? maps : [maps];

  mapArray.forEach((map: any, index: number) => {
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

    plane.index = index;
    plane.material.visible = index ? false : true;

    planeGroup.add(plane);
    plane.position.set(distanceOffset * Math.sin(rotation) * index, 0, distanceOffset * Math.cos(rotation) * index);
  });
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
  return new THREE.SphereGeometry(10, 32, 16);
};

export class Carousel {
  thing = null;
  clock: any = null;
  renderer = null;
  scene = null;
  camera = null;
  mainShape: any = null;
  loadingManager: any = null;
  carouselGroup = new THREE.Group();
  _started: boolean = false;
  _reversed: boolean = false;
  _cardSelected: boolean = false;
  _animate: boolean = true;
  cardShapes = [];
  allCards = [];

  // These Vector instances are re-used in the main animation loop in order to
  // prevent memory allocation.
  worldDirection = new THREE.Vector3();
  facingDirection = new THREE.Vector3();
  raycaster = new THREE.Raycaster();

  // These instances are used in the start, reverse and restart animation.
  tweenMainShapeScale: any = null;
  tweenMainShapeElevation: any = null;
  tweenMainShapeScaleReverse: any = null;
  tweenMainShapeElevationReverse: any = null;

  tweenCardScale: any = [];
  tweenCardPosition: any = [];
  tweenCardOpacity: any = [];
  tweenCardScaleReverse: any = [];
  tweenCardPositionReverse: any = [];
  tweenCardOpacityReverse: any = [];

  constructor(thing: any, renderer: any, scene: any, camera: any, loadingManager: any = undefined) {
    this.thing = thing;
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.loadingManager = loadingManager;
    this.clock = new THREE.Clock();
  }

  init = async () => {
    const { thing, renderer }: any = this;
    const { shapePreset, shapeOptions, colors }: any = thing;
    // Apply background color, if set.
    if (isValidHexColor(colors.background)) {
      renderer.setClearColor(new THREE.Color(colors.background), 1);
    } else {
      renderer.setClearColor(new THREE.Color(DEFAULT_BACKGROUND_COLOR), 1);
    }

    const mainShape: any = new THREE.Group();

    if (shapePreset === SHAPE_PRESET_CUSTOM_MODEL) {
      const cdnUrl = shapeOptions?.customModel?.cdnUrl;
      if (isValidURL(cdnUrl)) {
        const gltf: any = await loadGLTF(cdnUrl);
        mainShape.add(gltf.scene);

        mainShape.traverse((mesh: THREE.Mesh) => {
          mesh.userData = {
            thingId: thing.id,
          };
        });
      }
    } else {
      // const geometry = getGeometry(shapePreset, shapeOptions);
      const geometry = getGeometry(shapePreset);

      const color = isValidHexColor(colors.primary) ? colors.primary : DEFAULT_MESH_COLOR;

      const material = new THREE.MeshLambertMaterial({ color, transparent: true });
      const mesh = new THREE.Mesh(geometry, material);

      mesh.userData = {
        thingId: thing.id,
      };

      mainShape.add(mesh);
    }

    // Normalize the size of the 3D Model
    const boundingBox = getBoundingBox(mainShape);
    const maxSize = Math.max(...boundingBox.max.toArray());
    mainShape.scale.multiplyScalar(SHAPE_SIZE * (1 / maxSize));
    this.mainShape = mainShape;
    return this.initCards();
  };

  initCards = async () => {
    const { thing, cardShapes, allCards, loadingManager }: any = this;
    const { cards }: any = thing;

    for (const card of cards) {
      const cardId = card.id;
      const { cardType } = card;
      const cardIndex = allCards.length;
      if (cardType === CARD_TYPE_IMAGE) {
        allCards.push({
          type: "image",
          sources: card.payload.sources,
          cardId,
          index: cardIndex,
          object3d: null,
        });
        continue;
      } else if (cardType === CARD_TYPE_VIDEO) {
        for (const source of card.payload.sources) {
          allCards.push({
            type: "video",
            source,
            cardId,
            index: cardIndex,
            object3d: null,
          });
          // Only display a single card for this kind of asset
          break;
        }
      } else if (cardType === CARD_TYPE_CHROMA_KEY_VIDEO) {
        const source = getFirstSource(card);
        const { payload } = card;
        allCards.push({
          type: "chroma-video",
          payload,
          source,
          cardId,
          index: cardIndex,
          object3d: null,
        });
      } else if (cardType === CARD_TYPE_MODEL) {
        const source = getSourceByType(card);
        allCards.push({
          type: "model",
          source,
          cardId,
          index: cardIndex,
          object3d: null,
        });
      } else {
        const imageBackground = getCardImageSource(card);
        if (isValidObject(imageBackground)) {
          allCards.push({
            type: "image",
            sources: [imageBackground],
            cardId,
            index: cardIndex,
            object3d: null,
          });
        } else if (isValidObject(card.videoBackground) && isValidURL(card.videoBackground.cdnUrl)) {
          allCards.push({
            type: "video",
            source: card.videoBackground,
            cardId,
            index: cardIndex,
            object3d: null,
          });
        }
      }
    }

    const step = (Math.PI * 2) / allCards.length;

    for (const card of allCards) {
      const { cardId, index } = card;
      let plane: any = undefined;
      let map: any = [];
      let color: any = DEFAULT_MESH_COLOR;

      switch (card.type) {
        case "image": {
          const { sources } = card;
          color = undefined;
          let mapArray: any = [];

          for (let i = 0; i < sources.length; i++) {
            const tempMap = await loadTexture(sources[i].cdnUrl, undefined, loadingManager);
            mapArray.push(tempMap);
          }

          plane = createPlane(mapArray, color, cardShapes.length * step);
          plane.rotation.y = cardShapes.length * step;
          cardShapes.push(plane);

          // Update the `object3d` attribute with a reference to the element in
          // this group.
          card.object3d = plane;

          plane.userData = {
            index,
            type: card.type,
            thingId: thing.id,
            cardId,
          };
          continue;
        }
        case "video": {
          const { source } = card;
          color = undefined;

          const video: any = await loadVideo(source.cdnUrl);
          const width = video.videoWidth;
          const height = video.videoHeight;

          map = new THREE.VideoTexture(video);
          map.image.width = width;
          map.image.height = height;

          plane = createPlane(map, color, cardShapes.length * step);
          plane.rotation.y = cardShapes.length * step;
          cardShapes.push(plane);

          // Update the `object3d` attribute with a reference to the element in
          // this group.
          card.object3d = plane;
          plane.userData = {
            index,
            type: card.type,
            thingId: thing.id,
            cardId,
          };
          continue;
        }
        case "chroma-video": {
          continue;
        }
        case "model": {
          const { source } = card;
          const gltf: any = await loadGLTF(source.cdnUrl, undefined, loadingManager);
          const boundingBox = getBoundingBox(gltf.scene);
          const maxSize = Math.max(...boundingBox.max.toArray());
          gltf.scene.scale.multiplyScalar(CARD_HEIGHT * 0.5 * (1 / maxSize));

          gltf.scene.traverse((child: any) => {
            if (child instanceof THREE.Mesh) {
              child.material.transparent = true;
              child.material.opacity = 0;
            }
            child.userData = {
              index,
              type: card.type,
              thingId: thing.id,
              cardId,
            };
          });

          plane = gltf.scene;

          break;
        }
      }

      if (!plane) {
        continue;
      }

      // Update the `object3d` attribute with a reference to the element in
      // this group.
      card.object3d = plane;

      plane.rotation.y = cardShapes.length * step;
      cardShapes.push(plane);

      plane.userData = {
        index,
        thingId: thing.id,
        cardId,
      };
    }
  };

  startAnimation() {
    const { cardShapes, scene, mainShape, carouselGroup }: any = this;
    if (this._started) {
      return;
    }
    this._started = true;

    // mainShape.position.y -= SHAPE_SIZE * 0.5;

    const tempScale = mainShape.scale.x;
    mainShape.scale.set(0.01, 0.01, 0.01);
    carouselGroup.add(mainShape);
    this.tweenMainShapeScale = new TWEEN.Tween(mainShape.scale)
      .to({ x: tempScale, y: tempScale, z: tempScale }, ANIMATION_DURATION)
      .onComplete(() => {
        this._animate = false;
      });

    this.tweenMainShapeElevation = new TWEEN.Tween(mainShape.position)
      .to({ y: mainShape.position.y + SHAPE_SIZE }, ANIMATION_DURATION)
      .yoyo(true)
      .repeat(Infinity);
    this.tweenMainShapeScale.chain(this.tweenMainShapeElevation).start();

    const radius = Math.max((CARD_WIDTH + CARD_GAP) / 2 / Math.sin(Math.PI / cardShapes.length), SHAPE_SIZE * 1.5);

    for (let i = 0; i < cardShapes.length; i++) {
      const card = cardShapes[i];

      carouselGroup.add(card);

      if (card instanceof THREE.Group) {
        const tempScale = card.scale.x;
        card.scale.set(0.01, 0.01, 0.01);
        this.tweenCardScale.push(
          new TWEEN.Tween(card.scale)
            .to({ x: tempScale, y: tempScale, z: tempScale }, ANIMATION_DURATION_CARDS)
            .onComplete(() => {
              this._reversed = false;
            })
            .start()
        );
        this.tweenCardScaleReverse.push(
          new TWEEN.Tween(card.scale).to({ x: 0, y: 0, z: 0 }, ANIMATION_DURATION).onComplete(() => {
            this._reversed = true;
          })
        );

        const rotationY = card.rotation.y;
        this.tweenCardPosition.push(
          new TWEEN.Tween(card.position)
            .to(
              { z: radius * Math.cos(rotationY), y: CARD_HEIGHT * 0.5, x: radius * Math.sin(rotationY) },
              ANIMATION_DURATION_CARDS
            )
            .start()
        );

        this.tweenCardPositionReverse.push(new TWEEN.Tween(card.position).to({ z: 0, y: 0, x: 0 }, ANIMATION_DURATION));

        card.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.material.opacity = 0;
            this.tweenCardOpacity.push(
              new TWEEN.Tween(child.material).to({ opacity: 1 }, ANIMATION_DURATION_CARDS).start()
            );
            this.tweenCardOpacityReverse.push(new TWEEN.Tween(child.material).to({ opacity: 0 }, ANIMATION_DURATION));
          }
        });
      }
    }

    scene.add(carouselGroup);
  }
  restartAnimation() {
    this.tweenCardScale.forEach((tween: any) => {
      tween.start();
    });
    this.tweenCardPosition.forEach((tween: any) => {
      tween.start();
    });
    this.tweenCardOpacity.forEach((tween: any) => {
      tween.start();
    });
  }
  reverseAnimation() {
    this.tweenCardScaleReverse.forEach((tween: any) => {
      tween.start();
    });
    this.tweenCardPositionReverse.forEach((tween: any) => {
      tween.start();
    });
    this.tweenCardOpacityReverse.forEach((tween: any) => {
      tween.start();
    });
  }
  cardCondense(id: number, imageIndex: number) {
    const { scene }: any = this;
    const selectedCard = getCardById(scene, id);

    selectedCard.children.forEach((mesh: any, index: number) => {
      if (index !== imageIndex) {
        new TWEEN.Tween(mesh.material)
          .to({ opacity: 0 }, ANIMATION_CARD)
          .start()
          .onStart(() => {})
          .onComplete(() => {
            mesh.material.visible = false;
            mesh.material.opacity = 1;
          });
      }

      new TWEEN.Tween(mesh.position)
        .to({ y: 0 }, ANIMATION_CARD)
        .easing(TWEEN.Easing.Elastic.In)
        .start()
        .onStart(() => {
          this._animate = true;
        })
        .onComplete(() => {
          this._cardSelected = false;
          this._animate = false;
        });
    });
  }
  cardExpand(id: number) {
    const { scene }: any = this;
    const selectedCard = getCardById(scene, id);
    let height = CARD_HEIGHT * (selectedCard.children.length - 1);

    selectedCard.children.forEach((mesh: any, index: number) => {
      mesh.material.opacity = 0;
      new TWEEN.Tween(mesh.material)
        .to({ opacity: 1 }, ANIMATION_CARD)
        .start()
        .onStart(() => {
          this._animate = true;
          mesh.material.visible = true;
        })

        .onComplete(() => {});

      new TWEEN.Tween(mesh.position)
        .to({ y: height }, ANIMATION_CARD)
        .easing(TWEEN.Easing.Elastic.In)
        .start()
        .onStart(() => {})
        .onComplete(() => {
          this._cardSelected = true;
          this._animate = false;
        });
      height -= CARD_HEIGHT;
    });
  }

  getObjectDataAtPoint(point: THREE.Vector2) {
    const { raycaster, scene, camera }: any = this;
    raycaster.setFromCamera(point, camera);
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
      const intersection = intersects[0];
      const { object } = intersection;
      let objectData: any = null;

      if (isValidUUID(object.userData?.thingId)) {
        objectData = object.userData;
      }

      object.traverseAncestors((mesh: any) => {
        const { userData } = mesh;
        if (!isValidUUID(userData.cardId)) {
          return;
        }
        objectData = userData;
      });
      if (!objectData) {
        return null;
      }
      return { ...objectData, object };
    }
    return null;
  }

  update() {
    const { worldDirection, facingDirection, clock, camera, cardShapes, allCards }: any = this;

    TWEEN.update();

    // If the animation of cards is running, do not update the opacity of the cards.
    if (this._animate) {
      return;
    }

    for (let i = 0; i < allCards.length; i++) {
      const cardDefinition = allCards[i];
      if (cardDefinition.type === "chroma-video") {
        const { object3d } = cardDefinition;
        if (object3d) {
          object3d.lookAt(camera.position);
        }
      }
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

    // Update the opacity of each card.
    // for (let i = 0; i < count; ++i) {
    //   cardShape = cardShapes[i];
    //   const distance = cardShape.position.distanceTo(facingDirection);
    //   const cardOpacity = 1 - (distance - minDistance) / (maxDistance - minDistance);
    //   // TODO: If there is only a single card, the opacity is not applied properly.
    //   if (count > 1) {
    //     cardShape.traverse((mesh: any) => {
    //       if (!mesh.material) {
    //         return;
    //       }
    //       mesh.material.opacity = cardOpacity;
    //     });
    //   }
    // }
  }
}
