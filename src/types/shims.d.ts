// Ambient declarations for dependencies that ship without their own types.

// Side-effect CSS imports (bundled by the build, no runtime binding).
declare module '*.css';

declare module 'cytoscape/dist/cytoscape.esm.min' {
    import cytoscape from 'cytoscape';
    export default cytoscape;
}

// Untyped cytoscape extensions (registered via cytoscape.use(...)).
declare module 'cytoscape-edgehandles/cytoscape-edgehandles' {
    const ext: any;
    export default ext;
}

declare module 'cytoscape-compound-drag-and-drop/cytoscape-compound-drag-and-drop' {
    const ext: any;
    export default ext;
}

declare module 'cytoscape-node-html-label/dist/cytoscape-node-html-label.min' {
    const ext: any;
    export default ext;
}
