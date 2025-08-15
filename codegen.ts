import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  overwrite: true,
  schema: process.env.INDEXER_GQL_URL || 'https://indexer.mainnet.aptoslabs.com/v1/graphql',
  documents: ['src/lib/gql/**/*.graphql'],
  generates: {
    'src/lib/gql/generated/': {
      preset: 'client',
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-query'
      ],
      presetConfig: {
        gqlTagName: 'gql',
        fragmentMasking: false
      },
      config: {
        scalars: {
          'Address': 'string',
          'Hash': 'string',
          'U64': 'string',
          'U128': 'string',
          'U256': 'string',
          'Timestamp': 'string',
          'JSON': 'Record<string, any>',
          'Bytes': 'string',
          'Boolean': 'boolean',
          'Int': 'number',
          'Float': 'number',
          'String': 'string',
          'ID': 'string'
        },
        skipTypename: false,
        withHooks: true,
        withHOC: false,
        withComponent: false,
        withResultType: true,
        withMutationFn: true,
        withRefetchFn: true,
        dedupeOperationSuffix: true,
        dedupeFragments: true,
        exposeQueryKeys: true,
        exposeFetcher: true,
        addInfiniteQueryParam: true,
        reactQueryVersion: 5
      }
    }
  },
  ignoreNoDocuments: true,
  hooks: {
    afterOneFileWrite: ['prettier --write']
  }
};

export default config;
