import { AmbientLight, Color, DirectionalLight, Scene } from "three";
import { SCENE_BACKGROUND } from "../constants";

export function createScene(): Scene {
  const scene = new Scene();
  scene.background = new Color(SCENE_BACKGROUND);

  const ambientLight = new AmbientLight(0xffffff, 1.1);
  const directionalLight = new DirectionalLight(0xffffff, 1.25);
  directionalLight.position.set(12, 18, 10);

  scene.add(ambientLight, directionalLight);
  return scene;
}
