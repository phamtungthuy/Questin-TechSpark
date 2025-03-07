import { useFetchNextDocumentList } from "hooks/document-hook";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { Box, Switch, Typography } from "@mui/material";
import { formatDate } from "utils/date";
import { getExtension } from "utils/document-util";
import SvgIcon from "components/svg-icon";
import ParsingActionCell from "./parsing-action-cell";
import ParsingStatusCell from "./parsing-status-cell";
import ChunkMethodModal from "./chunk-method-modal";
import { useSetSelectedRecord } from "hooks/logic-hook";
import { IDocumentInfo } from "interfaces/database/document";
import { useChangeDocumentParser } from "./hook";

const DocumentTable = () => {
    const { documents } = useFetchNextDocumentList();
    const { currentRecord, setRecord } = useSetSelectedRecord<IDocumentInfo>();
    const {
        changeParserLoading,
        onChangeParserOk,
        changeParserVisible,
        hideChangeParserModal,
        showChangeParserModal,
      } = useChangeDocumentParser(currentRecord.id);
    const columns: GridColDef[] = [
        {
            field: "name",
            headerName: "Name",
            minWidth: 200,
            align: "center",
            flex: 1,
            renderCell: ({ row }) => {
                return (
                    <Box
                        sx={{
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            height: "100%",
                        }}
                    >
                        <Box display="flex" gap="10px">
                            {row.thumbnail ? (
                                <SvgIcon
                                    name={`file-icon/${getExtension(row.name)}`}
                                    width={24}
                                ></SvgIcon>
                            ) : (
                                <SvgIcon
                                    name={`file-icon/${getExtension(row.name)}`}
                                    width={24}
                                ></SvgIcon>
                            )}
                            <Typography>{row.name}</Typography>
                        </Box>
                    </Box>
                );
            },
        },
        {
            field: "chunk_num",
            headerName: "Chunk Number",
            flex: 1,
            minWidth: 120,
        },
        {
            field: "create_time",
            headerName: "UploadDate",
            minWidth: 100,
            flex: 1,
            renderCell: ({ value }) => formatDate(value),
        },
        {
            field: "parser_id",
            headerName: "Chunk Method",
            minWidth: 120,
            flex: 1,
        },
        {
            field: "status",
            headerName: "Enabled",
            minWidth: 100,
            flex: 1,
            renderCell: ({ row }) => (
                <Switch checked={row.status === "1"} onChange={(e) => {}} />
            ),
        },
        {
            field: "run",
            headerName: "Parsing Status",
            minWidth: 120,
            flex: 1,
            renderCell: ({ row }) => <ParsingStatusCell record={row} />,
        },
        {
            field: "action",
            headerName: "Action",
            minWidth: 200,
            flex: 1,
            renderCell: ({ row }) => (
                <ParsingActionCell record={row} setCurrentRecord={setRecord} 
                    showChangeParserModal={showChangeParserModal}
                />
            ),
        },
    ];

    return (
        <Box>
            <ChunkMethodModal 
                    documentId={currentRecord.id}
                    parserId={currentRecord.parser_id}
                    parserConfig={currentRecord.parser_config}
                    documentExtension={getExtension(currentRecord.name)}
                    onOk={onChangeParserOk}
                    visible={changeParserVisible}
                    hideModal={hideChangeParserModal}
                    loading={changeParserLoading}
            />
            <DataGrid rows={documents} columns={columns}></DataGrid>
        </Box>
    );
};

export default DocumentTable;
