import React from "react";
import { createRoot } from "react-dom/client";
// import * as THREE from "three";
import "./index.module.scss";

import { ExamplePage } from "./pages/ExamplePage";

// (window as any).THREE = THREE;

const root = createRoot(document.getElementById("root"));
root.render(<ExamplePage />);
