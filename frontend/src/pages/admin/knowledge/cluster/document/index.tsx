import {
  Box,
  Breadcrumbs,
  Button,
  Divider,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { styled } from "@mui/system";
import AddDocumentModal from "components/admin/knowledge/cluster/document/add-document-modal";
import { useNavigate, useSearchParams } from "react-router-dom";
import KnowledgeLayout from "../../layout";
import DocumentTable from "components/admin/knowledge/cluster/document/document-table";

const BulkButton = styled(Button)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
}));

const KnowledgeBaseDocument = () => {
  const navigate = useNavigate();
  const [openAddFileModal, setOpenAddFileModal] = useState(false);
  const [searchParams] = useSearchParams();
  const knowledgeBaseId = searchParams.get("id");

  return (
    <KnowledgeLayout>
      <React.Fragment>
        <AddDocumentModal
          open={openAddFileModal}
          onClose={() => setOpenAddFileModal(false)}
        />
        <Breadcrumbs aria-label="breadcrumb">
          <Typography
            color="inherit"
            onClick={() => navigate("/admin/knowledge")}
            fontSize="16px"
            sx={{
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Knowledge Base
          </Typography>
          <Typography
            color="inherit"
            onClick={() =>
              navigate(`/admin/knowledge/cluster?id=${knowledgeBaseId}`)
            }
            fontSize="16px"
            sx={{
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            Cluster
          </Typography>
          <Typography color="text.primary" fontSize="16px">
            Document
          </Typography>
        </Breadcrumbs>
        <Box
          marginTop="16px"
          sx={{
            backgroundColor: "#fff",
            boxSizing: "border-box",
          }}
          flex="1"
        >
          <Box padding="30px 30px">
            <Typography
              variant="h3"
              fontWeight="bold"
              fontSize="16px"
              margin="16px 0"
            >
              Document
            </Typography>
            <Typography fontSize="16px" margin="14px 0">
              😉 Questions and answers can only be answered after the parsing is
              successful.
            </Typography>
            <Divider sx={{ marginY: "24px" }} />
            <Box
              display="flex"
              justifyContent="space-between"
              marginBottom="20px"
            >
              <BulkButton variant="contained" disabled>
                <Box display="flex" gap={1}>
                  <Typography variant="button" fontWeight="bold" color="white">
                    Bulk
                  </Typography>

                  <i
                    className="fa-regular fa-sort-down"
                    style={{ fontSize: "18px", color: "white" }}
                  ></i>
                </Box>
              </BulkButton>
              <Box display="flex" alignItems="center" gap="10px">
                <TextField
                  fullWidth
                  inputProps={{
                    style: {
                      padding: 4,
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment
                        sx={{
                          padding: 0,
                        }}
                        position="start"
                      >
                        <i className="fa-regular fa-magnifying-glass"></i>
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton
                  sx={{
                    width: "auto",
                    borderRadius: "6px",
                    backgroundColor: "#1677ff",
                    color: "white",
                    paddingX: "15px",
                    paddingY: "5px",
                    "&:hover": {
                      opacity: 0.7,
                      backgroundColor: "#1677ff",
                      color: "white",
                    },
                  }}
                  onClick={() => {
                    setOpenAddFileModal(true);
                  }}
                >
                  <i
                    className="fa-regular fa-plus"
                    style={{ fontSize: "16px" }}
                  ></i>
                  <Typography sx={{ marginLeft: "10px" }} fontSize="16px">
                    Add file
                  </Typography>
                </IconButton>
              </Box>
            </Box>
            <DocumentTable />
            {/* <ScrollableTableContainer>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell padding="checkbox">
                                            <Checkbox />
                                        </TableCell>
                                        <TableCell>Name</TableCell>
                                        <TableCell>Chunk Number</TableCell>
                                        <TableCell>Upload Date</TableCell>
                                        <TableCell> thod</TableCell>
                                        <TableCell>Enable</TableCell>
                                        <TableCell>Parsing Status</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {documents &&
                                        documents.map(
                                            (document: any, idx: number) => (
                                                <CustomTableRow
                                                    key={idx}
                                                    idx={idx}
                                                    documentId={
                                                        document["custom_id"]
                                                    }
                                                    name={document["name"]}
                                                    chunk_number={
                                                        document["chunk_number"]
                                                    }
                                                    upload_date={
                                                        document["upload_date"]
                                                    }
                                                    parsing_status={
                                                        document[
                                                            "parsing_status"
                                                        ]
                                                    }
                                                    reGetDatasetDocuments={
                                                        reGetDatasetDocuments
                                                    }
                                                />
                                            )
                                        )}
                                </TableBody>
                            </Table>
                        </ScrollableTableContainer> */}
          </Box>
        </Box>
      </React.Fragment>
    </KnowledgeLayout>
  );
};

export default KnowledgeBaseDocument;
