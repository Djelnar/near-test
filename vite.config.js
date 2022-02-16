import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill'

export default {
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
}
