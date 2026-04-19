# 项目目标：webcraft-ts

当前目录是一个基于 TypeScript + Vite + Three.js 的项目。
目标是实现一个运行在浏览器里的 Minecraft-like 体素沙盒 MVP。

## 要求
1. 使用 TypeScript。
2. 使用 Vite 作为构建工具。
3. 使用 Three.js 进行 3D 渲染。
4. 保持代码结构清晰，按模块组织（**以下以仓库 `src/` 实际文件为准**）：

```
src/
  main.ts
  style.css
  game/
    Game.ts              # 编排：循环、输入、物理、世界、UI、存档
    constants.ts         # 常量（含 SAVE_KEY、chunk、玩家、渲染等）
    types.ts             # 共享类型
    core/
      renderer.ts
      scene.ts
      camera.ts
      loop.ts
    controls/
      pointerLock.ts
      input.ts
    world/
      Block.ts           # 方块注册表（颜色、是否固体等）
      Chunk.ts           # 类存在；当前 World 未使用，分块由 World 内 Map/键管理
      World.ts           # chunk 数据、网格生命周期、序列化增量
      terrain.ts         # 程序化地形与地标结构
      raycast.ts         # 屏幕中心射线与 InstancedMesh 命中解析
      meshBuilder.ts     # 按方块类型合并为 InstancedMesh
      textures.ts        # 程序化 Canvas 纹理与材质缓存
    physics/
      collision.ts
      gravity.ts
    ui/
      crosshair.ts
      hud.ts
      legend.ts          # 当前放置方块类型图例
      minimap.ts         # 顶视小地图
    save/
      localSave.ts
```

5. 第一阶段只实现 MVP。不要求优化，不需要过多复杂的系统（比如网络、多人、背包、合成系统等）。
6. 开发过程中，把重要信息写在 README 中。
7. 视觉资源以**明亮配色 + 程序化简易贴图**为主：`textures.ts` 用 `CanvasTexture` 生成噪声/砖缝等，不依赖外部图片资产。
8. 核心范围（与 `Game.ts` 行为一致）：
   - 第一人称视角（指针锁定）
   - WASD 移动、`Space` 跳跃
   - 鼠标控制视角（YXZ 顺序）
   - 屏幕中心射线选取方块；**准星通过激活态提示是否命中**（无独立“选中方块描边 mesh”）
   - 左键删除方块、右键在相邻格放置方块
   - 数字键 `1`–`9` 切换放置方块类型（见 `types.BlockType`）
   - 简单重力与 AABB 分轴碰撞
   - 无限式扩展世界：`World` 按玩家位置管理 chunk 网格与 `RENDER_DISTANCE`
   - `localStorage` 保存玩家状态与方块修改增量（防抖写入）
9. 严格遵守模块边界划分：
   - 渲染与主循环在 `core`
   - 体素数据、地形、网格、射线在 `world`
   - 输入与指针锁定在 `controls`
   - 碰撞与重力在 `physics`
   - DOM UI 在 `ui`
   - 存档序列化在 `save`
10. 完成后：
   - 检查是否有无用文件
   - 说明每个模块职能
   - 总结当前工作
   - 规划后续扩展路线，不需要现在实现

## 实施风格
- 保持高可读性
- 不要写一整坨的“屎山”代码
- 不要使用任何隐式 any，必须明确类型；**例外**：与 Three.js `userData` 交互处若类型过宽，可用显式断言并集中在一处（参见 `meshBuilder.ts`）
- 有必要时添加注释
- 但有些特性需要权衡，请选择最稳定的实现
