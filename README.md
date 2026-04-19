# webcraft-ts

`webcraft-ts` is a small TypeScript + Vite + Three.js Minecraft-like MVP.
The current version focuses on a clean project skeleton and a readable gameplay baseline instead of multiplayer or heavy survival systems.

## Project Overview

Current implementation includes:

- TypeScript + Vite project setup
- Three.js render loop, scene, camera, and lighting
- First-person pointer lock camera
- WASD movement and **Space jump**
- **Chunked infinite-style world**: `World` generates terrain per chunk, keeps voxel data in `Map`s, and rebuilds **instanced** meshes per chunk within a render distance
- Raycaster-based block removal and placement from **screen center**
- **Multiple block types** with **procedural canvas textures** (no external image assets required)
- Digit keys **1–9** to choose which block type to place
- Simple gravity and axis-separated AABB collision
- HUD (FPS, lock state, targeted block, placement type, block count), **legend**, and **minimap**
- `localStorage` world save and restore (player + modified blocks), debounced writes and save on unload / dispose
- Clear save button in the HUD

Deliberately out of scope:

- Multiplayer
- Server-side logic
- Inventory, crafting, mobs, or survival systems
- Advanced meshing (greedy meshing, texture atlas, LOD)
- Complex UI frameworks
- Heavy physics engines

## Run

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Controls

- Click the canvas: enter pointer lock
- Mouse move: look around
- `W` `A` `S` `D`: move
- `Space`: jump (when grounded)
- Left mouse button: remove selected block
- Right mouse button: place the **currently selected** block type on the adjacent voxel face
- `1`–`9`: select placement block type (grass, stone, dirt, wood, leaves, brick, sand, water, ice)
- `Esc`: leave pointer lock
- `Clear Save` button: clear saved state and reset the world

## Feature Scope

Implemented now:

- First-person camera with pointer lock
- Chunked terrain generation (`terrain.ts`) and **per-chunk** mesh builds (`meshBuilder.ts` uses `InstancedMesh` grouped by block type)
- World data and streaming in the `World` module (`chunkData`, `modifiedChunks`, `generatedChunks`, `chunkMeshes`)
- Center-crosshair raycast interaction (`raycast.ts`) against instanced block meshes
- Simple player gravity and AABB collision (`physics/`)
- Local save / restore for player pose/velocity and **delta** block list (`save/localSave.ts`)
- Procedural materials via `world/textures.ts`

Not implemented yet:

- Dedicated “selected block outline” highlight mesh (crosshair indicates a valid target)
- Inventory / hotbar UI beyond digit keys + legend
- Audio and particles
- Network sync

## Module Responsibilities

- `src/game/Game.ts`
  - Application orchestration
  - Wires controls, world, physics, UI, and save flow together
- `src/game/constants.ts`
  - Shared gameplay and rendering constants (includes `SAVE_KEY` and module-load `localStorage` migration cleanup)
- `src/game/types.ts`
  - Shared TypeScript types
- `src/game/core`
  - Renderer, scene, camera, and frame loop
- `src/game/controls`
  - Keyboard input, pointer lock, and look control
- `src/game/world`
  - `World` chunk lifecycle, terrain generation, mesh building, raycast hit resolution, procedural textures
- `src/game/physics`
  - Gravity and simple AABB collision handling
- `src/game/ui`
  - Crosshair, HUD, block legend, minimap
- `src/game/save`
  - `localStorage` persistence

## World Data Structure

The world is **chunk-based** (see `CHUNK_SIZE`, `RENDER_DISTANCE` in `constants.ts`):

- Each chunk has a string key `"chunkX:chunkZ"` derived from world coordinates.
- `chunkData` stores solid voxels inside a chunk as `Map<"x:y:z", BlockType>` entries.
- `modifiedChunks` records player edits (including `"air"` removals) for save serialization.
- `terrain.ts` fills new chunks with ground columns, scattered trees, and a few large landmark structures at fixed chunk coordinates.
- `meshBuilder.ts` groups blocks by type and builds one `InstancedMesh` per type per chunk for rendering.

`Chunk.ts` exists as a small class file but **`World.ts` does not use it**; chunk storage is map-based in `World`.

## Interaction Flow

1. The crosshair stays fixed at the center of the screen.
2. `world/raycast.ts` casts a ray from the camera through the screen center.
3. The closest block hit is treated as the selected block (crosshair active state reflects a hit).
4. Left click removes that block.
5. Right click places the selected block type on the face-adjacent voxel.
6. Placement is rejected if that voxel already has a block, or if a full 1×1×1 voxel at that grid cell would intersect the player AABB (`doesPlayerAabbIntersectBlock`).

## Collision Approximation

The current collision model is intentionally simple:

- The player is represented by a vertical AABB
- Horizontal movement and vertical movement are resolved axis by axis
- Each axis checks overlapping voxel cells and pushes the player out; only **solid** blocks collide (`Block` registry `solid` flag)
- Grounded state is derived from vertical collision resolution and a short ground probe

This is not physically exact, but it is stable enough for an MVP and keeps the code readable.

## Next Steps

1. Optional selected-voxel outline mesh for clearer targeting
2. Stronger save validation and safer `localStorage` error handling
3. GPU resource disposal strategy when chunks are unloaded/rebuilt
4. Audio, particles, and gameplay extensions as needed
