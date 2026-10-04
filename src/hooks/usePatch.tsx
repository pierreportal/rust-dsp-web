import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasEdge, CanvasNode, Connection, edgeId, portHandle, portIndex } from "../canvas/types";
import { Kind, KindCode, NODE_SPECS } from "../audio/nodeSpec";
import { audioEngine } from "../audio/audioEngine";
import type { PatchData, PatchEdge } from "../patch/patchCodec";

const edgeFromPorts = (edge: PatchEdge): CanvasEdge => ({
    id: edgeId(edge.source, edge.sourcePort, edge.target, edge.targetPort),
    source: String(edge.source),
    sourceHandle: portHandle("out", edge.sourcePort),
    target: String(edge.target),
    targetHandle: portHandle("in", edge.targetPort),
});

export const usePatch = () => {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [edges, setEdges] = useState<CanvasEdge[]>([]);
    const idCounter = useRef(0);

    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;

    const nextId = () => idCounter.current++;

    const handleParamChange = useCallback(
        (id: string, name: string, value: number) => {
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === id
                        ? { ...n, data: { ...n.data, params: { ...n.data.params, [name]: value } } }
                        : n
                )
            );
            audioEngine.setParam(Number(id), name, value);
        },
        []
    );

    const buildNode = useCallback(
        (kind: KindCode, x: number, y: number, id: number): CanvasNode => {
            const spec = NODE_SPECS[kind];
            const params: Record<string, number> = {};
            for (const p of spec.params) params[p.name] = p.default;
            audioEngine.addNode(id, kind);
            for (const p of spec.params) audioEngine.setParam(id, p.name, p.default);
            return {
                id: String(id),
                position: { x, y },
                data: { kind, params, onParamChange: handleParamChange },
            };
        },
        [handleParamChange]
    );

    const addNode = useCallback(
        (kind: KindCode) => {
            const id = nextId();
            const node = buildNode(kind, 40 + (id % 5) * 60, 40 + (id % 5) * 60, id);
            setNodes((nds) => [...nds, node]);
        },
        [buildNode]
    );

    const onConnect = useCallback(
        (conn: Connection) => {
            const edge: CanvasEdge = {
                id: edgeId(
                    Number(conn.source),
                    Math.max(0, portIndex(conn.sourceHandle)),
                    Number(conn.target),
                    Math.max(0, portIndex(conn.targetHandle))
                ),
                source: conn.source,
                sourceHandle: conn.sourceHandle,
                target: conn.target,
                targetHandle: conn.targetHandle,
            };
            setEdges((eds) => [...eds, edge]);
            const fromPort = portIndex(conn.sourceHandle);
            const toPort = portIndex(conn.targetHandle);
            if (fromPort >= 0 && toPort >= 0) {
                audioEngine.connect(Number(conn.source), fromPort, Number(conn.target), toPort);
            }
        },
        []
    );

    const onEdgesDelete = useCallback((deleted: CanvasEdge[]) => {
        const ids = new Set(deleted.map((e) => e.id));
        setEdges((eds) => eds.filter((e) => !ids.has(e.id)));
        for (const e of deleted) {
            const fromPort = portIndex(e.sourceHandle);
            const toPort = portIndex(e.targetHandle);
            if (fromPort >= 0 && toPort >= 0) {
                audioEngine.disconnect(Number(e.source), fromPort, Number(e.target), toPort);
            }
        }
    }, []);

    const onNodesDelete = useCallback((deletedIds: string[]) => {
        const ids = new Set(deletedIds);
        setNodes((nds) => nds.filter((n) => !ids.has(n.id)));
        for (const id of deletedIds) audioEngine.removeNode(Number(id));
    }, []);

    const onNodePositionChange = useCallback((id: string, x: number, y: number) => {
        setNodes((nds) =>
            nds.map((n) => (n.id === id ? { ...n, position: { x, y } } : n))
        );
    }, []);

    const clearPatch = useCallback(() => {
        for (const node of nodesRef.current) audioEngine.removeNode(Number(node.id));
        setNodes([]);
        setEdges([]);
    }, []);

    /**
     * Replaces the whole graph with `patch`, in the audio engine as well as in
     * React state. The patch is expected to be already sanitized by
     * `decodePatch`, so every cable here is guaranteed to be accepted by the
     * engine and every node is guaranteed to exist.
     */
    const loadPatch = useCallback(
        (patch: PatchData) => {
            clearPatch();

            const built: CanvasNode[] = patch.nodes.map((n) => {
                audioEngine.addNode(n.id, n.kind);
                for (const [name, value] of Object.entries(n.params)) {
                    audioEngine.setParam(n.id, name, value);
                }
                return {
                    id: String(n.id),
                    position: { x: n.x, y: n.y },
                    data: { kind: n.kind, params: { ...n.params }, onParamChange: handleParamChange },
                };
            });

            const builtEdges: CanvasEdge[] = patch.edges.map(edgeFromPorts);
            for (const e of builtEdges) {
                audioEngine.connect(
                    Number(e.source),
                    portIndex(e.sourceHandle),
                    Number(e.target),
                    portIndex(e.targetHandle)
                );
            }

            idCounter.current = patch.nodes.reduce((max, n) => Math.max(max, n.id), -1) + 1;

            setNodes(built);
            setEdges(builtEdges);
        },
        [clearPatch, handleParamChange]
    );

    const loadDefaultPatch = () => {
        clearPatch();
        const midi = nextId();
        const osc = nextId();
        const adsr = nextId();
        const vca = nextId();
        const out = nextId();

        const built: CanvasNode[] = [
            buildNode(Kind.Midi, 0, 120, midi),
            buildNode(Kind.Osc, 260, 40, osc),
            buildNode(Kind.Adsr, 260, 440, adsr),
            buildNode(Kind.Vca, 520, 140, vca),
            buildNode(Kind.Out, 780, 140, out),
        ];

        const edge = (from: number, fromPort: number, to: number, toPort: number): CanvasEdge =>
            edgeFromPorts({ source: from, sourcePort: fromPort, target: to, targetPort: toPort });

        const builtEdges: CanvasEdge[] = [
            edge(midi, 1, osc, 0),
            edge(midi, 0, adsr, 0),
            edge(osc, 0, vca, 0),
            edge(adsr, 0, vca, 1),
            edge(vca, 0, out, 0),
        ];
        for (const e of builtEdges) {
            audioEngine.connect(
                Number(e.source),
                portIndex(e.sourceHandle),
                Number(e.target),
                portIndex(e.targetHandle)
            );
        }

        setNodes(built);
        setEdges(builtEdges);
    };

    useEffect(() => {
        console.log("Patch:", edges, nodes);
    }, [edges, nodes])

    return {
        loadDefaultPatch,
        loadPatch,
        nodes,
        edges,
        addNode,
        onConnect,
        onEdgesDelete,
        onNodesDelete,
        onNodePositionChange
    }
}