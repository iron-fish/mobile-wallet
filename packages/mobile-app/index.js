global.Buffer = require("buffer").Buffer;
global.process = require("process");

require("expo-router/entry");

const ReactNativeFeatureFlags = require("react-native/Libraries/ReactNative/ReactNativeFeatureFlags");

console.log("SETTING THE THINGS");

ReactNativeFeatureFlags.shouldEmitW3CPointerEvents = () => true;
ReactNativeFeatureFlags.shouldPressibilityUseW3CPointerEventsForHover = () =>
  true;
