import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import vue from '@vitejs/plugin-vue';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const stdout = process.stdout as typeof process.stdout & {
  clearLine?: (dir: -1 | 0 | 1, callback?: () => void) => boolean;
  cursorTo?: (x: number, y?: number, callback?: () => void) => boolean;
  moveCursor?: (dx: number, dy: number, callback?: () => void) => boolean;
};
if (!stdout.clearLine) stdout.clearLine = () => true;
if (!stdout.cursorTo) stdout.cursorTo = () => true;
if (!stdout.moveCursor) stdout.moveCursor = () => true;

let gitBranch = 'HEAD';
let gitCommitHash = 'unknown';
try {
  gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  gitCommitHash = execSync('git rev-parse HEAD').toString().trim();
} catch {
  // Git details not available in this environment
}

// Custom plugin to remove crossorigin from script tags
const removeCrossOriginPlugin = () => {
  return {
    name: 'remove-crossorigin',
    transformIndexHtml(html: string) {
      return html.replace(/crossorigin/g, '');
    }
  };
};

const devBuild = gitBranch !== 'HEAD' && process.env.NODE_ENV === 'development';

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        external: ['bufferutil', 'utf-8-validate'],
        input: {
          index: 'src/main/index.ts'
        }
      }
    },
    define: {
      ENIXM_DISABLE_UPDATES: devBuild,
      ENIXM_UPDATE_FEED_OWNER: process.env.ENIXM_UPDATE_FEED_OWNER ? `'${process.env.ENIXM_UPDATE_FEED_OWNER}'` : "'enixyazilim'",
      ENIXM_UPDATE_FEED_REPOSITORY: process.env.ENIXM_UPDATE_FEED_REPOSITORY ? `'${process.env.ENIXM_UPDATE_FEED_REPOSITORY}'` : "'EnixMusic'"
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      isolatedEntries: true,
      rollupOptions: {
        input: {
          main_window: 'src/renderer/windows/main/preload.ts',
          settings_window: 'src/renderer/windows/settings/preload.ts',
          authorize_companion_window: 'src/renderer/windows/authorize-companion/preload.ts',
          enixmview: 'src/renderer/enixmview/preload.ts'
        }
      }
    }
  },
  renderer: {
    base: './',
    root: 'src/renderer',
    build: {
      rollupOptions: {
        input: {
          main_window: 'src/renderer/windows/main/index.html',
          settings_window: 'src/renderer/windows/settings/index.html',
          authorize_companion_window: 'src/renderer/windows/authorize-companion/index.html'
        },
        output: {
          manualChunks: {
            vue: ['vue']
          }
        }
      }
    },
    plugins: [
      vue({
        features: {
          optionsAPI: false
        }
      }),
      removeCrossOriginPlugin()
    ],
    resolve: {
      alias: {
        '~shared': resolve(__dirname, 'src/shared'),
        '~assets': resolve(__dirname, 'src/assets')
      }
    },
    define: {
      ENIXM_GIT_COMMIT_HASH: JSON.stringify(gitCommitHash),
      ENIXM_GIT_BRANCH: JSON.stringify(gitBranch)
    }
  }
});
