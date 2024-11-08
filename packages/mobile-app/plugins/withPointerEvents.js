const { withAppDelegate } = require("@expo/config-plugins");

const withPointerEvents = (config) => {
  return withAppDelegate(config, (config) => {
    const appDelegate = config.modResults;

    // Add import
    if (!appDelegate.contents.includes("#import <React/RCTConstants.h>")) {
      appDelegate.contents = `#import <React/RCTConstants.h>\n${appDelegate.contents}`;
    }

    // Add RCTSetDispatchW3CPointerEvents
    const didFinishLaunchingMethod = appDelegate.contents.match(
      /(?:^|\n).*didFinishLaunchingWithOptions.*\n?\s*{/,
    );

    if (didFinishLaunchingMethod) {
      const insertAt =
        didFinishLaunchingMethod.index + didFinishLaunchingMethod[0].length;
      const newContents =
        appDelegate.contents.slice(0, insertAt) +
        "\n  RCTSetDispatchW3CPointerEvents(YES);" +
        appDelegate.contents.slice(insertAt);

      appDelegate.contents = newContents;
    }

    return config;
  });
};

module.exports = withPointerEvents;
