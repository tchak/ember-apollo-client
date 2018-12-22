# ember-apollo-client

_Use [apollo-client][apollo-client] and GraphQL from your Ember app._

![Download count all time](https://img.shields.io/npm/dt/ember-apollo-client.svg) [![npm version](https://badge.fury.io/js/ember-apollo-client.svg)](https://badge.fury.io/js/ember-apollo-client) [![Travis CI Build Status](https://travis-ci.org/bgentry/ember-apollo-client.svg?branch=master)](https://travis-ci.org/bgentry/ember-apollo-client) [![Ember Observer Score](https://emberobserver.com/badges/ember-apollo-client.svg)](https://emberobserver.com/addons/ember-apollo-client)

This addon exposes the following dependencies to an ember application:

* [apollo-client][apollo-client]
* [apollo-cache][apollo-cache]
* [apollo-cache-inmemory][apollo-cache-inmemory]
* [apollo-link][apollo-link]
* [apollo-link-context][apollo-link-context]
* [apollo-link-http][apollo-link-http]
* [graphql][graphql-repo]

You may want to install these optional dependencies as well:

* [graphql-tag][graphql-tag-repo]
* [graphql-tools][graphql-tools-repo]

This addon is battle tested: it has been used to build several large apps. As such, we've solved real-world problems such as reliable testing and preventing resource leaks by unsubscribing from watch queries.

[graphql-repo]: https://github.com/graphql/graphql-js "GraphQL"
[apollo-cache]: https://www.npmjs.com/package/apollo-cache
[apollo-cache-inmemory]: https://www.npmjs.com/package/apollo-cache-inmemory
[apollo-link]: https://github.com/apollographql/apollo-link
[apollo-link-context]: https://www.npmjs.com/package/apollo-link-context
[apollo-link-http]: https://www.npmjs.com/package/apollo-link-http
[graphql-tag-repo]: https://github.com/apollographql/graphql-tag "graphql-tag"
[graphql-tools-repo]: https://github.com/apollographql/graphql-tools "graphql-tools"

## Installation

```
ember install ember-apollo-client
```

This should also automatically install `ember-fetch`.

Install the [Apollo Client Developer tools for Chrome](https://chrome.google.com/webstore/detail/apollo-client-developer-t/jdkknkkbebbapilgoeccciglkfbmbnfm) for a great GraphQL developer experience!

## Compatibility

This addon works and is fully tested with:

* Ember.js 2.12+
* FastBoot 1.0+

## Example App

If you are looking for a full tutorial using `ember-apollo-client` check out the tutorial on [How To GraphQL](https://howtographql.com), written by [DevanB](https://github.com/DevanB).

The application built in the tutorial is also available on the [How To GraphQL repository](http://github.com/howtographql/ember-apollo).

## Configuration

In your app's `config/environment.js`, configure the URL for the GraphQL API.

```js
let ENV = {
  ...
  apollo: {
    apiURL: 'https://test.example/graphql',
    // Optionally, set the credentials property of the Fetch Request interface
    // to control when a cookie is sent:
    // requestCredentials: 'same-origin', // other choices: 'include', 'omit'
  },
  ...
}
```

Additional configuration of the ApolloClient can be done by extending the Apollo
service and overriding the `clientOptions` property. See the
[Apollo Service API][apollo-service-api] for more info.

### Dependencies

This addon uses [ember-auto-import](https://github.com/ef4/ember-auto-import) to import dependencies.

If you desire any additional graphql dependencies, install them with npm/yarn and import as desired.

## Usage

### Fetching data

GraphQL queries should be placed in external files, which are automatically
made available for import:

`app/gql/queries/human.graphql`

```graphql
query human($id: String!) {
  human(id: $id) {
    name
  }
}
```

Though it is not recommended, you can also use the `graphql-tag` package to
write your queries within your JS file:

```js
import gql from "graphql-tag";

const query = gql`
  query human($id: String!) {
    human(id: $id) {
      name
    }
  }
`;
```

Within your routes, you can query for data using the `RouteQueryManager`
mixin and `watchQuery`:

`app/routes/some-route.js`

```js
import Route from "@ember/routing/route";
import { RouteQueryManager } from "ember-apollo-client";
import query from "my-app/gql/queries/human";

export default Route.extend(RouteQueryManager, {
  model(params) {
    let variables = { id: params.id };
    return this.get('apollo').watchQuery({ query, variables }, "human");
  }
});
```

This performs a [`watchQuery` on the ApolloClient][watch-query]. The resulting object is an
`Ember.Object` and therefore has full support for computed properties,
observers, etc.

If a subsequent query (such as a mutation) happens to fetch the same data while
this query's subscription is still active, the object will immediately receive
the latest attributes (just like ember-data).

Please note that when using `watchQuery`, you must
[unsubscribe][unsubscribing] when you're done with the query data. You should
only have to worry about this if you're using the [Apollo
service][apollo-service-api] directly. If you use the `RouteQueryManager`
mixin in your routes, or the `ComponentQueryManager` in your data-loading
components, or the `ObjectQueryManager` in your data-loading on service or class that extend `Ember.Object`, all active watch queries are tracked and unsubscribed when the route is exited or the component and Ember.Object is destroyed. These mixins work by injecting a query manager named `apollo` that functions as a proxy to the `apollo`
service.

You can instead use `query` if you just want a single query with a POJO
response and no watch updates.

If you need to access the Apollo Client [ObservableQuery][observable-query],
such as for pagination, you can retrieve it from a `watchQuery` result using
`getObservable`:

```js
import Route from "@ember/routing/route";
import { getObservable } from "ember-apollo-client";

export default Route.extend(RouteQueryManager, {
  model() {
    let result = this.get('apollo').watchQuery(...);
    let observable = getObservable(result);
    observable.fetchMore(...) // utilize the ObservableQuery
    ...
  }
});
```

See the [detailed query manager docs][query-manager-api] for more details on
usage, or the [Apollo service API][apollo-service-api] if you need to use
the service directly.

### GraphQL Subscriptions

GQL Subscriptions allow a client to subscribe to specific queries they are interested in tracking. The syntax for doing this is similar to `query` / `watchQuery`, but there are a few main differences:

- ) you must define a `subscription` (versus a `query` or `mutation`)
- ) because subscriptions are async by nature, you have to listen for these events and act accordingly.
- ) subscriptions require websockets, so must configure your `link` accordingly

**Creating your subscription:**

`my-app/gql/subscription/new-human`

```
subscription {
  newHuman() {
    name
  }
}
```

**Subscribing from inside a route:**

`app/routes/some-route.js`

```js
import Route from "@ember/routing/route";
import { RouteQueryManager } from "ember-apollo-client";
import query from "my-app/gql/subscription/new-human";

export default Route.extend(RouteQueryManager, {
  setupSubscription() {
    this.get("apollo")
        .subscribe({ query }, "human");
        .on("event", event => alert(`${event.name} was just born!`));
  },
});
```

The big advantage of using the RouteQueryManager is that when you navigate away from this route, all subscriptions created will be terminated. That said, if you want to manually unsubscribe (or are not using the RouteQueryManager) `subscription.unsubscribe()` will do the trick.

**Enabling Websockets**

While this library should work w/ any back-end implementation, here's an example with Authenticated [Phoenix](https://github.com/phoenixframework/phoenix) + [Absinthe](https://github.com/absinthe-graphql/absinthe):

`my-app/services/apollo.js`
```js
import ApolloService from 'ember-apollo-client/services/apollo';
import { Socket } from 'phoenix';
import { inject as service } from "@ember/service";
import { createAbsintheSocketLink } from '@absinthe/socket-apollo-link';
import AbsintheSocket from '@absinthe/socket';
import { computed } from '@ember/object';


export default ApolloService.extend({
  session: service(),

  link: computed(function () {
    const socket = new Socket("ws://socket-url", {
      params: { token: this.get('session.token') },
    });
    const absintheSocket = AbsintheSocket.create(socket);

    return createAbsintheSocketLink(absintheSocket);
  }),
});

```
Note: This will switch **all** gql communication to use websockets versus `http`. If you want to conditionally use websockets for only subscriptions (a common pattern) this is where [Apollo Link Composition](https://www.apollographql.com/docs/link/composition.html) comes in. Specifically, the `split` function is what we're after (note we are using [apollo-utilities](https://www.npmjs.com/package/apollo-utilities), a helpful `npm` package):

`my-app/services/apollo.js`
```js
import { computed } from '@ember/object';
import ApolloService from 'ember-apollo-client/services/apollo';
import { split } from 'apollo-link';
import { getMainDefinition } from 'apollo-utilities';
import { createAbsintheSocketLink } from '@absinthe/socket-apollo-link';
import AbsintheSocket from '@absinthe/socket';

export default ApolloService.extend({
  session      : service(),

link: computed(function () {
    const httpLink = this._super(...arguments);
    const socket = new Socket("ws://socket-url", {
      params: { token: this.get('session.token') },
    });
    const absintheSocket = AbsintheSocket.create(socket);

    return split(
      ({ query }) => {
        const { kind, operation } = getMainDefinition(query);

        return kind === 'OperationDefinition' && operation === 'subscription';
      },
      socketLink,
      httpLink
    );
  }),

```

### Mutations and Fragments

You can perform a mutation using the `mutate` method. You can also use GraphQL
fragments in your queries. This is especially useful if you want to ensure that
you refetch the same attributes in a subsequent query or mutation involving the
same model(s).

The following example shows both mutations and fragments in action:

`app/gql/fragments/review-fragment.graphql`

```graphql
fragment ReviewFragment on Human {
  stars
  commentary
}
```

`app/gql/mutations/create-review.graphql`

```graphql
#import 'my-app/gql/fragments/review-fragment'

mutation createReview($ep: Episode!, $review: ReviewInput!) {
  createReview(episode: $ep, review: $review) {
    review {
      ...ReviewFragment
    }
  }
}
```

`app/routes/my-route.js`

```js
import Route from "@ember/routing/route";
import { inject as service } from "@ember/service";
import EmberObject from "@ember/object";
import mutation from "my-app/gql/mutations/create-review";

export default Route.extend({
  apollo: service(),

  model() {
    return EmberObject.create({});
  },

  actions: {
    createReview(ep, review) {
      let variables = { ep, review };
      return this.get("apollo").mutate({ mutation, variables }, "review");
    }
  }
});
```

### Query manager API

* `watchQuery(options, resultKey)`: This calls the
  [`ApolloClient.watchQuery`][watch-query] method. It returns a promise that
  resolves with an `Ember.Object`. That object will be updated whenever the
  `watchQuery` subscription resolves with new data. As before, the `resultKey`
  can be used to resolve beneath the root.

  The query manager will automatically unsubscribe from this object.
* `subscribe(options, resultKey)`: This calls the
  [`ApolloClient.subscribe`][subscribe] method. It returns a promise that
  resolves with an `EmberApolloSubscription`. You can use this object in a few ways to keep
  track of your subscription:
  - emberApolloSubscription.on('event', event => do_something_with(event)); // manually act on event
  - emberApolloSubscription.get('lastEvent'); // return the most recently received event data

  As before, the `resultKey` can be used to resolve beneath the root.

  The query manager will automatically unsubscribe from this object. If you want to manually
  unsubscribe, you can do so with `emberApolloSubscription.apolloUnsubscribe();`
* `query(options, resultKey)`: This calls the
  [`ApolloClient.query`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.query)
  method. It returns a promise that resolves with the raw POJO data that the
  query returns. If you provide a `resultKey`, the resolved data is grabbed from
  that key in the result.
* `mutate(options, resultKey)`: This calls the
  [`ApolloClient.mutate`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.mutate)
  method. It returns a promise that resolves with the raw POJO data that the
  mutation returns. As with the query methods, the `resultKey` can be used to
  resolve beneath the root.

### Apollo service API

You should not need to use the Apollo service directly for most regular
usage, instead utilizing the `RouteQueryManager`, `ObjectQueryManager` and `ComponentQueryManager` mixins. However, you will probably need to customize options on the `apollo` service, and might need to query it directly for some use cases (such as
loading data from a service rather than a route or component).

The `apollo` service has the following public API:

* `clientOptions`: This computed property should return the options hash that
  will be passed to the `ApolloClient` [constructor][ac-constructor]. You can
  override this property to configure the client this service uses:
  ```js
  const OverriddenService = ApolloService.extend({
    clientOptions: computed(function() {
      return {
        link: this.get("link"),
        cache: this.get("cache")
      };
    })
  });
  ```
* `link`: This computed property provides a list of [middlewares and afterwares](https://www.apollographql.com/docs/react/advanced/network-layer.html#network-interfaces) to the [Apollo Link](https://www.apollographql.com/docs/link/) the interface for fetching and modifying control flow of GraphQL requests. To create your middlewares/afterwares:

  ```js
    link: computed(function() {
      let httpLink = this._super(...arguments);

      // Middleware
      let authMiddleware = setContext(async request => {
        if (!token) {
          token = await localStorage.getItem('token') || null;
        }
        return {
          headers: {
            authorization: token
          }
        };
      });

      // Afterware
      const resetToken = onError(({ networkError }) => {
        if (networkError && networkError.statusCode === 401) {
          // remove cached token on 401 from the server
          token = undefined;
        }
      });

      const authFlowLink = authMiddleware.concat(resetToken);

      return authFlowLink.concat(httpLink);
    }),
  ```

  Example with [ember-simple-auth](https://github.com/simplabs/ember-simple-auth):

  ```js
  import { computed } from "@ember/object";
  import { inject as service } from "@ember/service";
  import ApolloService from "ember-apollo-client/services/apollo";
  import { setContext } from "apollo-link-context";
  import { Promise as RSVPPromise } from "rsvp";

  const OverriddenService = ApolloService.extend({
    session: service(),

    link: computed(function() {
      let httpLink = this._super(...arguments);

      let authLink = setContext((request, context) => {
        return this._runAuthorize(request, context);
      });
      return authLink.concat(httpLink);
    }),

    _runAuthorize() {
      if (!this.get("session.isAuthenticated")) {
        return {};
      }
      return new RSVPPromise(success => {
        this.get("session").authorize(
          "authorizer:oauth2",
          (headerName, headerContent) => {
            let headers = {};
            headers[headerName] = headerContent;
            success({ headers });
          }
        );
      });
    }
  });
  ```

* `watchQuery(options, resultKey)`: This calls the
  [`ApolloClient.watchQuery`][watch-query] method. It returns a promise that
  resolves with an `Ember.Object`. That object will be updated whenever the
  `watchQuery` subscription resolves with new data. As before, the
  `resultKey` can be used to resolve beneath the root.

  When using this method, **it is important to [unsubscribe][unsubscribing]**
  from the query when you're done with it.

* `query(options, resultKey)`: This calls the
  [`ApolloClient.query`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.query)
  method. It returns a promise that resolves with the raw POJO data that the
  query returns. If you provide a `resultKey`, the resolved data is grabbed from
  that key in the result.
* `mutate(options, resultKey)`: This calls the
  [`ApolloClient.mutate`](https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.mutate)
  method. It returns a promise that resolves with the raw POJO data that the
  mutation returns. As with the query methods, the `resultKey` can be used to
  resolve beneath the root.

### Unsubscribing from watch queries

Apollo Client's `watchQuery` will continue to update the query with new data
whenever the store is updated with new data about the resolved objects. This
happens until you explicitly unsubscribe from it.

In ember-apollo-client, most unsubscriptions are handled automatically by the
`RouteQueryManager`, `ObjectQueryManager` and `ComponentQueryManager` mixins,
so long as you use them.

If you're fetching data elsewhere, such as in an Ember Service, or if you use
the Apollo service directly, you are responsible for unsubscribing from
`watchQuery` results when you're done with them. This is exposed on the
result of `query` via a method `_apolloUnsubscribe`.

### Injecting the `RouteQueryManager` mixin into all routes

ember-apollo-client does not automatically inject any dependencies into your
routes. If you want to inject this mixin into all routes, you should utilize
a base route class:

`app/routes/base.js`

```js
import Route from "@ember/routing/route";
import { RouteQueryManager } from "ember-apollo-client";

export default Route.extend(RouteQueryManager);
```

Then extend from that in your other routes:

`app/routes/a-real-route.js`

```js
import Base from "my-app/routes/base";

export default Base.extend(
  ...
)
```

### Use with Fastboot

Ember Apollo Client works with FastBoot out of the box as long that SSR is enabled. In order to enable SSR, define it on apollo service:

Example:

```js
const OverriddenService = ApolloService.extend({
  clientOptions: computed(function() {
    return {
      ssrMode: true,
      link: this.get("link"),
      cache: this.get("cache")
    };
  })
});
```

Since you only want to fetch each query result once, pass the `ssrMode: true` option to the Apollo Client constructor to avoid repeated force-fetching.

#### Skipping queries for SSR

If you want to intentionally skip a query during SSR, you can pass `ssr: false` in the query options. Typically, this will mean the component will get rendered in its loading state on the server. For example:

```js
actions: {
  refetchModel() {
    this.get('apollo').query({
      query,
      variables,
      // Don't run this query on the server
      ssr: false
    });
  }
}
```

## Contributors

A special thanks to the following contributors:

* Michael Villander ([@villander](https://github.com/villander))
* Dan Freeman ([@dfreeman](https://github.com/dfreeman))
* Vinícius Sales ([@viniciussbs](https://github.com/viniciussbs))
* Laurin Quast ([@n1ru4l](https://github.com/n1ru4l))
* Elias Balafoutis ([@balaf](https://github.com/balaf))
* Katherine Smith ([@TerminalStar](https://github.com/TerminalStar))

[ac-constructor]: https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClientOptions
[apollo-client]: https://github.com/apollographql/apollo-client
[apollo-service-api]: #apollo-service-api
[observable-query]: https://www.apollographql.com/docs/react/api/apollo-client.html#ObservableQuery
[query-manager-api]: #query-manager-api
[unsubscribing]: #unsubscribing-from-watch-queries
[watch-query]: https://www.apollographql.com/docs/react/api/apollo-client.html#ApolloClient.watchQuery

## License

This project is licensed under the [MIT License](LICENSE.md).
