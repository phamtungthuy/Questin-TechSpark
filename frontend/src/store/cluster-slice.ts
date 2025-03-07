import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ICluster } from "interfaces/database/knowledge";

interface IClusterState {
    clusterListRecord: Record<string, ICluster[]>;
}

const initialState: IClusterState = {
    clusterListRecord: {},
};

const clusterSlice = createSlice({
    name: "cluster",
    initialState,
    reducers: {
        setClusterList: (
            state,
            action: PayloadAction<{
                kb_id: string;
                clusterList: ICluster[];
            }>
        ) => {
            const { kb_id, clusterList } = action.payload;
            state.clusterListRecord[kb_id] = clusterList;
        },
        setCluster: (
            state,
            action: PayloadAction<{
                kb_id: string;
                cluster: ICluster;
            }>
        ) => {
            const { kb_id, cluster } = action.payload;

            const index = state.clusterListRecord[kb_id].findIndex(
                (cl) => cl.id === cluster.id
            );
            if (index !== -1) {
                state.clusterListRecord[kb_id][index] = cluster;
            } else {
                state.clusterListRecord[kb_id].unshift(cluster);
            }
        },
        removeCluster: (
            state,
            action: PayloadAction<{
                kb_id: string;
                cluster_ids: string[];
            }>
        ) => {
            const { kb_id, cluster_ids } = action.payload;

            state.clusterListRecord[kb_id] = state.clusterListRecord[
                kb_id
            ].filter((cl) => !cluster_ids.includes(cl.id));
        },
        
    },
});

export const {
    setClusterList,
    setCluster,
    removeCluster
} = clusterSlice.actions;

export default clusterSlice.reducer;