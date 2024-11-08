const withPointerEvents = (config) => {
  return {
    ...config,
    modResults: {
      ...config.modResults,
      contents: addPointerEventsFlag(config.modResults.contents),
    },
  };
};

function addPointerEventsFlag(appDelegateContent) {
  // Import statement
  if (!appDelegateContent.includes("#import <React/RCTConstants.h>")) {
    appDelegateContent =
      "#import <React/RCTConstants.h>\n" + appDelegateContent;
  }

  // Add the flag setting
  const didFinishLaunchingMethod = appDelegateContent.match(
    /- \(BOOL\)application[\s\S]*?(?=@end)/,
  );
  if (didFinishLaunchingMethod) {
    const updatedMethod = didFinishLaunchingMethod[0].replace(
      /{\s*/,
      "{\n  RCTSetDispatchW3CPointerEvents(YES);\n",
    );
    appDelegateContent = appDelegateContent.replace(
      didFinishLaunchingMethod[0],
      updatedMethod,
    );
  }

  return appDelegateContent;
}

export default withPointerEvents;
