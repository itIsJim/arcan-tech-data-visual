
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

const httpLink = new HttpLink({
    uri: 'https://api-demo.arcan.tech/graphql',
});

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

export default client;
