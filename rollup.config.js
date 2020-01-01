import resolve from 'rollup-plugin-node-resolve'
import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import svelte from 'rollup-plugin-svelte'
import babel from 'rollup-plugin-babel'
import { terser } from 'rollup-plugin-terser'
import config from 'sapper/config/rollup.js'
import pkg from './package.json'

const mode = process.env.NODE_ENV || 'production'

require('dotenv-extended').load({
  path: '.env.' + mode,
})

const dev = mode === 'development'
const legacy = !!process.env.SAPPER_LEGACY_BUILD

export default {
  client: {
    input: config.client.input(),
    output: config.client.output(),
    plugins: [
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.GA_TRACKING_ID': JSON.stringify(
          process.env.GA_TRACKING_ID,
        ),
        'process.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH),
      }),
      svelte({
        dev,
        hydratable: true,
        emitCss: true,
      }),
      resolve(),
      commonjs(),

      legacy &&
        babel({
          extensions: ['.js', '.mjs', '.html', '.svelte'],
          runtimeHelpers: true,
          exclude: ['node_modules/@babel/**'],
          presets: [
            [
              '@babel/preset-env',
              {
                targets: '> 0.25%, not dead',
              },
            ],
          ],
          plugins: [
            '@babel/plugin-syntax-dynamic-import',
            [
              '@babel/plugin-transform-runtime',
              {
                useESModules: true,
              },
            ],
          ],
        }),

      !dev &&
        terser({
          module: true,
        }),
    ],
  },

  server: {
    input: config.server.input(),
    output: config.server.output(),
    plugins: [
      replace({
        'process.browser': false,
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.GA_TRACKING_ID': JSON.stringify(
          process.env.GA_TRACKING_ID,
        ),
        'process.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH),
        'process.env.BLOG_PATH': JSON.stringify('./content/blog'),
        'process.env.SNIPPETS_PATH': JSON.stringify('./content/snippets'),
      }),
      svelte({
        generate: 'ssr',
        dev,
      }),
      resolve(),
      commonjs(),
    ],
    external: Object.keys(pkg.dependencies).concat(
      require('module').builtinModules ||
        Object.keys(process.binding('natives')),
    ),
  },

  serviceworker: {
    input: config.serviceworker.input(),
    output: config.serviceworker.output(),
    plugins: [
      resolve(),
      replace({
        'process.browser': true,
        'process.env.NODE_ENV': JSON.stringify(mode),
        'process.env.GA_TRACKING_ID': JSON.stringify(
          process.env.GA_TRACKING_ID,
        ),
        'process.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH),
      }),
      commonjs(),
      !dev && terser(),
    ],
  },
}
