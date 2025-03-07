import {
    Box,
    Checkbox,
    Divider,
    MenuItem,
    Select,
    Slider,
    Switch,
    Tab,
    Tabs,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import BaseModal from "components/base-modal";
import { IModalManagerChildrenProps } from "components/modal-manager";
import useForm, { useTranslate } from "hooks/common-hook";
import { useSetNextDialog } from "hooks/dialog-hook";
import { useFetchNextKnowledgeList } from "hooks/knowledge-hook";
import { useFetchNextLLMList } from "hooks/llm-hook";
import { IDialog } from "interfaces/database/dialog";
import { useEffect, useState } from "react";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";

interface IProps extends IModalManagerChildrenProps {
    initialDialog: IDialog;
    loading: boolean;
    onOk: (dialog: IDialog) => void;
    clearDialog: () => void;
}

const ChatConfigurationModal = ({
    visible,
    hideModal,
    initialDialog,
    loading,
    onOk,
    clearDialog,
}: IProps) => {
    const form = useForm({});
    const { t } = useTranslate("chat");
    const handleOk = async () => {
        onOk({
            ...initialDialog,
            ...form.formValues
        });
    };

    const [activeTab, setActiveTab] = useState<number>(0);
    const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
    const [llmList, setLLMList] = useState<any[]>([]);
    const [rerankList, setRerankList] = useState<any[]>([]);
    const { data: knowledgeData } = useFetchNextKnowledgeList();
    const { data: llmData } = useFetchNextLLMList();

    const handleClose = async () => {
        form.resetForm();
        hideModal();
    }
    useEffect(() => {
        if (llmData) {
            console.log(llmData)
            const filteredLLMData = llmData.filter(
                (llm) => llm.model_type === "chat"
            );
            const filteredRerankData = llmData.filter(
                (llm) => llm.model_type === "rerank"
            );
            setLLMList(filteredLLMData);
            setRerankList(filteredRerankData);
        }
        if (knowledgeData) {
            setKnowledgeList(knowledgeData);
        }
        if (visible) {
            console.log(initialDialog)
            form.setFieldsValue({
                ...{
                    name: "",
                    similarity_threshold: 0.2,
                    vector_similarity_weight: 0.7,
                    llm_id: "",
                    kb_ids: [],
                    top_n: 6,
                    rerank_id: ""
                },
                ...initialDialog
            })
        }
    }, [visible, llmData, knowledgeData, initialDialog]);
    
    return (
        <BaseModal
            title={t("chatConfiguration")}
            onOk={handleOk}
            onClose={handleClose}
            open={visible}
            sx={{
                width: 688,
            }}
        >
            <Box>
                <Box
                    width="100%"
                    display="flex"
                    bgcolor="rgb(245,245,245)"
                    marginBottom="20px"
                    borderRadius="10px"
                    color="black"
                    height="48px"
                >
                    <Tabs
                        value={activeTab}
                        onChange={(e, newValue) => setActiveTab(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                        sx={{
                            padding: "4px",
                            alignItems: "center",
                            minHeight: "36px",
                            height: "100%",
                            flexGrow: 1,
                            borderRadius: "10px",
                            "& .MuiTabs-indicator": {
                                display: "none",
                            },
                        }}
                    >
                        <Tab
                            label="Assistant Setting"
                            disableRipple
                            sx={{
                                minHeight: "32px",
                                height: "40px",
                                width: "33.33%",
                                textTransform: "none",
                                fontWeight: "normal",
                                fontSize: "1rem",
                                backgroundColor:
                                    activeTab === 0
                                        ? "white"
                                        : "rgb(245,245,245)",
                                color: activeTab === 0 ? "black" : "black",
                                borderRadius: "10px",
                                transition: "background-color 0.2s ease",
                                "&:hover": {
                                    backgroundColor:
                                        activeTab === 0
                                            ? "white"
                                            : "rgba(0, 0, 0, 0.1)",
                                },
                                "&.Mui-selected": {
                                    color: "black",
                                },
                                "&:focus": {
                                    outline: "none",
                                },
                            }}
                        />
                        <Tab
                            label="Prompt Engine"
                            disableRipple
                            sx={{
                                minHeight: "32px",
                                height: "40px",
                                width: "33.33%",
                                textTransform: "none",
                                fontWeight: "normal",
                                fontSize: "1rem",
                                backgroundColor:
                                    activeTab === 1
                                        ? "white"
                                        : "rgb(245,245,245)",
                                color: activeTab === 1 ? "black" : "black",
                                borderRadius: "10px",
                                transition: "background-color 0.2s ease",
                                "&:hover": {
                                    backgroundColor:
                                        activeTab === 1
                                            ? "white"
                                            : "rgba(0, 0, 0, 0.1)",
                                },
                                "&.Mui-selected": {
                                    color: "black",
                                },
                                "&:focus": {
                                    outline: "none",
                                },
                            }}
                        />
                        <Tab
                            label="Model Setting"
                            disableRipple
                            sx={{
                                minHeight: "32px",
                                height: "40px",
                                width: "33.33%",
                                textTransform: "none",
                                fontWeight: "normal",
                                fontSize: "1rem",
                                backgroundColor:
                                    activeTab === 2
                                        ? "white"
                                        : "rgb(245,245,245)",
                                color: activeTab === 2 ? "black" : "black",
                                borderRadius: "10px",
                                transition: "background-color 0.2s ease",
                                "&:hover": {
                                    backgroundColor:
                                        activeTab === 2
                                            ? "white"
                                            : "rgba(0, 0, 0, 0.1)",
                                },
                                "&.Mui-selected": {
                                    color: "black",
                                },
                                "&:focus": {
                                    outline: "none",
                                },
                            }}
                        />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <Box>
                        <Divider />
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            my={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "16px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                <span style={{ color: "red" }}>*</span>{" "}
                                Assistant name
                            </Typography>
                            <TextField
                                value={form.getFieldValue("name")}
                                onChange={(e) =>
                                    form.setFieldValue("name", e.target.value)
                                }
                                placeholder="e.g. Resume Jarvis"
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                    height: "36px",
                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                    },
                                }}
                            />
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "16px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Description of assistant
                            </Typography>
                            <TextField
                                value={""}
                                // onChange={()}
                                placeholder="chat.descriptionPlaceholder"
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                    height: "36px",
                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                    },
                                }}
                            />
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "16px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                    width: "40%",
                                }}
                            >
                                Assistant avatar
                            </Typography>
                            <Box
                                className="hehe"
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                }}
                            >
                                <Box
                                    sx={{
                                        width: "30%",
                                        height: "100px",
                                        border: "1px dashed #ccc",
                                        borderRadius: "4px",
                                        display: "flex",
                                        flexDirection: "column",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        cursor: "pointer",
                                    }}
                                    component="label"
                                >
                                    <input
                                        type="file"
                                        hidden
                                        // TODO: onchange...
                                        accept="image/*"
                                        className=""
                                    />
                                    <Box
                                        sx={{
                                            display: "flex",
                                            flexDirection: "column",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >
                                        <Typography>+</Typography>
                                        <Typography>Upload</Typography>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Empty response
                            </Typography>

                            <Tooltip
                                title="Set this as a response if no results are retrieved from the knowledge bases for your query, or leave this field blank to allow the LLM to improvise when nothing is found."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>

                            <TextField
                                value={""}
                                // onChange={()}
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                    height: "36px",
                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                    },
                                }}
                            />
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Opening greeting
                            </Typography>

                            <Tooltip
                                title="Set an opening greeting for users."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>

                            <TextField
                                multiline
                                rows={4}
                                value={""}
                                // onChange={()}
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",

                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                    },
                                }}
                            />
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            mb={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Show quote
                            </Typography>

                            <Tooltip
                                title="Whether to display the original text as a reference."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>

                            <Box
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                }}
                            >
                                <Switch defaultChecked />
                            </Box>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "16px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                <span style={{ color: "red" }}>*</span>{" "}
                                Knowledge Bases
                            </Typography>
                            <Select
                                multiple
                                value={form.getFieldValue("kb_ids") || []}
                                onChange={(e) => {
                                    const selectedValues = e.target.value;
                                    if (Array.isArray(selectedValues)) {
                                        form.setFieldValue("kb_ids", selectedValues)
                                    }
                                }}
                                displayEmpty
                                renderValue={(selected) => {
                                    if (!selected || selected.length === 0) {
                                        return (
                                            <span
                                                style={{
                                                    color: "rgba(0, 0, 0, 0.5)",
                                                }}
                                            >
                                                Please select
                                            </span>
                                        );
                                    }
                                    const selectedNames = knowledgeList
                                        .filter((kb) =>
                                            selected.includes(kb.id)
                                        )
                                        .map((kb) => kb.name);

                                    return selectedNames.join(", ");
                                }}
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                    height: "36px",
                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                        paddingTop: "10px",
                                        paddingBottom: "10px",
                                    },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        style: {
                                            height: "200px",
                                            overflowY: "auto",
                                        },
                                    },
                                    disableAutoFocusItem: true,
                                }}
                            >
                                {knowledgeList.map((kb: any, index: number) => (
                                    <MenuItem key={index} value={kb.id}>
                                        <Checkbox
                                            checked={form.getFieldValue("kb_ids")?.includes(
                                                kb.id
                                            )}
                                            style={{ marginRight: 8 }}
                                        />
                                        {kb.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    </Box>
                )}

                {activeTab === 1 && (
                    <Box>
                        <Divider />
                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            my={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                <span style={{ color: "red" }}>*</span> System
                            </Typography>
                            <Tooltip
                                title="Your prompts or instructions for the LLM, including but not limited to its role, the desired length, tone, and language of its answers."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>
                            <TextField
                                multiline
                                rows={4}
                                value={""}
                                // onChange={()}
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",

                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                    },
                                }}
                            />
                        </Box>
                        <Divider />

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            my={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Similarity threshold
                            </Typography>
                            <Tooltip
                                title="RAGFlow employs either a combination of weighted keyword similarity and weighted vector cosine similarity, or a combination of weighted keyword similarity and weighted reranking score during retrieval. This parameter sets the threshold for similarities between the user query and chunks. Any chunk with a similarity score below this threshold will be excluded from the results."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>
                            <Box
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                }}
                            >
                                <Slider
                                    value={form.getFieldValue("similarity_threshold")}
                                    valueLabelDisplay="auto"
                                    step={0.01}
                                    min={0}
                                    max={1}
                                    onChange={(e, value) => {
                                        form.setFieldValue("similarity_threshold", value);
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            my={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Vector similarity weight
                            </Typography>
                            <Tooltip
                                title="This sets the weight of keyword similarity in the combined similarity score, either used with vector cosine similarity or with reranking score. The total of the two weights must equal 1.0."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>
                            <Box
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                }}
                            >
                                <Slider
                                    defaultValue={form.getFieldValue("vector_similarity_weight")}
                                    valueLabelDisplay="auto"
                                    step={0.01}
                                    min={0}
                                    max={1}
                                    onChange={(e, value) => {
                                        form.setFieldValue("vector_similarity_weight", value);
                                    }
                                    }
                                />
                            </Box>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            my={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Top N
                            </Typography>
                            <Tooltip
                                title="Not all chunks with similarity score above the 'similarity threshold' will be sent to the LLM. This selects 'Top N' chunks from the retrieved ones."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>
                            <Box
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                }}
                            >
                                <Slider
                                    defaultValue={form.getFieldValue("top_n")}
                                    valueLabelDisplay="auto"
                                    step={1}
                                    min={0}
                                    max={30}
                                    onChange={(e, value) => {
                                        form.setFieldValue("top_n", value);
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mb={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "6px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Rerank model
                            </Typography>

                            <Tooltip
                                title="If left empty, RAGFlow will use a combination of weighted keyword similarity and weighted vector cosine similarity; if a rerank model is selected, a weighted reranking score will replace the weighted vector cosine similarity."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>
                            <Select
                                value={form.getFieldValue("rerank_id")}
                                onChange={(e) => {
                                    if (e.target.value === "None") {
                                        form.setFieldValue("rerank_id", "");
                                    }
                                    else {
                                        form.setFieldValue("rerank_id", e.target.value);
                                    }
                                        
                                }}
                                // onChange={}
                                displayEmpty
                                renderValue={(selected) => (
                                    <span
                                        style={{
                                            color: selected
                                                ? "inherit"
                                                : "rgba(0, 0, 0, 0.5)",
                                        }}
                                    >
                                        {typeof selected === "string" &&
                                        selected.length > 0
                                            ? selected
                                            : "Please select"}
                                    </span>
                                )}
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                    height: "36px",
                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                        paddingTop: "10px",
                                        paddingBottom: "10px",
                                    },
                                }}
                            >
                                
                             {rerankList.map((rerank: any, index: number) => (
                                    <MenuItem key={rerank.llm_name} value={rerank.llm_name}>
                                        {rerank.llm_name}
                                    </MenuItem>
                                ))}  
                                 <MenuItem  value={"None"}>
                                    None
                                </MenuItem>
                            </Select>
                        </Box>
                    </Box>
                )}

                {activeTab === 2 && (
                    <Box>
                        <Divider />

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            my={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "16px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Model <span style={{ color: "red" }}>*</span>
                            </Typography>
                            <Select
                                value={form.getFieldValue("llm_id")}
                                onChange={(e) => {
                                    form.setFieldValue("llm_id", e.target.value);
                                }}
                                displayEmpty
                                renderValue={(selected) => (
                                    <span
                                        style={{
                                            color: selected
                                                ? "inherit"
                                                : "rgba(0, 0, 0, 0.5)",
                                        }}
                                    >
                                        {selected ? selected : "Please select"}
                                    </span>
                                )}
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                    height: "36px",
                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                        paddingTop: "10px",
                                        paddingBottom: "10px",
                                    },
                                }}
                            >
                                {llmList.map((llm: any, index: number) => (
                                    <MenuItem key={index} value={llm.llm_name}>
                                        {llm.llm_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>

                        <Divider />

                        <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            my={2}
                        >
                            <Typography
                                textAlign="right"
                                variant="body1"
                                style={{
                                    marginRight: "16px",
                                    whiteSpace: "nowrap",
                                    flex: 1,
                                }}
                            >
                                Freedom
                            </Typography>
                            <Tooltip
                                title="Set the freedom level to 'Precise' to strictly confine the LLM's response to your selected knowledge base(s). Choose 'Improvise' to grant the LLM greater freedom in its responses, which may lead to hallucinations. 'Balance' is an intermediate level; choose 'Balance' for more balanced responses."
                                placement="top-start"
                            >
                                <QuestionMarkCircleIcon className="h-5 w-5 mr-4 cursor-help"></QuestionMarkCircleIcon>
                            </Tooltip>
                            <Select
                                value={"Precise"}
                                // onChange={}
                                displayEmpty
                                sx={{
                                    width: "60%",
                                    marginRight: "20px",
                                    height: "36px",
                                    "& .MuiInputBase-root": {
                                        height: "100%",
                                        paddingTop: "10px",
                                        paddingBottom: "10px",
                                    },
                                }}
                            >
                                {["Precise", "Improvise", "Balance"].map(
                                    (option, index) => (
                                        <MenuItem key={index} value={option}>
                                            {option}
                                        </MenuItem>
                                    )
                                )}
                            </Select>
                        </Box>
                    </Box>
                )}
            </Box>
        </BaseModal>
    );
};

export default ChatConfigurationModal;
