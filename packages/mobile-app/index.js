global.Buffer = require("buffer").Buffer;
global.process = require("process");

const ReactNativeFeatureFlags = require("react-native/Libraries/ReactNative/ReactNativeFeatureFlags");

ReactNativeFeatureFlags.shouldEmitW3CPointerEvents = () => true;
ReactNativeFeatureFlags.shouldPressibilityUseW3CPointerEventsForHover = () =>
  true;

//index.js
const { registerRootComponent } = require('expo');
const { ExpoRoot } = require("expo-router");

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./app"); //Path with src folder
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
