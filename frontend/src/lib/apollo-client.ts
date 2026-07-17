import { ApolloClient, InMemoryCache, HttpLink, split } from "@apollo/client";
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({
  uri: 'http://localhost/graphql'
});

import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }
  
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    }
  }
});

const wsLink = typeof window !== "undefined" ? new GraphQLWsLink(createClient({
  url: 'ws://localhost/graphql',
})) : null;

const splitLink = typeof window !== "undefined" && wsLink != null
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

export const client = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
});