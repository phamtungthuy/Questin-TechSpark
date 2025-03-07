import {
    Box,
    Divider,
    FormControl,
    MenuItem,
    Select,
    Switch,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import BaseModal from "components/base-modal";
import { IModalManagerChildrenProps } from "components/modal-manager";
import useForm, { useTranslate } from "hooks/common-hook";
import { useFetchParserListOnMount } from "./hook";
import { useEffect } from "react";
import { omit } from "lodash";
import { QuestionMarkCircleIcon } from "@heroicons/react/24/outline";
import { IParserConfig } from "interfaces/database/document";
import { IChangeParserConfigRequestBody } from "interfaces/request/document";
import ParseConfiguration from "../parse-configuration";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    loading: boolean;
    onOk: (
        parserId: string,
        parserConfig: IChangeParserConfigRequestBody
    ) => void;
    parserId: string;
    parserConfig: IParserConfig;
    documentExtension: string;
    documentId: string;
}

export const configuration = {
    raptor: {
        prompt: `Please summarize the following paragraphs. Be careful with the numbers, do not make things up. Paragraphs as following:
    {cluster_content}
The above is the content you need to summarize.`,
        max_token: 256,
        threshold: 0.1,
        max_cluster: 64,
        random_seed: 0,
        use_raptor: false,
    },
    task_page_size: 12,
    delimiter: "\n!?;.",
};

const ChunkMethodModal = ({
    documentId,
    parserId,
    onOk,
    hideModal,
    visible,
    documentExtension,
    parserConfig,
    loading,
}: IProps) => {
    const form = useForm({});
    const { parserList, handleChange, selectedTag } = useFetchParserListOnMount(
        documentId,
        parserId,
        documentExtension,
        form
    );
    const { t } = useTranslate("knowledgeDetails");

    const handleOk = async () => {
        const values = await form.formValues;
        onOk(selectedTag, {
            ...values.parser_config,
            pages: values.pages?.map((x: any) => [x.from, x.to]) ?? [],
        });
    };

    useEffect(() => {
        if (visible && !form.getFieldValue("pages")) {
            form.setFieldValue(
                "pages",
                parserConfig?.pages?.map(([from, to]) => ({ from, to })) ?? [
                    { from: 1, to: 1024 },
                ]
            );
            form.setFieldValue(
                "parser_config",
                omit(
                    {
                        ...configuration,
                        ...parserConfig,
                    },
                    "pages"
                )
            );
        }

        if (!visible && Object.keys(form.formValues).length !== 0) {
            form.resetForm();
        }
    }, [form, documentId, parserConfig, visible]);

    const parser_config = form.getFieldValue("parser_config");
    const { raptor, task_page_size, delimiter } = parser_config || {};
    return (
        <BaseModal
            open={visible}
            onClose={hideModal}
            onOk={handleOk}
            title={t("chunkMethod")}
            sx={{ width: "700px",
                maxHeight: "80%"

             }}
        >
            <Box display="flex" flexDirection="column" gap="20px" sx={{
                height: "100%",
                overflow: "auto",
                padding: "8px 32px"
            }} >
                <Box display="flex" alignItems="center" gap="10px">
                    <Typography>Chunk method:</Typography>
                    <Select
                        value={selectedTag}
                        onChange={(e) => handleChange(e.target.value)}
                    >
                        {parserList.map((parserItem) => (
                            <MenuItem
                                value={parserItem.value}
                                key={parserItem.value}
                            >
                                {parserItem.label}
                            </MenuItem>
                        ))}
                    </Select>
                </Box>
                <Divider />

                <Box>
                    <Typography display="flex" alignItems="center" gap="8px">
                        Page Ranges:
                        <Tooltip title="something">
                            <QuestionMarkCircleIcon width="18px" />
                        </Tooltip>
                    </Typography>
                </Box>

                {parser_config && (
                    <>
                        {form
                            .getFieldValue("pages")
                            ?.map((x: any, index: number) => (
                                <FormControl
                                    key={index}
                                    sx={{
                                        display: "flex",
                                        gap: "8px",
                                        flexDirection: "row",
                                    }}
                                    onChange={(e: any) => {
                                        const { name, value } = e.target;
                                        const pages = [
                                            ...form.getFieldValue("pages"),
                                        ];
                                        const numValue = Number(value);
                                        if (name === "from") {
                                            pages[index].from = Math.max(
                                                1,
                                                Math.min(
                                                    numValue,
                                                    pages[index].to
                                                )
                                            );
                                        } else {
                                            pages[index].to = Math.max(
                                                pages[index].from,
                                                numValue
                                            );
                                        }
                                        form.setFieldValue("pages", pages);
                                    }}
                                >
                                    <TextField
                                        type="number"
                                        name="from"
                                        value={x.from}
                                        InputProps={{
                                            inputProps: { min: 1, max: x.to },
                                        }}
                                        sx={{ width: "100px" }}
                                    />
                                    <TextField
                                        type="number"
                                        name="to"
                                        value={x.to}
                                        InputProps={{
                                            inputProps: { min: x.from },
                                        }}
                                        sx={{ width: "100px" }}
                                    />
                                </FormControl>
                            ))}

                        <FormControl
                            onChange={(e: any) => {
                                const { name, value } = e.target;
                                form.setFieldValue("parser_config", {
                                    ...parser_config,
                                    [name]:
                                        name === "task_page_size"
                                            ? parseInt(value)
                                            : value,
                                });
                            }}
                        >
                            <Box display="flex" alignItems="center" gap="4px">
                                <Typography>Task page size:</Typography>
                                <TextField
                                    name="task_page_size"
                                    type="number"
                                    value={task_page_size}
                                />
                            </Box>
                            <Box
                                marginTop="16px"
                                display="flex"
                                alignItems="center"
                                gap="8px"
                            >
                                <Typography>Delimiter: </Typography>
                                <TextField
                                    name="delimiter"
                                    type="text"
                                    fullWidth
                                    value={delimiter}
                                />
                            </Box>
                        </FormControl>

                        <Divider />
                        <Box display="flex" alignItems="center" gap="8px">
                            <Typography>
                                Use RAPTOR to enhance retrieval:
                            </Typography>
                            <Switch
                                checked={raptor.use_raptor}
                                onChange={(e) => {
                                    if (raptor.use_raptor) {
                                        form.setFieldValue("parser_config", {
                                            ...parserConfig,
                                            raptor: {
                                                ...raptor,
                                                use_raptor: false,
                                            },
                                        });
                                    } else {
                                        form.setFieldValue("parser_config", {
                                            ...parserConfig,
                                            raptor: {
                                                ...raptor,
                                                use_raptor: true,
                                            },
                                        });
                                    }
                                }}
                            />
                        </Box>
                        {raptor.use_raptor && (
                            <ParseConfiguration form={form} />
                        )}
                    </>
                )}
            </Box>
        </BaseModal>
    );
};

export default ChunkMethodModal;
