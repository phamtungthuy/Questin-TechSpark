import {
    DataGrid as MuiDataGrid,
    DataGridProps as MuiDataGridProps,
    GridColDef,
    GridRowClassNameParams,
    GridRowSelectionModel,
} from "@mui/x-data-grid";
import React from "react";

interface DataGridProps extends Omit<MuiDataGridProps, "rows" | "columns"> {
    rows: any[];
    columns: GridColDef[];
    stripedRows?: boolean;
    defaultPageSize?: number;
    pageSizeOptions?: number[];
    compact?: boolean;
    disableColumnResize?: boolean;
    showCheckbox?: boolean; // Thêm prop mới
    checkboxPosition?: "left" | "right"; // Thêm prop mới
    onRowSelection?: (ids: GridRowSelectionModel) => void; // Xử lý selection
    rowHeight?: string;
}

const DataGrid = ({
    rows,
    columns,
    stripedRows = true,
    defaultPageSize = 20,
    pageSizeOptions = [10, 20, 50],
    compact = true,
    disableColumnResize = true,
    showCheckbox = true, // Mặc định hiển thị checkbox
    checkboxPosition = "left", // Mặc định bên trái
    onRowSelection,
    rowHeight,
    ...props
}: DataGridProps) => {
    const processedColumns = React.useMemo(() => {
        if (!showCheckbox) return columns;

        const checkboxColumn = {
            field: "__checkbox__",
            headerName: "",
            width: 50,
            sortable: false,
            filterable: false,
            disableColumnMenu: true,
        };

        return checkboxPosition === "left"
            ? [checkboxColumn, ...columns]
            : [...columns, checkboxColumn];
    }, [columns, showCheckbox, checkboxPosition]);

    // Xử lý logic selection
    const handleRowSelection = (ids: GridRowSelectionModel) => {
        onRowSelection?.(ids);
    };

    // Xử lý style hàng chẵn lẻ
    const getRowClassName = (params: GridRowClassNameParams) => {
        const defaultClass =
            stripedRows && params.indexRelativeToCurrentPage % 2 === 0
                ? "even"
                : "odd";
        return props.getRowClassName
            ? `${defaultClass} ${props.getRowClassName(params)}`
            : defaultClass;
    };

    // Merge props mặc định với props truyền vào
    const mergedSlotProps = {
        filterPanel: {
            filterFormProps: {
                logicOperatorInputProps: {
                    variant: "outlined",
                    size: "small",
                },
                columnInputProps: {
                    variant: "outlined",
                    size: "small",
                    sx: { mt: "auto" },
                },
                operatorInputProps: {
                    variant: "outlined",
                    size: "small",
                    sx: { mt: "auto" },
                },
                valueInputProps: {
                    InputComponentProps: {
                        variant: "outlined",
                        size: "small",
                    },
                },
            },
        },
        ...props.slotProps,
    };

    return (
        <MuiDataGrid
            {...props}
            rows={rows}
            columns={processedColumns}
            checkboxSelection={showCheckbox}
            onRowSelectionModelChange={handleRowSelection}
            getRowClassName={getRowClassName}
            initialState={{
                pagination: { paginationModel: { pageSize: defaultPageSize } },
                ...props.initialState,
            }}
            pageSizeOptions={pageSizeOptions}
            density={compact ? "compact" : "standard"}
            disableColumnResize={disableColumnResize}
            slotProps={mergedSlotProps}
            getRowHeight={() => {
                return rowHeight ? rowHeight : undefined;
            }}
        
        />
    );
};

export { DataGrid };
