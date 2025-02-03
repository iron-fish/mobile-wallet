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

### New Build

```shell
nx prebuild mobile-app -- --platform ios
nx cargo-ios ironfish-native-module -- --target='ios'
cd packages/mobile-app/ios
pod install
open .
```

- Double click .xcworkspace file (requires xcode)

#### In XCode

- Click folder icon in top left of editor
- Double Click "mobileapp"
- Signing & Capabilities tab
- Under signing select "IF Labs" for team (must be added to team in App Store Connect, ask Derek)
- Bundle identifier should be prepopulated but should read "com.ironfish.mobileapp"
- In the scheme bar (top center of editor), select Any iOS Device (arm64)
- Mac menu bar - click Product -> Archive, wait for build (might take a minute or two)
- Click Distribute App button in popup
- App Store Connect -> Distribute

#### TestFlight website

- Login at appstoreconnect.apple.com
- Go to apps
- Click Iron Fish Wallet
- Click Test Flight tab
- From here you can manage internal testing groups/members and builds

### Adding Testflight user

- For internal only, go to AppStoreConnect, Users and Access
- Click +, enter email of employee that they use on their iOS device (probably not work email), add them as customer support
- Have them verify joining team by checking email
- Go to Apps -> Ironfish Wallet -> Testflight
- Left panel Click Internal Testing IF Labs
- Click + for testers
- Select new user, click add
- Have user go to email, and follow link to test app
