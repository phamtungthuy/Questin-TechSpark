import {
  Box,
  Button,
  InputBase,
  IconButton,
  Divider,
  Popover,
  MenuItem,
  Typography,
} from "@mui/material";
import AdminTopBar from "components/admin/admin-topbar";
import { useSetModalState } from "hooks/common-hook";
import { CubeTransparentIcon } from "@heroicons/react/24/outline";
import { useFetchNextDialogList } from "hooks/dialog-hook";
import { useEffect, useState } from "react";
import { IDialog } from "interfaces/database/dialog";
import { useEditDialog, useRemoveDialog } from "./hooks";
import ChatConfigurationModal from "../../../components/admin/chat/chat-configuration-modal/index";
import RemoveDialogModal from "components/admin/chat/remove-dialog-modal";

const AdminChatPage = () => {
  const { data: dialogList, loading: dialogLoading } = useFetchNextDialogList();
  const {
    dialogSettingLoading,
    initialDialog,
    onDialogEditOk,
    dialogEditVisible,
    clearDialog,
    hideDialogEditModal,
    showDialogEditModal,
  } = useEditDialog();

  const { removeDialog } = useRemoveDialog();

  const {
    visible: dialogRemoveVisible,
    hideModal: hideDialogRemoveModal,
    showModal: showDialogRemoveModal,
  } = useSetModalState();

  const [selectedDialog, setSelectedDialog] = useState<IDialog | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hoveredDialog, setHoveredDialog] = useState<null | string>(null);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLElement>,
    dialogId: string
  ) => {
    event.stopPropagation(); // Ngăn sự kiện bubble lên
    setAnchorEl(event.currentTarget);
    setHoveredDialog(dialogId);
    setIsPopoverOpen(true);
  };

  const handlePopoverClose = () => {
    setIsPopoverOpen(false);
    setAnchorEl(null);
    setHoveredDialog(null);
  };

  const handleDialogHover = (dialogId: string) => {
    setHoveredDialog(dialogId);
  };

  const handleDialogLeave = (event: React.MouseEvent<HTMLElement>) => {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (!relatedTarget?.closest(".MuiPopover-root")) {
      handlePopoverClose();
    }
  };

  const handleDialogRemove = () => {
    if (hoveredDialog) {
      removeDialog([hoveredDialog]);
    }
  };

  useEffect(() => {
    if (dialogList && dialogList.length > 0) {
      setSelectedDialog(dialogList[0]);
    }
  }, [dialogList]);

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box>
        <AdminTopBar />
      </Box>
      <ChatConfigurationModal
        visible={dialogEditVisible}
        initialDialog={initialDialog}
        showModal={showDialogEditModal}
        hideModal={hideDialogEditModal}
        loading={dialogSettingLoading}
        onOk={onDialogEditOk}
        clearDialog={clearDialog}
      />
      <Box display="flex" flex={1} overflow="hidden">
        <Box
          width="400px"
          bgcolor="white"
          display="flex"
          flexDirection="column"
          alignItems="center"
          borderRight="1px solid #ccc"
          p={2}
        >
          <Button
            onClick={() => {
              showDialogEditModal();
            }}
            variant="contained"
            color="primary"
            sx={{
              textTransform: "none",
              borderRadius: "8px",
              padding: "4px 60px",
              backgroundColor: "black",
              color: "white",
              transition: "all 0.3s ease-in-outs",
              "&:hover": {
                opacity: 0.7,
                backgroundColor: "black",
                color: "white",
              },
            }}
          >
            Create an Assistant
          </Button>
          <Divider sx={{ width: "100%", margin: "16px 0" }} />
          <Box width="100%" overflow="auto">
            {dialogList?.map((dialog) => (
              <Box
                key={dialog.id}
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                bgcolor={selectedDialog?.id === dialog.id ? "#e0e0e0" : "white"}
                borderRadius="8px"
                padding="8px 16px"
                mb="4px"
                sx={{
                  cursor: "pointer",
                  position: "relative",
                  "&:hover": {
                    bgcolor: "#e0e0e0",
                  },
                }}
                onMouseEnter={() => handleDialogHover(dialog.id)}
                onMouseLeave={handleDialogLeave}
                onClick={() => setSelectedDialog(dialog)}
              >
                <Box display="flex" alignItems="center">
                  <Box
                    minWidth="32px"
                    minHeight="32px"
                    bgcolor="rgb(174,174,174)"
                    borderRadius="4px"
                    mr={2}
                  />
                  <Box display="flex" flexDirection="column" maxWidth="250px">
                    <Box fontWeight="bold" fontSize="14px">
                      {dialog.name}
                    </Box>
                    <Box fontSize="14px">
                      {dialog.description
                        ? dialog.description
                        : "A helpful dialog"}
                    </Box>
                  </Box>
                </Box>
                {hoveredDialog === dialog.id && (
                  <IconButton
                    onClick={(e) => handlePopoverOpen(e, dialog.id)}
                    sx={{
                      position: "absolute",
                      right: "8px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <CubeTransparentIcon className="w-5 h-5" />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>
        <Popover
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && isPopoverOpen}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          sx={{
            pointerEvents: "auto",
            "& .MuiPopover-paper": {
              paddingY: "8px",
              borderRadius: "18px",
            },
          }}
        >
          <MenuItem
            onClick={() => {
              if (hoveredDialog) {
                showDialogEditModal(hoveredDialog);
              } else {
                showDialogEditModal();
              }
            }}
            sx={{
              padding: "6px 12px",
              marginX: "8px",
              borderRadius: "6px",
            }}
          >
            <i className="fa-regular fa-pen" style={{ fontSize: "16px" }}></i>
            <Typography fontSize="14px" marginLeft="8px">
              Chỉnh sửa
            </Typography>
          </MenuItem>

          <MenuItem
            onClick={() => {
              showDialogRemoveModal();
              setIsPopoverOpen(false);
            }}
            sx={{
              padding: "6px 12px",
              marginX: "8px",
              borderRadius: "6px",
              color: "#fb6b6d",
            }}
          >
            <i className="fa-regular fa-trash" style={{ fontSize: "16px" }}></i>{" "}
            <Typography fontSize="14px" marginLeft="8px">
              Xóa
            </Typography>
          </MenuItem>
        </Popover>

        <Box display="flex" flex={1} flexDirection="column" bgcolor="#fff">
          <Box flex={1} overflow="auto" p={2}>
            <Box>{selectedDialog?.name}</Box>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            borderTop="1px solid #ccc"
            p={1.5}
            bgcolor="white"
          >
            <Box
              flex={1}
              display="flex"
              alignItems="center"
              border="1px solid #ccc"
              bgcolor="white"
              borderRadius="8px"
              px={2}
              py={1}
              mr={1.5}
              sx={{
                "&:hover, &:focus-within": {
                  border: "1px solid black",
                },
              }}
            >
              <InputBase
                placeholder="Message the Assistant..."
                fullWidth
                sx={{
                  fontSize: "14px",
                }}
              />
              <IconButton size="small" sx={{ marginRight: "10px" }}>
                <i
                  className="fa-regular fa-paperclip-vertical"
                  style={{
                    fontSize: "18px",
                    color: "#5f6368",
                  }}
                ></i>
              </IconButton>
              <Button
                variant="contained"
                color="primary"
                sx={{
                  textTransform: "none",
                  borderRadius: "8px",
                  padding: "4px 20px",
                  backgroundColor: "black",
                  color: "white",
                  transition: "all 0.3s ease-in-outs",
                  "&:hover": {
                    opacity: 0.7,
                    backgroundColor: "black",
                    color: "white",
                  },
                }}
              >
                Send
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
      <RemoveDialogModal
        visible={dialogRemoveVisible}
        hideModal={hideDialogRemoveModal}
        onOk={handleDialogRemove}
      />
    </Box>
  );
};

export default AdminChatPage;
