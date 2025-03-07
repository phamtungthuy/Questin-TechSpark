import {
    Box,
    Breadcrumbs,
    Button,
    Divider,
    FormControl,
    Grid,
    List,
    ListItem,
    ListItemText,
    MenuItem,
    Select,
    Slider,
    Switch,
    Tooltip,
    Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router-dom";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import KnowledgeLayout from "../layout";
import { useEffect, useState } from "react";
import { useFetchNextKnowledgeList, useFetchCurrentKnowledge, useSetNextKnowledge} from "hooks/knowledge-hook";
import { useFetchNextLLMList } from "hooks/llm-hook";
import { toast } from "react-toastify";

interface ModelProps {
    id: string;
    llm_factory: string;
    name: string;
    type: string;
    base_url: string;
}


const KnowledgeBaseConfiguration = () => {
    const navigate = useNavigate();
    const { data: llmData } = useFetchNextLLMList();
    const { data: knowledgeData, loading: knowledgeLoading } = useFetchCurrentKnowledge();
    const { setKnowledge } = useSetNextKnowledge();

    const [embd_id, setembd_id] = useState<string>('');
    const [choices, setChoices] = useState<Array<ModelProps>>([]);
    const [searchParams] = useSearchParams();
    const knowledgeBaseId = searchParams.get("id");

    const [similarityThreshold, setSimilarityThreshold] = useState<number>(0);
    const [vectorSimilarityWeight, setVectorSimilarityWeight] = useState<number>(0);

    useEffect(() => {
        if (knowledgeData) {
            setembd_id(knowledgeData.embd_id);
            setSimilarityThreshold(knowledgeData.similarity_threshold);
            setVectorSimilarityWeight(knowledgeData.vector_similarity_weight);
        }
    }, [knowledgeData]);

    const handleUpdateKnowledgeBaseModel = async () => {
        if (knowledgeBaseId && embd_id != null) {
            const updatedKnowledgeBase = {
                embd_id,
                similarity_threshold: similarityThreshold,
                vector_similarity_weight: vectorSimilarityWeight,
            };
    
            await setKnowledge(updatedKnowledgeBase);
            toast.success("Knowledge base updated successfully");
        } else {
            toast.error("Failed to update knowledge base");
        }
    };


    useEffect(() => {
        if (llmData && llmData.length > 0) {
            const convertedChoices = llmData.map((llm) => ({
                id: llm.tenant_id,
                llm_factory: llm.llm_factory,
                name: llm.llm_name,
                type: llm.model_type,
                base_url: llm.api_base,
            }));
            console.log("convertedChoices:", convertedChoices);
            setChoices(convertedChoices);
        }
    }, [llmData]);

    return (
        <KnowledgeLayout>
            <Box>
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
                    <Typography color="text.primary" fontSize="16px">
                        Configuration
                    </Typography>
                </Breadcrumbs>
                <Box
                    marginTop="16px"
                    sx={{
                        backgroundColor: "#fff",
                        flex: "1 1",
                        boxSizing: "border-box",
                    }}
                >
                    <Box padding="30px 30px 0">
                        <Typography
                            variant="h3"
                            fontWeight="bold"
                            fontSize="16px"
                            margin="16px 0"
                        >
                            Configuration
                        </Typography>
                        <Typography fontSize="16px" margin="14px 0">
                            Update your knowledge base details especially
                            parsing method here.
                        </Typography>
                        <Divider sx={{ marginY: "24px" }} />
                        <Box display="flex">
                            <Box flex={1} paddingX="16px">
                                <Box marginBottom="24px">
                                    <Typography
                                        fontSize="16px"
                                        paddingBottom="8px"
                                    >
                                        <Box
                                            component="span"
                                            color="red"
                                            marginRight="4px"
                                        >
                                            *
                                        </Box>
                                        Embedding model
                                    </Typography>
                                    <FormControl
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                    >
                                        <Select
                                            MenuProps={{
                                                MenuListProps: {
                                                    disablePadding: true,
                                                },
                                            }}
                                            value={embd_id}
                                            sx={{
                                                flex: 2,
                                                marginTop: "10px",
                                            }}
                                            onChange={(e) => {
                                                setembd_id(e.target.value as string);

                                            }}
                                        >
                                            {choices
                                                .filter((choice) => choice.type === "embedding")
                                                .map((choice, index) => (
                                                    <MenuItem key={index} value={choice.name}>
                                                        {choice.name}
                                                    </MenuItem>
                                                ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                                {/* <Box marginBottom="24px">
                                    <Typography
                                        fontSize="16px"
                                        paddingBottom="8px"
                                    >
                                        <Box
                                            component="span"
                                            color="red"
                                            marginRight="4px"
                                        >
                                            *
                                        </Box>
                                        Chunk method
                                    </Typography>
                                    <FormControl
                                        variant="outlined"
                                        fullWidth
                                        size="small"
                                    >
                                        <Select
                                            MenuProps={{
                                                MenuListProps: {
                                                    disablePadding: true,
                                                },
                                            }}
                                            value={"General"}
                                            sx={{
                                                flex: 2,
                                                marginTop: "10px",
                                            }}
                                        >
                                            <MenuItem value={"General"}>
                                                General
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Box> */}
    

                                <Box marginBottom="24px">
                                    <Box display="flex" gap="10px" alignItems="center" padding="8px">
                                        <Typography fontSize="16px">Similarity Threshold</Typography>
                                        <Tooltip title={<Typography fontSize="14px">                    Used to re-evaluate and rank the retrieved context. Contexts with similarity below this threshold will be discarded.
                                            </Typography>}>
                                            <HelpOutlineIcon sx={{ fontSize: "18px", color: "#ccc", cursor: "help" }} />
                                        </Tooltip>
                                    </Box>
                                    <Slider
                                        size="small"
                                        value={similarityThreshold}
                                        onChange={(e, value) => setSimilarityThreshold(value as number)}
                                        aria-label="Similarity Threshold"
                                        valueLabelDisplay="auto"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                    />
                                </Box>

                                <Box marginBottom="24px">
                                    <Box display="flex" gap="10px" alignItems="center" padding="8px">
                                        <Typography fontSize="16px">Vector Similarity Weight</Typography>
                                        <Tooltip title={<Typography fontSize="14px">Determines the importance of vector similarity in the overall similarity calculation.</Typography>}>
                                            <HelpOutlineIcon sx={{ fontSize: "18px", color: "#ccc", cursor: "help" }} />
                                        </Tooltip>
                                    </Box>
                                    <Slider
                                        size="small"
                                        value={vectorSimilarityWeight}
                                        onChange={(e, value) => setVectorSimilarityWeight(value as number)}
                                        aria-label="Vector Similarity Weight"
                                        valueLabelDisplay="auto"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                    />
                                </Box>
                                
                                <Box
                                marginTop="30px"
                                display="flex"
                                gap="10px"
                                sx={{
                                    float: "right",
                                }}
                            >
                                <Button
                                    sx={{
                                        border: "1px solid #ccc",
                                        borderRadius: "8px",
                                        fontWeight: "medium",
                                    }}
                                    onClick={() => {
                                        navigate("/admin/knowledge");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    sx={{
                                        borderRadius: "8px",
                                        backgroundColor: "#1677ff",
                                        color: "#fff",
                                        fontWeight: "medium",
                                        "&:hover": {
                                            backgroundColor: "#1677ff",
                                        },
                                    }}
                                    onClick={async () => {
                                        handleUpdateKnowledgeBaseModel();
                                    }}
                                >
                                    {/* <CircularProgress size={14} sx={{marginRight: "10px"}}/> */}
                                    OK
                                </Button>
                            </Box>
                            </Box>
                            <Box flex={2} paddingX="16px" marginBottom="16px">
                                <Typography
                                    fontWeight="bold"
                                    fontSize="18px"
                                    marginBottom="8px"
                                >
                                    "General" Chunking Method Description
                                </Typography>
                                <Typography fontSize="16px" marginY="14px">
                                    Supported file formats are{" "}
                                    <Box component="span" fontWeight="bold">
                                        DOCX, EXCEL, PPT, IMAGE, PDF, TXT.
                                    </Box>
                                </Typography>
                                <Typography fontSize="16px" marginY="14px">
                                    This method apply the naive ways to chunk
                                    files:
                                </Typography>
                                <List
                                    sx={{
                                        listStyleType: "disc",
                                        pl: 5,
                                        fontSize: "16px",
                                    }}
                                >
                                    <ListItem
                                        sx={{
                                            display: "list-item",
                                            padding: 0,
                                        }}
                                    >
                                        <ListItemText
                                            primaryTypographyProps={{
                                                fontSize: "16px",
                                            }}
                                        >
                                            Successive text will be sliced into
                                            pieces using vision detection model.
                                        </ListItemText>
                                    </ListItem>
                                    <ListItem
                                        sx={{
                                            display: "list-item",
                                            padding: 0,
                                        }}
                                    >
                                        <ListItemText
                                            primaryTypographyProps={{
                                                fontSize: "16px",
                                            }}
                                        >
                                            Next, these successive pieces are
                                            merge into chunks whose token number
                                            is no more than 'Token number'.
                                        </ListItemText>
                                    </ListItem>
                                </List>
                                <Typography
                                    margin="26px 0 8px"
                                    fontWeight="bold"
                                    fontSize="18px"
                                >
                                    "General" Examples
                                </Typography>
                                <Typography fontSize="16px">
                                    The following screenshots are presented to
                                    facilitate understanding.
                                </Typography>
                                <Grid
                                    container
                                    spacing={1}
                                    sx={{ rowGap: 1 }}
                                    margin="16px -5px 0"
                                >
                                    <Grid item xs={6}>
                                        <Box
                                            component="img"
                                            sx={{
                                                width: "100%",
                                                paddingX: "5px",
                                            }}
                                            alt=""
                                            src="https://demo.ragflow.io/static/naive-01.f57569b7.svg"
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box
                                            component="img"
                                            sx={{
                                                width: "100%",
                                                paddingX: "5px",
                                            }}
                                            alt=""
                                            src="https://demo.ragflow.io/static/naive-02.3fe3610b.svg"
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </KnowledgeLayout>
    );
};

export default KnowledgeBaseConfiguration;
