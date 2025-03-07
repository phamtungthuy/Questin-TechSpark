import {
  Box,
  Breadcrumbs,
  Button,
  Slider,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import KnowledgeLayout from "../layout";
import { useEffect } from "react";
import useForm from "hooks/common-hook";
import {
  useSelectTestingResult,
  useTestChunkRetrieval,
} from "hooks/chunk-hook";

interface Chunk {
  cluster_id: string;
  content: string;
  doc_id: string;
  id: string;
  images: Array<any>;
  kb_id: string;
  keyword: Array<any>;
  score: number;
}

const KnowledgeRetrievalTesting = () => {
  const form = useForm({
    vector_similarity_weight: 0.7,
    question: "Xin chào",
    threshold: 0.1,
    keywords_similarity_weight: 0.3,
  });
  const { documents, chunks: chunks2, total } = useSelectTestingResult();

  const { testChunk } = useTestChunkRetrieval();

  const handleTesting2 = async (documentIds: string[] = []) => {
    const values = form.formValues;
    testChunk({
      ...values,
    });
  };

  console.log(chunks2);

  const [testingText, setTestingText] = useState<string>("");
  const [chunks, setChunks] = useState<any>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [trigger, setTrigger] = useState(false);
  const [numberOfChunks, setNumberOfChunks] = useState(3);

  useEffect(() => {
    setChunks([]);
  }, []);

  const handleTesting = async () => {
    setLoading(true);
    setTrigger(true);
    setLoading(false);
  };

  return (
    <KnowledgeLayout>
      <React.Fragment>
        <Breadcrumbs aria-label="breadcrumb" sx={{ paddingBottom: "8px" }}>
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
          <Typography color="text.primary" fontSize="16px">
            Retrieval testing
          </Typography>
        </Breadcrumbs>
        <Box
          sx={{
            backgroundColor: "#dedfe1",
            flex: "1 1",
            boxSizing: "border-box",
            margin: "0",
            padding: "0",
            borderRadius: "20px",
            height: "100vh",
            overflow: "hidden",
          }}
        >
          <Box display="flex" height="100%" gap="20px" bgcolor="#f4f6f8">
            <Box
              padding="20px"
              sx={{ backgroundColor: "#fff", position: "relative" }}
              flex={1}
              borderRadius="20px"
            >
              <Typography variant="h3" fontWeight="bold" fontSize="20px">
                Retrieval testing
              </Typography>
              <Typography fontSize="16px" margin="12px 0">
                Final step! After success, leave the rest to Infiniflow AI.
              </Typography>
              <Box
                display="flex"
                gap="10px"
                alignItems="center"
                paddingBottom="8px"
                marginTop="40px"
              >
                <Typography fontWeight="bold" fontSize="16px">
                  Similarity threshold
                </Typography>
                <Tooltip
                  title={
                    <Typography fontSize="14px">
                      We use hybrid similarity score to evaluate distance
                      between two lines of text. It's weighted keywords
                      similarity and vector cosine similarity. If the similarity
                      between query and chunk is less than this threshold, the
                      chunk will be filtered out.
                    </Typography>
                  }
                >
                  <i
                    className="fa-regular fa-circle-info"
                    style={{
                      fontSize: "18px",
                      color: "#ccc",
                      cursor: "help",
                      marginTop: "4px",
                    }}
                  ></i>
                </Tooltip>
              </Box>
              <Slider
                size="small"
                defaultValue={0.5}
                aria-label="Small"
                valueLabelDisplay="auto"
                min={0}
                max={1}
                step={0.01}
              />
              <Box
                display="flex"
                gap="10px"
                alignItems="center"
                paddingBottom="8px"
              >
                <Typography fontWeight="bold" fontSize="16px">
                  Keywords similarity weight
                </Typography>
                <Tooltip
                  title={
                    <Typography fontSize="14px">
                      We use hybrid similarity score to evaluate distance
                      between two lines of text. It's weighted keywords
                      similarity and vector cosine similarity or rerank
                      score(0~1). The sum of both weights is 1.0.
                    </Typography>
                  }
                >
                  <i
                    className="fa-regular fa-circle-info"
                    style={{
                      fontSize: "18px",
                      color: "#ccc",
                      cursor: "help",
                      marginTop: "4px",
                    }}
                  ></i>
                </Tooltip>
              </Box>
              <Slider
                size="small"
                defaultValue={0.5}
                aria-label="Small"
                valueLabelDisplay="auto"
                min={0}
                max={1}
                step={0.01}
              />
              <Box
                display="flex"
                gap="10px"
                alignItems="center"
                paddingBottom="8px"
              >
                <Typography fontWeight="bold" fontSize="16px">
                  Number of chunks
                </Typography>
                <Tooltip
                  title={
                    <Typography fontSize="14px">
                      Number of chunks to be retrieved.
                    </Typography>
                  }
                >
                  <i
                    className="fa-regular fa-circle-info"
                    style={{
                      fontSize: "18px",
                      color: "#ccc",
                      cursor: "help",
                      marginTop: "4px",
                    }}
                  ></i>
                </Tooltip>
              </Box>
              <Slider
                size="small"
                defaultValue={3}
                aria-label="Small"
                valueLabelDisplay="auto"
                min={1}
                max={10}
                step={1}
                value={numberOfChunks}
                onChange={(e, value) => setNumberOfChunks(value as number)}
              />
              <Box
                sx={{
                  position: "relative",
                  height: 100,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  fontWeight="bold"
                  fontSize="16px"
                  paddingBottom="8px"
                >
                  Testing Question
                </Typography>
                <TextField
                  id="testing_question"
                  variant="outlined"
                  value={testingText}
                  onChange={(e) => setTestingText(e.target.value)}
                  fullWidth
                  multiline
                  maxRows={6}
                  sx={{
                    fontSize: "14px",
                    borderRadius: "8px",
                    height: "100%",
                    "& .MuiInputBase-root": {
                      height: "100%",
                      alignItems: "flex-start",
                    },
                    "& textarea": {
                      overflow: "auto !important",
                    },
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: "20px",
                    right: "20px",
                  }}
                ></Box>
              </Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{
                  backgroundColor: "rgb(166,210,255)",
                  borderRadius: "8px",
                  textTransform: "none",
                  padding: "8px 16px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  transition: "all .3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#5691d1",
                  },
                }}
                disabled={testingText.trim() === "" || loading}
                onClick={() => {
                  // handleTesting();
                  handleTesting2();
                }}
              >
                {loading ? "Loading..." : "Testing"}
              </Button>
            </Box>
            <Box
              flex={3}
              padding="10px 20px"
              height="100%"
              sx={{
                backgroundColor: "#fff",
                borderRadius: "20px",
                overflowY: "auto",
                height: "100%",
              }}
              display="flex"
              flexDirection="column"
              overflow="auto"
            >
              {Array.isArray(chunks.chunks) ? (
                chunks.chunks.map((chunk: Chunk, idx: number) => (
                  <Box
                    key={idx}
                    border="1px solid rgb(200,200,200)"
                    borderRadius="8px"
                    margin="10px 0"
                  >
                    <Box padding="20px">
                      <Typography style={{ whiteSpace: "pre-line" }}>
                        {chunk.content}
                      </Typography>
                    </Box>
                  </Box>
                ))
              ) : (
                <Typography margin="10px 0 0">No chunk to display.</Typography>
              )}
            </Box>
          </Box>
        </Box>
      </React.Fragment>
    </KnowledgeLayout>
  );
};

export default KnowledgeRetrievalTesting;
