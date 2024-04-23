# facades

Facades use the `data-facade` package to provide a `tanstack/react-query` interface between the wallet code in the `data` folder and the Expo frontend in the `app` folder.

The facade routes are intended to be similar to the [Iron Fish RPC routes](https://github.com/iron-fish/ironfish/tree/master/ironfish/src/rpc/routes). Our goal is that in the future, we could implement a facade that connects directly to an Iron Fish node with minimal changes to the frontend code.