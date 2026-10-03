import { useCallback, useEffect, useRef, useState } from "react";
import { CanvasEdge, CanvasNode, Connection } from "../canvas/types";
import { Kind, KindCode, NODE_SPECS } from "../audio/nodeSpec";
import { audioEngine } from "../audio/audioEngine";

const parsePort = (handle?: string | null): number | null => {
    if (!handle) return null;
    const i = handle.indexOf("-");
    if (i < 0) return null;
    const n = parseInt(handle.slice(i + 1), 10);
    return Number.isNaN(n) ? null : n;
};

export const usePatch = () => {
    const [nodes, setNodes] = useState<CanvasNode[]>([]);
    const [edges, setEdges] = useState<CanvasEdge[]>([]);
    const idCounter = useRef(0);

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
                id: `e${conn.source}-${conn.sourceHandle}-${conn.target}-${conn.targetHandle}`,
                source: conn.source,
                sourceHandle: conn.sourceHandle,
                target: conn.target,
                targetHandle: conn.targetHandle,
            };
            setEdges((eds) => [...eds, edge]);
            const fromPort = parsePort(conn.sourceHandle);
            const toPort = parsePort(conn.targetHandle);
            if (fromPort != null && toPort != null) {
                audioEngine.connect(Number(conn.source), fromPort, Number(conn.target), toPort);
            }
        },
        []
    );

    const onEdgesDelete = useCallback((deleted: CanvasEdge[]) => {
        const ids = new Set(deleted.map((e) => e.id));
        setEdges((eds) => eds.filter((e) => !ids.has(e.id)));
        for (const e of deleted) {
            const fromPort = parsePort(e.sourceHandle);
            const toPort = parsePort(e.targetHandle);
            if (fromPort != null && toPort != null) {
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

    const loadDefaultPatch = () => {
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

        const edge = (from: number, fromPort: number, to: number, toPort: number): CanvasEdge => ({
            id: `e${from}-out-${fromPort}-${to}-in-${toPort}`,
            source: String(from),
            sourceHandle: `out-${fromPort}`,
            target: String(to),
            targetHandle: `in-${toPort}`,
        });

        const builtEdges: CanvasEdge[] = [
            edge(midi, 1, osc, 0),
            edge(midi, 0, adsr, 0),
            edge(osc, 0, vca, 0),
            edge(adsr, 0, vca, 1),
            edge(vca, 0, out, 0),
        ];
        for (const e of builtEdges) {
            audioEngine.connect(Number(e.source), parsePort(e.sourceHandle)!, Number(e.target), parsePort(e.targetHandle)!);
        }

        setNodes(built);
        setEdges(builtEdges);
    };

    useEffect(() => {
        console.log("Patch:", edges, nodes);
    }, [edges, nodes])

    return {
        loadDefaultPatch,
        nodes,
        edges,
        addNode,
        onConnect,
        onEdgesDelete,
        onNodesDelete,
        onNodePositionChange
    }
}