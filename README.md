# Iron Fish Mobile Wallet

This project was generated using [Nx](https://nx.dev).

## Quick Start

### Setup

- Optional: `npm i -g nx`
  - This will allow you to run `nx` commands without `npx`. If you do not want to install `nx` globally, you can run `npx nx` instead of `nx`.
- Install dependencies: `npm install`

### Running the Mobile App

1. The app uses demo data by default. To use wallet servers instead, copy `packages/mobile-app/.env.template` to `packages/mobile-app/.env` and set `EXPO_PUBLIC_DEMO_API=false`.

1. In a terminal, build and run the iOS app:
   - `nx ios mobile-app`

- Alternatively, install this [VSCode extension](https://ide.swmansion.com/) for running the app within your editor

## Running tasks

To execute tasks with Nx use the following syntax:

```
npx nx <target> <project> <...options>
```

You can also run multiple targets:

```
npx nx run-many -t <target1> <target2>
```

..or add `-p` to filter specific projects

```
npx nx run-many -t <target1> <target2> -p <proj1> <proj2>
```

Targets can be defined in the `package.json` or `projects.json`. Learn more [in the docs](https://nx.dev/features/run-tasks).

## TestFlight

[TestFlight](https://developer.apple.com/testflight/) makes it easy to deploy beta builds to iOS users. To deploy, you'll need to have XCode installed.

### Preparing the build

1. Increment the build number in `app.json`. Updating just the build allows for quicker deploys to TestFlight, so avoid updating the version number.

1. Prebuild the app:
    ```shell
    nx prebuild mobile-app -- --platform ios
    ```
1. Install native dependencies:
    ```
    nx pod-native mobile-app
    ```
1. Open the XCode Workspace:
    ```
    open packages/mobile-app/ios/IronFish.xcworkspace
    ```

#### Creating and uploading the build

1. Click the folder icon in top left of editor (Project navigator).
1. Click "IronFish", then the Signing & Capabilities tab.
1. Verify that "IF Labs" displays for the team. If not, select it if available, or sign in with an Apple account that has access to the developer team.
1. Verify that the bundle identifier reads "network.ironfish.mobilewallet"
1. Switch to the Info tab. Verify that the following fields match `app.json`:
    * "Bundle version" should match `buildNumber`
    * "Bundle version string (short)" should match `version`
1.  In the scheme bar (top center of editor), select "Any iOS Device (arm64)"
1. In the Mac menu bar, click Product -> Archive, then wait for the build to complete.
    * `codesign` may ask you to enter your password to sign the build.
1. The list of builds will appear (You can return here with Window -> Organizer). Select the latest archive and click "Distribute App".
1. Select "App Store Connect", then click "Distribute".
  * There may be some errors about missing symbols, but it's fine to ignore.

#### Deploying the build to TestFlight

1. Login at appstoreconnect.apple.com
1. Click "Apps"
1. Click "Iron Fish Wallet"
1. Click the TestFlight tab
1. Wait for the build you uploaded to finish processing
    * You may need to complete encryption compliance questions.
1. Click on the build number
1. Under Test Details, fill out information about what changed.
1. Under Group, click the plus and add "External Testers".
1. Check "Automatically notify testers"
1. Fill out the field with the same content as Test Details
1. Click Submit for Review
