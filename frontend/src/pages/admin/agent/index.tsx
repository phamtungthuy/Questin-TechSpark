import { Box, IconButton, Typography } from "@mui/material";
import AdminTopBar from "components/admin/admin-topbar";
import AgentTemplateModal from "components/admin/agent/list/agent-template-modal";
import { useSaveAgentFlow } from "hooks/agent-hook";

const AdminAgentPage = () => {
  const { visible, hideModal, showModal } = useSaveAgentFlow();

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box>
        <AdminTopBar />
      </Box>
      <Box padding="20px 60px">
        <Box padding="0 0 72px" display="flex" justifyContent="space-between">
          <Box></Box>
          <Box display="flex" gap="30px" alignItems="center">
            <IconButton
              sx={{
                width: "auto",
                borderRadius: "8px",
                backgroundColor: "#1677ff",
                color: "white",
                paddingX: "20px",
                "&:hover": {
                  opacity: 0.7,
                  backgroundColor: "#1677ff",
                  color: "white",
                },
              }}
              onClick={showModal}
            >
              <Typography>Create New Agent Flow</Typography>
            </IconButton>
          </Box>
        </Box>
      </Box>
      <AgentTemplateModal
        hideModal={hideModal}
        visible={visible}
        loading={false}
        onOk={() => {}}
      />
    </Box>
  );
};

export default AdminAgentPage;
