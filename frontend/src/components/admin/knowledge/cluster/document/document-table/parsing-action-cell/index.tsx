import { IconButton, Menu, MenuItem, Tooltip } from "@mui/material";
import { Box } from "@mui/system";
import { IDocumentInfo } from "interfaces/database/document";
import React from "react";
import { useRemoveNextDocument } from "hooks/document-hook";
import { isParserRunning } from "utils/document-util";

interface IProps {
  record: IDocumentInfo;
  setCurrentRecord: (record: IDocumentInfo) => void;
  showChangeParserModal: () => void;
}

const ParsingActionCell = ({
  record,
  setCurrentRecord,
  showChangeParserModal,
}: IProps) => {
  const documentId = record.id;
  const isRunning = isParserRunning(record.run);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const setRecord = () => {
    setCurrentRecord(record);
  };

  const onRmDocument = () => {
    if (!isRunning) {
      removeDocument([documentId]);
    }
  };

  const { removeDocument } = useRemoveNextDocument();

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const onShowChangeParserModal = () => {
    setRecord();
    showChangeParserModal();
  };

  return (
    <Box>
      <Tooltip title={"chunk method"}>
        <IconButton onClick={handleMenuOpen} disabled={isRunning} size="small">
          <i className="fa-regular fa-wrench fa-rotate-270"></i>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            maxHeight: 200,
          },
        }}
      >
        <MenuItem onClick={onShowChangeParserModal}>Chunk Method</MenuItem>
      </Menu>
      <Tooltip title={"rename"}>
        <IconButton
          // onClick={onShowRenameModal}
          disabled={isRunning}
          size="small"
        >
          <i className="fa-regular fa-pen"></i>
        </IconButton>
      </Tooltip>

      {/* Delete Action */}
      <Tooltip title={"delete"}>
        <IconButton onClick={onRmDocument} disabled={isRunning} size="small">
          <i className="fa-regular fa-trash"></i>
        </IconButton>
      </Tooltip>

      {/* Download Action */}
      <Tooltip title={"download"}>
        <IconButton
          // onClick={onDownloadDocument}
          disabled={isRunning}
          size="small"
        >
          <i className="fa-regular fa-file-arrow-down"></i>
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ParsingActionCell;
