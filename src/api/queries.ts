
import { gql } from '@apollo/client';

export const GET_DEPENDENCY_GRAPH = gql`
query getdependencyGraph($projectId: Int!, $versionId: String!) {
projectById(projectId: $projectId) {
dependencyGraph(versionId: $versionId) {
allUnits {
id
label
name
simpleName
relativeFilePath
properties {
key
value
__typename
}
constructType {

name
prettyName
__typename
}
__typename
}
allContainers {
id
label
name
simpleName
relativeFilePath
constructType {
name
prettyName
__typename
}
properties {
key
value
__typename
}
__typename
}
membershipEdges {
id
label
member {
id
__typename

}
parent {
id
__typename
}
__typename
}
dependencyEdges {
id
label
weight
dependedUpon {
id
__typename
}
dependant {
id
__typename
}
__typename
}
hierarchyEdges {
id
label
parent {
id
__typename
}
children {
id

__typename
}
__typename
}
__typename
}
__typename
}
}
`;
