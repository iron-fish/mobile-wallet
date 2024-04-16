# data-facade

An abstraction layer between a React application and its underlying data source.

## Motivation

The initial version of the mobile app will get its data from the `wallet-server`, a server that gets data from an Iron Fish node. Though the data source is fixed for now, we want to make it easy to switch to a different data source in the future. By using this abstraction layer, we'll be able to switch between data sources without needing to make changes to the React components themselves.

## Usage

1. Define your interface and create handlers
2. Create facade context and export `FacadeProvider` and `useFacade`
3. Wrap your application with `FacadeProvider`
4. Use `useFacade` hook to access the facade in your components
