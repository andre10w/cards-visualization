import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { CAMERA_FOV, CAMERA_NEAR, CAMERA_FAR } from "../lib/constants";

import { Carousel } from "../3d/Carousel";

// `6eb624ac-4c3d-4f8a-abb2-f91f9555d0b5` includes a custom model.
// const THING_ID = "6eb624ac-4c3d-4f8a-abb2-f91f9555d0b5";

// `bff130d0-66f0-4296-a57a-0aaae12d2ad0` contains image and video cards.
const THING_ID = "bff130d0-66f0-4296-a57a-0aaae12d2ad0";

// `0ad0e9a3-6e9b-4d7a-af0a-fbef39f71b7d` contains model, image and video cards.
// const THING_ID = '0ad0e9a3-6e9b-4d7a-af0a-fbef39f71b7d';

// This is a React wrapper around THREE.JS. In scope of this project, this
// component might not require fundamental changes, as the `Carousel` class
// should work indepdendently in different THREE.JS scenes, including 8th Wall
// Scenes.
export const ExamplePage = () => {
  const canvasRef = useRef();
  const windowDimensions = useRef([1, 1, 1.0]);
  const rendererRef = useRef();
  const cameraRef = useRef();
  const sceneRef = useRef();
  const controlsRef = useRef();

  const carouselRef = useRef();

  const isActive = useRef();
  const frameRef = useRef();

  const onResize = () => {
    const { innerWidth, innerHeight, devicePixelRatio } = window;
    windowDimensions.current[0] = innerWidth;
    windowDimensions.current[1] = innerHeight;
    windowDimensions.current[2] = devicePixelRatio;

    const renderer = rendererRef.current;
    const camera = cameraRef.current;

    if (renderer) {
      renderer.setSize(windowDimensions.current[0], windowDimensions.current[1]);
    }

    if (camera) {
      camera.aspect = windowDimensions.current[0] / windowDimensions.current[1];
      camera.updateProjectionMatrix();
    }
  };

  const onFrame = () => {
    if (!isActive.current) {
      return;
    }

    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;
    const controls = controlsRef.current;
    const carousel = carouselRef.current;

    if (carousel) {
      carousel.update();
    }

    if (controls) {
      controls.update();
    }

    if (renderer) {
      renderer.render(scene, camera);
    }

    frameRef.current = requestAnimationFrame(onFrame);
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    if (canvasRef.current) {
      canvasRef.current.width = windowDimensions[0];
      canvasRef.current.height = windowDimensions[1];
    }

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
    };
  }, []);

  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas: canvasRef.current,
    });

    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1.0, CAMERA_NEAR, CAMERA_FAR);
    const controls = new OrbitControls(camera, renderer.domElement);

    cameraRef.current = camera;
    sceneRef.current = scene;
    controlsRef.current = controls;

    onResize();

    frameRef.current = requestAnimationFrame(onFrame);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.LinearEncoding;

    isActive.current = true;

    // Set up camera

    camera.position.set(-2, 3, -40);

    // Set up lights

    const ambient = new THREE.AmbientLight(0xffffff, 0.2);

    scene.add(ambient);

    const p0 = new THREE.DirectionalLight(0xffffff, 0.05);
    p0.position.set(0.5, 0, 0.866);
    scene.add(p0);

    // White directional light at half intensity shining from the top.
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 15, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;

    // Initialization of Carousel component

    const fn = async () => {
      try {
        const response = await fetch(`https://things-dev.digital-things.com/${THING_ID}.json`);
        const result = await response.json();
        const carousel = new Carousel(result, renderer, scene, camera);
        carouselRef.current = carousel;
      } catch (e) {
        console.log(e.stack);
        throw new Error(`Thing ${THING_ID} couldn't be loaded: ${e.stack}`);
      }
    };

    fn();

    return () => {
      isActive.current = false;
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} />;
};
