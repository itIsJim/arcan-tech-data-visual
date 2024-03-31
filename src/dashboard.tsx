'use client'
import CytoscapeComponent from "react-cytoscapejs";
import {useQuery} from "@apollo/client";
import {GET_DEPENDENCY_GRAPH} from "./api/queries.ts";
import React, {useState} from "react";
import {Stylesheet} from "cytoscape";


interface KeyValuePair {
    key: string;
    value: string;
    __typename: string;
}

interface ConstructType {
    name: string;
    prettyName: string;
    __typename: string;
}

interface Unit {
    id: number;
    label: string;
    name: string;
    simpleName: string;
    relativeFilePath: string;
    properties: KeyValuePair[];
    constructType: ConstructType;
    __typename: string;
}

interface Container {
    id: number;
    label: string;
    name: string;
    simpleName: string;
    relativeFilePath: string;
    properties: KeyValuePair[];
    constructType: ConstructType;
    __typename: string;
}

interface MemberOrDependant {
    id: number;
    __typename: string;
}

interface MembershipEdge {
    id: number;
    label: string;
    member: MemberOrDependant;
    parent: MemberOrDependant;
    __typename: string;
}

interface DependencyEdge {
    id: number;
    label: string;
    weight: number;
    dependedUpon: MemberOrDependant;
    dependant: MemberOrDependant;
    __typename: string;
}

interface HierarchyEdge {
    id: number;
    label: string;
    parent: MemberOrDependant;
    children: MemberOrDependant[];
    __typename: string;
}

interface DependencyGraph {
    allUnits: Unit[];
    allContainers: Container[];
    membershipEdges: MembershipEdge[];
    dependencyEdges: DependencyEdge[];
    hierarchyEdges: HierarchyEdge[];
    __typename: string;
}

interface ProjectById {
    dependencyGraph: DependencyGraph;
    __typename: string;
}

interface QueryResponse {
    projectById: ProjectById;
}

const nodeStyles = {
    container: { backgroundColor: '#82ff8f', shape: 'triangle' },
    unit: { backgroundColor: '#eb4897', shape: 'ellipse' }
};

const mapEdgeWeightToWidth = (weight: number) => Math.max(1, weight / 5);

const Dashboard = React.memo( function Dashboard() {
    const { loading, error, data } = useQuery<QueryResponse>(GET_DEPENDENCY_GRAPH, {
        variables: { projectId: 287, versionId: "2e718ebd3f968a675dfbc36bb4a126e13186eddf" },
    });

    const [layout, setLayout] = useState<string>('cose');
    const [filter, setFilter] = useState<string>('all');

    const getElements = (data: QueryResponse | undefined) => {
        if (!data) return [];

        const { allUnits, allContainers, membershipEdges, dependencyEdges, hierarchyEdges } = data.projectById.dependencyGraph;

        const unitsAndContainers = [...allUnits, ...allContainers].filter((node) => filter === 'all' || node.label === filter);
        const nodes = unitsAndContainers.map((node) => ({
            data: {
                id: `node-${node.id}`,
                label: node.label,
                name: node.simpleName,
            },
            classes: node.label
        }));

        const edges = [...membershipEdges, ...dependencyEdges, ...hierarchyEdges].flatMap((edge) => {
            const result = [];

            // Handle MembershipEdge
            if ('member' in edge) {
                result.push({
                    data: {
                        id: `edge-${edge.id}`,
                        source: `node-${edge.member.id}`,
                        target: `node-${edge.parent.id}`,
                        label: edge.label,
                        width: 1,
                    }
                });
            }

            // Handle DependencyEdge
            if ('dependant' in edge) {
                result.push({
                    data: {
                        id: `edge-${edge.id}`,
                        source: `node-${edge.dependant.id}`,
                        target: `node-${edge.dependedUpon.id}`,
                        label: edge.label,
                        width: edge.weight ? mapEdgeWeightToWidth(edge.weight) : 1,
                    }
                });
            }

            // Handle HierarchyEdge (if applicable)
            if ('children' in edge && edge.children && edge.children.length > 0) {
                edge.children.forEach(child => {
                    result.push({
                        data: {
                            id: `edge-${edge.id}-to-${child.id}`,
                            source: `node-${edge.parent.id}`,
                            target: `node-${child.id}`,
                            label: edge.label,
                            width: 1,
                        }
                    });
                });
            }

            return result;
        });

        return [...nodes, ...edges];
    };


    const elements = getElements(data);

    const cyStyles: Stylesheet[] = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(backgroundColor)',
                'label': 'data(name)',
                'color': '#ffffff', // White text for visibility
                'text-valign': 'center',
                'text-halign': 'center',
                'shape': 'data(shape)',
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 'data(width)',
                'line-color': '#64e0ff', // White or light gray edges for visibility
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#64e0ff', // Ensure the arrow is visible
            }
        },

        ...Object.entries(nodeStyles).map(([label, style]) => ({
            selector: `.${label}`,
            style
        }))
    ] as Stylesheet[];


    return (
        <div style={{ width: '100vw', height: '100vh' }}>
            <div style={{ padding: '10px', border:"2px solid #eb4897", margin: "10px"}}>
                <label htmlFor="layout">Graph Layout: </label>
                <select id="layout" value={layout} onChange={(e) => setLayout(e.target.value)}>
                    <option value="cose">COSE</option>
                    <option value="grid">Grid</option>
                    <option value="circle">Circle</option>
                    <option value="breadthfirst">Breadthfirst</option>
                </select>

                <label htmlFor="filter" style={{ marginLeft: '20px' }}>Filter: </label>
                <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="unit">Unit</option>
                    <option value="container">Container</option>
                </select>
            </div>


            {loading ? <p>Loading...</p> : error ? <p>Error loading data.</p> : (
                <CytoscapeComponent
                    elements={elements}
                    stylesheet={cyStyles}
                    style={{ width: '100%', height: '100%', display: 'flex' }}
                    layout={getLayoutOptions(layout)}
                />
            )}
        </div>
    );
});

const getLayoutOptions = (layoutName: string) => {
    switch(layoutName) {
        case 'cose':
            return {
                name: 'cose',
                fit: true,
                padding: 100,
                // Increase node repulsion to spread nodes further apart
                nodeRepulsion:  10000000,
                // Adjust idealEdgeLength for better spacing
                idealEdgeLength: 500,
                // Ensure nodeOverlap is low to reduce overlap
                nodeOverlap: 3,
                animate: 'end',
                animationDuration: 1500,
                animationEasing: "ease-in-out",
                // Adjust componentSpacing for better separation
                componentSpacing: 500,
                // EdgeElasticity can be adjusted if needed
                edgeElasticity:  200,
                randomize: false,
            };
        case 'grid':
            return {
                name: 'grid',
                fit: true,
                padding: 100,
                avoidOverlap: true, // This should be enabled by default
                avoidOverlapPadding: 500, // Increase padding to avoid overlap
                // Increasing the row and column distance can also help
                rowColDist: 100,
                // Conditional logic to set distance between nodes if your data supports it
                condDistance:  100,
                position: (node:any) => ({ row: node.data('row'), col: node.data('col') }),
            };
        case 'circle':
            return {
                name: 'circle',
                fit: true,
                padding: 10,
                avoidOverlap: true,
                radius: undefined,
                startAngle: 3 / 2 * Math.PI,
                sweep: undefined,
                clockwise: true,
                sort: undefined,
                animate: true,
                animationDuration: 3000,
                animationEasing: "ease-in-out"
            };
        case 'breadthfirst':
            return {
                name: 'breadthfirst',
                fit: true,
                directed: true,
                padding: 30,
                circle: false,
                grid: false,
                spacingFactor: 0.8,
                avoidOverlap: true,
                nodeDimensionsIncludeLabels: true,
                animate: true,
                animationDuration: 1500,
                maximal: true,
            };

        default:
            return { name: layoutName };
    }
};


export default Dashboard;

