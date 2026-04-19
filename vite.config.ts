import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import * as child_process from 'child_process';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  // 获取完整的 commit hash 并截取后 8 位
  const fullGitHash = child_process.execSync('git rev-parse HEAD').toString().trim();
  const gitHash = fullGitHash.slice(-8);
  return {
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '__GIT_HASH__': JSON.stringify(gitHash),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      allowedHosts: true, // 核心：允许任何域名通过隧道访问
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
