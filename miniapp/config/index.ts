import { defineConfig } from '@tarojs/cli';
import path from 'node:path';
import devConfig from './dev';
import prodConfig from './prod';

export default defineConfig<'webpack5'>({
  projectName: 'fitgenius-miniapp',
  date: '2026-03-30',
  designWidth: 375,
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  compiler: 'webpack5',
  plugins: [],
  alias: {
    '@': path.resolve(__dirname, '..', 'src')
  },
  cache: { enable: true },
  mini: {
    postcss: {
      pxtransform: { enable: true, config: {} },
      cssModules: { enable: false, config: { namingPattern: 'module', generateScopedName: '[name]__[local]___[hash:base64:5]' } }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static'
  },
  defineConstants: {
    API_BASE_URL: JSON.stringify(process.env.API_BASE_URL || 'https://fit-backend-1jpe.onrender.com/api')
  }
}, (merge) => process.env.NODE_ENV === 'development' ? merge({}, devConfig) : merge({}, prodConfig));
