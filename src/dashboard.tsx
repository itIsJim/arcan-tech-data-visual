'use client'
import CytoscapeComponent from "react-cytoscapejs";
import {useQuery} from "@apollo/client";
import {GET_DEPENDENCY_GRAPH} from "./api/queries.ts";
import React, {useCallback, useEffect, useMemo, useState} from "react";
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
        variables: { projectId: 287, versionId: '2e718ebd3f968a675dfbc36bb4a126e13186eddf' },
    });

    const [layout, setLayout] = useState<string>('cose');
    const [filter, setFilter] = useState<string>('all');
    const [refreshKey, setRefreshKey] = useState<number>(0);

    const refreshLayout = useCallback(() => {
        setRefreshKey(oldKey => oldKey + 1);
    }, []);

    useEffect(() => {
        refreshLayout();
    }, [filter, layout, refreshLayout]);
    const elements = useMemo(() => {
        if (!data) return [];

        const { allUnits, allContainers, membershipEdges, dependencyEdges, hierarchyEdges } = data.projectById.dependencyGraph;

        const filteredNodes = [...allUnits, ...allContainers].filter((node) => filter === 'all' || node.label === filter);
        const nodeIds = new Set(filteredNodes.map(node => node.id));

        const nodes = filteredNodes.map((node) => ({
            data: {
                id: `node-${node.id}`,
                label: node.label,
                name: node.simpleName,
            },
            classes: node.label
        }));

        const edges = [...membershipEdges, ...dependencyEdges, ...hierarchyEdges].flatMap((edge) => {
            if ('member' in edge && nodeIds.has(edge.member.id) && nodeIds.has(edge.parent.id)) {
                return [{
                    data: {
                        id: `edge-${edge.id}`,
                        source: `node-${edge.member.id}`,
                        target: `node-${edge.parent.id}`,
                        label: edge.label,
                        width: 1,
                    }
                }];
            }

            if ('dependant' in edge && nodeIds.has(edge.dependant.id) && nodeIds.has(edge.dependedUpon.id)) {
                return [{
                    data: {
                        id: `edge-${edge.id}`,
                        source: `node-${edge.dependant.id}`,
                        target: `node-${edge.dependedUpon.id}`,
                        label: edge.label,
                        width: edge.weight ? mapEdgeWeightToWidth(edge.weight) : 1,
                    }
                }];
            }

            if ('children' in edge && edge.children && edge.children.length > 0 && nodeIds.has(edge.parent.id)) {
                return edge.children.filter(child => nodeIds.has(child.id)).map(child => ({
                    data: {
                        id: `edge-${edge.id}-to-${child.id}`,
                        source: `node-${edge.parent.id}`,
                        target: `node-${child.id}`,
                        label: edge.label,
                        width: 1,
                    }
                }));
            }

            return [];
        });

        return [...nodes, ...edges];
    }, [data, filter]);

    const cyStyles: Stylesheet[] = [
        {
            selector: 'node',
            style: {
                'background-color': 'data(backgroundColor)',
                'label': 'data(name)',
                'color': '#ffffff',
                'text-valign': 'center',
                'text-halign': 'center',
                'shape': 'data(shape)',
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 'data(width)',
                'line-color': '#64e0ff',
                'curve-style': 'bezier',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#64e0ff',
            }
        },

        ...Object.entries(nodeStyles).map(([label, style]) => ({
            selector: `.${label}`,
            style
        }))
    ] as Stylesheet[];

    const layoutOptions = useMemo(() => getLayoutOptions(layout), [layout, elements, filter, data]);


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
                    key={refreshKey}
                    elements={elements}
                    stylesheet={cyStyles}
                    style={{ width: '100%', height: '100%', display: 'flex' }}
                    layout={layoutOptions}
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
                nodeRepulsion:  10000000,
                idealEdgeLength: 500,
                nodeOverlap: 3,
                animate: true,
                animationDuration: 500,
                animationEasing: "ease-in-out",
                componentSpacing: 500,
                edgeElasticity:  200,
                randomize: false,
            };
        case 'grid':
            return {
                name: 'grid',
                fit: true,
                padding: 100,
                avoidOverlap: true,
                avoidOverlapPadding: 500,
                animate: true,
                animationDuration: 1500,
                edgeElasticity:  200,
                animationEasing: "ease-in-out",
                condDistance:  100,
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
                animationDuration: 2000,
                edgeElasticity:  200,
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
                edgeElasticity:  200,
                maximal: true,
            };

        default:
            return { name: layoutName };
    }
};


export default Dashboard;

