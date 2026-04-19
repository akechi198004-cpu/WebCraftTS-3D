import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";

/**
 * 创建一个简单的3D角色模型（Minecraft风格的方块人）
 */
export function createCharacterModel(): Group {
  const group = new Group();

  // 材质
  const skinMaterial = new MeshBasicMaterial({ color: 0xffccaa }); // 肤色
  const shirtMaterial = new MeshBasicMaterial({ color: 0x00aaff }); // 蓝衬衫
  const pantsMaterial = new MeshBasicMaterial({ color: 0x0000ff }); // 蓝裤子

  // 头 (Head)
  const headGeo = new BoxGeometry(0.5, 0.5, 0.5);
  const head = new Mesh(headGeo, skinMaterial);
  head.position.y = 1.55;
  head.name = "head";

  // 躯干 (Torso)
  const torsoGeo = new BoxGeometry(0.5, 0.75, 0.25);
  const torso = new Mesh(torsoGeo, shirtMaterial);
  torso.position.y = 0.925;
  torso.name = "torso";

  // 左臂 (Left Arm)
  // 创建一个组作为手臂的轴心点（肩膀）
  const leftArmPivot = new Group();
  leftArmPivot.position.set(0.375, 1.3, 0); // 肩膀位置
  leftArmPivot.name = "leftArm";

  const armGeo = new BoxGeometry(0.25, 0.75, 0.25);
  const leftArmMesh = new Mesh(armGeo, skinMaterial);
  leftArmMesh.position.y = -0.375; // 相对于肩膀向下偏移一半高度
  leftArmPivot.add(leftArmMesh);

  // 右臂 (Right Arm)
  const rightArmPivot = new Group();
  rightArmPivot.position.set(-0.375, 1.3, 0); // 肩膀位置
  rightArmPivot.name = "rightArm";

  const rightArmMesh = new Mesh(armGeo, skinMaterial);
  rightArmMesh.position.y = -0.375;
  rightArmPivot.add(rightArmMesh);

  // 左腿 (Left Leg)
  const leftLegPivot = new Group();
  leftLegPivot.position.set(0.125, 0.55, 0); // 臀部位置
  leftLegPivot.name = "leftLeg";

  const legGeo = new BoxGeometry(0.25, 0.55, 0.25);
  const leftLegMesh = new Mesh(legGeo, pantsMaterial);
  leftLegMesh.position.y = -0.275;
  leftLegPivot.add(leftLegMesh);

  // 右腿 (Right Leg)
  const rightLegPivot = new Group();
  rightLegPivot.position.set(-0.125, 0.55, 0); // 臀部位置
  rightLegPivot.name = "rightLeg";

  const rightLegMesh = new Mesh(legGeo, pantsMaterial);
  rightLegMesh.position.y = -0.275;
  rightLegPivot.add(rightLegMesh);

  // 将所有部分添加到根组
  group.add(head, torso, leftArmPivot, rightArmPivot, leftLegPivot, rightLegPivot);

  return group;
}

/**
 * 根据玩家速度更新角色动画（摆臂和迈腿）
 */
export function updateCharacterAnimation(character: Group, velocity: Vector3): void {
  // 计算水平速度大小
  const speed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);

  // 使用当前时间生成正弦波动画
  const time = Date.now() * 0.01;

  // 摆动幅度随速度增加而增加，静止时不摆动
  const amplitude = speed > 0.1 ? 0.8 : 0;

  const leftArm = character.getObjectByName("leftArm");
  const rightArm = character.getObjectByName("rightArm");
  const leftLeg = character.getObjectByName("leftLeg");
  const rightLeg = character.getObjectByName("rightLeg");

  if (leftArm && rightArm && leftLeg && rightLeg) {
    // 手臂和腿反向摆动
    leftArm.rotation.x = Math.sin(time) * amplitude;
    rightArm.rotation.x = -Math.sin(time) * amplitude;
    leftLeg.rotation.x = -Math.sin(time) * amplitude;
    rightLeg.rotation.x = Math.sin(time) * amplitude;
  }
}
