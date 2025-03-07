"use client";

import { styled } from "@mui/material/styles";
import TextareaAutosize from "@mui/material/TextareaAutosize";
import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import { TextareaAutosizeProps } from "@mui/material/TextareaAutosize";
import { useEffect, useRef } from "react";
import { IconButton, Typography } from "@mui/material";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@mui/material/styles";

// Styled components
const InputWrapper = styled(Box)<{ fullWidth?: boolean; disabled?: boolean }>(
  ({ theme, fullWidth, disabled }) => ({
    display: "flex",
    alignItems: "flex-end",
    padding: `${theme.spacing(1)} ${theme.spacing(1)}`,
    backgroundColor: disabled
      ? theme.palette.grey[300]
      : theme.palette.grey[100], // Màu nền mờ khi disabled
    borderRadius: theme.shape.borderRadius,
    width: fullWidth ? "100%" : "auto",
    cursor: disabled ? "not-allowed" : "text", // Con trỏ chuột bị banned khi disabled
  })
);

const StyledTextarea = styled(TextareaAutosize)<{ disabled?: boolean }>(
  ({ theme, disabled }) => ({
    width: "100%",
    border: "none",
    outline: "none",
    resize: "none",
    padding: `${theme.spacing(0.5)} ${theme.spacing(1)}`,
    backgroundColor: "transparent",
    fontSize: "1rem",
    lineHeight: "1.5",
    color: disabled ? theme.palette.text.disabled : theme.palette.text.primary, // Màu chữ mờ khi disabled
    "&::placeholder": {
      color: disabled
        ? theme.palette.text.disabled
        : theme.palette.text.secondary, // Màu placeholder mờ
    },
  })
);

const IconsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
}));

const ContentWrapper = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: "0",
  width: "100%",
});

const IconsContainer = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
});

interface InputProps extends Omit<TextareaAutosizeProps, "onChange"> {
  leftIcons?: React.ReactNode;
  rightIcons?: React.ReactNode;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  value?: string;
  selectedFiles?: File[];
  setSelectedFiles?: (files: File[]) => void;
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit?: () => void;
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

const Input = ({
  leftIcons,
  rightIcons,
  placeholder = "Type a message...",
  minRows = 1,
  maxRows = 5,
  value,
  onChange,
  onSubmit,
  selectedFiles,
  setSelectedFiles,
  fullWidth = false,
  disabled = false,
  sx,
  ...props
}: InputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const theme = useTheme();

  const maxFileNameLength = 20;
  const fileRow =
    selectedFiles && setSelectedFiles ? (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          mb: selectedFiles && selectedFiles.length > 0 ? 1 : 0,
        }}
      >
        {selectedFiles.map((file, index) => {
          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
          const fileType = file.name.split(".").pop()?.toUpperCase() || "";

          const getFileIcon = (fileType: string) => {
            switch (fileType) {
              case "PDF":
                return "/pdf_icon.png";
              case "DOC":
              case "DOCX":
                return "/doc_icon.png";
              case "XLS":
              case "XLSX":
                return "/xls_icon.png";
              default:
                return "/file_icon.png";
            }
          };
          const fileIconPath = getFileIcon(fileType);

          return isImage ? (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                backgroundColor: theme.palette.action.hover,
                borderRadius: "16px",
                padding: "4px",
              }}
            >
              <Box
                component="img"
                src={URL.createObjectURL(file)}
                sx={{
                  height: "40px",
                  maxWidth: "120px",
                  objectFit: "contain",
                  borderRadius: "8px",
                }}
              />
              <IconButton
                size="small"
                onClick={() => {
                  const newFiles = [...selectedFiles];
                  newFiles.splice(index, 1);
                  setSelectedFiles(newFiles);
                }}
                sx={{ padding: "2px" }}
              >
                <XMarkIcon className="h-4 w-4" />
              </IconButton>
            </Box>
          ) : (
            <Box
              key={index}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                backgroundColor: theme.palette.action.hover,
                borderRadius: "16px",
                padding: "4px 8px",
              }}
            >
              <Box
                component="img"
                src={fileIconPath}
                sx={{
                  width: "32px",
                  height: "32px",
                }}
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                  {file.name.length > maxFileNameLength
                    ? `${file.name.substring(0, maxFileNameLength)}...`
                    : file.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {fileType}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => {
                  const newFiles = [...selectedFiles];
                  newFiles.splice(index, 1);
                  setSelectedFiles(newFiles);
                }}
                sx={{ padding: "2px" }}
              >
                <XMarkIcon className="h-4 w-4" />
              </IconButton>
            </Box>
          );
        })}
      </Box>
    ) : null;

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit?.();
    }
  };

  // Khi disabled thay đổi, tự động focus vào textarea
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  return (
    <InputWrapper
      fullWidth={fullWidth}
      onClick={() => {
        textareaRef.current?.focus();
      }}
      disabled={disabled}
      sx={sx}
    >
      <ContentWrapper position="relative">
        {fileRow}
        <StyledTextarea
          ref={textareaRef}
          placeholder={placeholder}
          minRows={minRows}
          maxRows={maxRows}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
          {...props}
        />
        <IconsContainer
        // position="absolute" right="-4px" bottom="-4px"
        >
          <IconsWrapper>{leftIcons}</IconsWrapper>
          <IconsWrapper>{rightIcons}</IconsWrapper>
        </IconsContainer>
      </ContentWrapper>
    </InputWrapper>
  );
};

export { Input };
