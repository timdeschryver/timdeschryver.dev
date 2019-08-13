import replace from 'rollup-plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'

const mode = process.env.NODE_ENV || 'production'

require('dotenv-extended').load({
  path: '.env.' + mode,
})

export default {
  input: './src/lambda/server.js',
  output: {
    file: './src/lambda/server.out.js',
    format: 'cjs',
  },
  plugins: [
    replace({
      'process.browser': false,
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.BASE_PATH': JSON.stringify(process.env.BASE_PATH),
    }),
    json(),
    commonjs(),
  ],
  external: [
    'apollo-server-micro',
    'graphql-tag',
    'date-fns',
    'path',
    'fs',
    'marked',
    'prismjs',
    'prismjs/components/prism-bash',
    'prismjs/components/prism-typescript',
    'prismjs/components/prism-json',
    'prismjs/components/prism-textile',
    'prismjs/components/prism-graphql',
    'prismjs/components/prism-yaml',
  ],
}
