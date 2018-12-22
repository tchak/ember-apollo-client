import ApolloService from '@tchak/ember-apollo-client/services/apollo';
import {
  InMemoryCache,
  IntrospectionFragmentMatcher,
} from 'apollo-cache-inmemory';
import TypeIntrospectionQuery from 'dummy/utils/graphql-type-query';

export default ApolloService.extend({
  cache() {
    return new InMemoryCache({
      fragmentMatcher: new IntrospectionFragmentMatcher({
        introspectionQueryResultData: TypeIntrospectionQuery,
      }),
    });
  },
});
