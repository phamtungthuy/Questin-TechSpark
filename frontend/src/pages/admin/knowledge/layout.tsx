import { Box } from "@mui/material";
import React, { ReactElement } from "react";
import AdminTopBar from "components/admin/admin-topbar";
import KnowledgeSidebar from "components/admin/knowledge/knowledge-sidebar";

interface KnowledgeLayoutProps {
  children: ReactElement;
}

const KnowledgeLayout: React.FC<KnowledgeLayoutProps> = ({ children }) => {
  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box>
        <AdminTopBar />
      </Box>
      <Box display="flex" flex="1" overflow="hidden">
        <Box>
          <KnowledgeSidebar />
        </Box>
        <Box
          padding="10px 20px 20px"
          sx={{
            backgroundColor: "#f4f6f8",
            overflowX: "auto",
            display: "flex",
            flexDirection: "column",
            flex: "1 1",
            boxSizing: "border-box",
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default KnowledgeLayout;
