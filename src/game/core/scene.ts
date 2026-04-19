import { AmbientLight, Color, DirectionalLight, Scene } from "three";
import { SCENE_BACKGROUND } from "../constants";

/**
 * 创建并初始化 Three.js 场景
 */
export function createScene(): Scene {
  const scene = new Scene();
  // 设置场景背景色
  scene.background = new Color(SCENE_BACKGROUND);

  // 添加环境光，提供基础照明
  const ambientLight = new AmbientLight(0xffffff, 1.1);

  // 添加平行光（模拟太阳光）
  const directionalLight = new DirectionalLight(0xffffff, 1.25);
  directionalLight.position.set(12, 18, 10);

  // 将光源加入场景
  scene.add(ambientLight, directionalLight);
  return scene;
}
