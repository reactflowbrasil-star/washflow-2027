#!/data/user/0/com.agy/files/usr/bin/bash
export NEXT_TEST_WASM_DIR="/storage/emulated/0/Download/car-wash-main/car-wash-main/node_modules/@next/swc-wasm-nodejs"
export NAPI_RS_NATIVE_LIBRARY_PATH="/data/user/0/com.agy/files/antigravity/beautiful-newton/tailwindcss-oxide.android-arm64.node"
node --require /data/user/0/com.agy/files/antigravity/beautiful-newton/patch-child-process.cjs node_modules/next/dist/bin/next dev --webpack -H 0.0.0.0 -p 3000
