import { Box, Typography } from "@mui/material";
import InventoryIcon from "@mui/icons-material/Inventory";
import { useDropzone } from "react-dropzone";
import React, { useState } from "react";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import LinkIcon from "@mui/icons-material/Link";

interface UploadFileProps {
    files: any;
    setFiles: (files: any) => void;
}

const MAX_TOTAL_SIZE_MB = 100;

const UploadFile: React.FC<UploadFileProps> = ({ files, setFiles }) => {
    const [hoveredIndex, setHoveredIndex] = useState<Number>(-1);
    const { getRootProps, getInputProps } = useDropzone({
        accept: {
            "application/pdf": [".pdf"], // PDF files
            "text/plain": [".txt"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                [".xlsx"], // Excel files
            "application/vnd.ms-excel": [".xls"], // Older Excel files
            "text/csv": [".csv"], // CSV files
            // "application/msword": [".doc"], // Word files
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                [".docx"],
        },
        onDrop: (acceptedFiles) => {
            const totalCurrentSize = files.reduce(
                (sum: number, file: any) => sum + file.size,
                0
            );
            const newFilesSize = acceptedFiles.reduce(
                (sum, file) => sum + file.size,
                0
            );
            const totalSizeMB =
                (totalCurrentSize + newFilesSize) / (1024 * 1024);

            if (totalSizeMB > MAX_TOTAL_SIZE_MB) {
                alert(
                    `Total file size exceeds ${MAX_TOTAL_SIZE_MB}MB. Please upload smaller files.`
                );
                return;
            }

            let new_files = files || [];
            new_files.push(
                ...acceptedFiles.map((file) =>
                    Object.assign(file, {
                        preview: URL.createObjectURL(file),
                    })
                )
            );
            setFiles(new_files);
        },
    });

    const removeFile = (idx: number) => {
        const updatedFiles = [...files];
        updatedFiles.splice(idx, 1);
        setFiles(updatedFiles);
    };

    return (
        <Box>
            <Box
                display="flex"
                padding="16px"
                marginTop="10px"
                sx={{
                    cursor: "pointer",
                    backgroundColor: "#fafafa",
                }}
                flexDirection="column"
                alignItems="center"
                border="1px dashed #ccc"
                {...getRootProps()}
            >
                <input {...getInputProps()} />
                <InventoryIcon
                    fontSize="large"
                    sx={{
                        marginTop: "14px",
                        marginBottom: "16px",
                    }}
                />
                <Typography
                    fontSize="16px"
                    marginBottom="4px"
                    fontWeight="medium"
                >
                    Click or drag file to this area to upload
                </Typography>
                <Typography
                    align="center"
                    color="#00000073"
                    fontSize="14px"
                    marginY="14px"
                >
                    Support for a single or bulk upload. Strictly prohibited
                    from uploading company data or other banned files.
                </Typography>
                <Typography
                    align="center"
                    color="red"
                    fontSize="14px"
                    marginY="4px"
                >
                    Total file size must not exceed 100MB
                </Typography>
            </Box>
            <Box marginTop="8px" maxHeight="200px" overflow="auto">
                {files &&
                    files.map((file: any, idx: number) => (
                        <Box
                            key={idx}
                            display="flex"
                            justifyContent="space-between"
                            marginTop="8px"
                            sx={{
                                "&:hover": {
                                    backgroundColor: "#f5f5f5",
                                },
                                cursor: "context-menu",
                            }}
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(-1)}
                        >
                            <Box display="flex" gap="8px">
                                <LinkIcon />
                                <Typography>{file.name}</Typography>
                            </Box>
                            {hoveredIndex === idx && (
                                <DeleteOutlinedIcon
                                    sx={{
                                        "&:hover": {
                                            cursor: "pointer",
                                            backgroundColor: "#e7e7e7",
                                            borderRadius: "4px",
                                        },
                                    }}
                                    onClick={() => removeFile(idx)}
                                />
                            )}
                        </Box>
                    ))}
            </Box>
        </Box>
    );
};

export default UploadFile;
