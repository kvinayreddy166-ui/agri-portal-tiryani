import { build } from 'vite';
import config from '../vite.config.js';

try {
  await build({ ...config, configFile: false });
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
