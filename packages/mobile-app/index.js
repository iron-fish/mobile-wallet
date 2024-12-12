global.Buffer = require("buffer").Buffer;
process.argv = [];

require("expo-router/entry");

const ReactNativeFeatureFlags = require("react-native/Libraries/ReactNative/ReactNativeFeatureFlags");

ReactNativeFeatureFlags.shouldEmitW3CPointerEvents = () => true;
ReactNativeFeatureFlags.shouldPressibilityUseW3CPointerEventsForHover = () =>
  true;
