import { useState, useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AdminTopBar from "components/admin/admin-topbar";
import { useFetchProviders } from "hooks/integration-hook";
import SelectionPane from "components/admin/integration/selection-pane"; 
import ConnectionPane from "components/admin/integration/connection-pane";

// Định nghĩa type cho Provider
interface Provider {
  id: string;
  name: string;
}

const AdminIntegrationPage = () => {
  const [open, setOpen] = useState(false);
  const [showConnectionPane, setShowConnectionPane] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const { data: providers = [], isLoading } = useFetchProviders();

  const handleContinue = () => {
    console.log("SelectionPane tiếp tục, mở ConnectionPane");
    setOpen(false);
    setShowConnectionPane(true);
  };

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <AdminTopBar />

      <Box flex={1} p={2} bgcolor="#f5f5f5" position="relative">
        <IconButton
          onClick={() => setOpen(true)}
          sx={{
            position: "absolute",
            top: 16,
            right: 16,
            color: "black",
            bgcolor: "white",
            boxShadow: 1,
            "&:hover": { bgcolor: "#e0e0e0" },
          }}
        >
          <AddIcon />
        </IconButton>
      </Box>

      {/* SelectionPane */}
      <SelectionPane
        open={open}
        onClose={() => setOpen(false)}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        providers={providers}
        isLoading={isLoading}
        onContinue={handleContinue}
      />

      {/* ConnectionPane */}
      <ConnectionPane
        open={showConnectionPane}
        onClose={() => {
          console.log("Đóng ConnectionPane");
          setShowConnectionPane(false);
        }}
        selectedProvider={selectedProvider}
        setSelectedProvider={setSelectedProvider}
        providers={providers}
        isLoading={isLoading}
      />
    </Box>
  );
};

export default AdminIntegrationPage;
