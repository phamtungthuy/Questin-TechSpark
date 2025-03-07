import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  Tooltip,
  Typography,
} from "@mui/material";
import SettingLayout from "../layout";
import { LlmItem, useSelectLlmList } from "hooks/llm-hook";
import { useSetModalState, useTranslate } from "hooks/common-hook";
import { IconMap } from "./contansts";
import { isLocalLlmFactory } from "./utils";
import { useCallback } from "react";
import ApiKeyModal from "components/admin/setting/model-settings/api-key-modal";
import { useSubmitAddModel, useSubmitApiKey } from "./hook";
import SvgIcon from "components/svg-icon";
import SettingAddModelModal from "components/admin/setting/model-settings/add-model-modal";

interface IModelCardProps {
  item: LlmItem;
  clickApiKey: (llmFactory: string) => void;
  clickAddModel: (llmFactory: string) => void;
}

const LlmIcon = ({ name }: { name: string }) => {
  const icon = IconMap[name as keyof typeof IconMap];
  console.log(icon);
  return icon ? (
    <SvgIcon name={`llm/${icon}`} style={{ minHeight: 48, maxHeight: 48 }} />
  ) : (
    <Avatar
      src="https://uxwing.com/wp-content/themes/uxwing/download/arts-graphic-shapes/3d-modeling-icon.png"
      sx={{ minHeight: 48, maxHeight: 48 }}
    />
  );
};

const ModelCard = ({ item, clickApiKey, clickAddModel }: IModelCardProps) => {
  const { visible, switchVisible } = useSetModalState();
  const { t } = useTranslate("setting");
  const handleApiKeyClick = () => {
    clickApiKey(item.name);
  };
  const handleAddModelClick = () => {
    clickAddModel(item.name);
  };
  const handleShowMoreClick = () => {
    switchVisible();
  };

  return (
    <ListItem disablePadding>
      <Card
        style={{
          padding: "16px",
          width: "100%",
          backgroundColor: "rgb(227, 240, 255)",
          boxShadow: "none",
        }}
      >
        <Grid container alignItems="center">
          <Grid
            onClick={handleShowMoreClick}
            sx={{ cursor: "pointer" }}
            item
            xs={12}
            md={6}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <LlmIcon name={item.name} />
              <Box>
                <Typography variant="h6">{item.name}</Typography>
                <Typography
                  sx={{ wordBreak: "break-word" }}
                  variant="body2"
                  flexWrap="wrap"
                >
                  {item.tags}
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                onClick={handleApiKeyClick}
                startIcon={
                  <i
                    className="fa-regular fa-gear"
                    style={{ fontSize: "12px" }}
                  ></i>
                }
                sx={{
                  width: "auto",
                  fontSize: "12px",
                  color: "#000",
                  backgroundColor: "#ffffff",
                  border: "1px solid transparent",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#ffffff",
                    color: "#0080ff",
                    border: "1px solid #0080ff",
                    boxShadow: "none",
                  },
                  "&.MuiButtonBase-root": {
                    padding: "4px 16px",
                    gap: "0",
                  },
                }}
              >
                {isLocalLlmFactory(item.name) ||
                [
                  "VolcEngine",
                  "Tencent Hunyuan",
                  "XunFei Spark",
                  "BaiduYiyan",
                  "Fish Audio",
                  "Tencent Cloud",
                  "Google Cloud",
                  "Azure OpenAI",
                ].includes(item.name)
                  ? t("apiKey")
                  : t("apiKey")}
              </Button>

              <Button
                variant="outlined"
                onClick={handleAddModelClick}
                startIcon={
                  <i
                    className="fa-regular fa-ellipsis"
                    style={{ fontSize: "12px" }}
                  ></i>
                }
                sx={{
                  fontSize: "12px",
                  color: "#000",
                  backgroundColor: "#ffffff",
                  border: "1px solid transparent",
                  padding: "4px 16px",
                  textTransform: "none",
                  "&:hover": {
                    backgroundColor: "#ffffff",
                    color: "#0080ff",
                    border: "1px solid #0080ff",
                    boxShadow: "none",
                  },
                  "&.MuiButtonBase-root": {
                    padding: "4px 16px",
                    gap: "0",
                  },
                }}
              >
                {t("showMoreModels")}
              </Button>
              <Tooltip title={t("delete", { keyPrefix: "common" })}>
                <IconButton
                  // onClick={handleDeleteFactory}
                  color="error"
                >
                  <i
                    className="fa-regular fa-xmark"
                    style={{ fontSize: "12px" }}
                  ></i>
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        {visible && (
          <List>
            {item.llm.map((llm) => (
              <ListItem key={llm.name} disablePadding>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography>{llm.name}</Typography>
                  <Chip
                    label={llm.type}
                    // variant="outlined"
                    size="small"
                    sx={{
                      backgroundColor: "white",
                      color: "#000",
                      border: "1px solid #000",
                    }}
                  />
                  <Tooltip
                    title={t("delete", {
                      keyPrefix: "common",
                    })}
                  >
                    <IconButton
                      //   onClick={() => handleDeleteLlm(llm.name)}
                      color="error"
                    >
                      <i
                        className="fa-regular fa-xmark"
                        style={{ fontSize: "14px" }}
                      ></i>
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Card>
    </ListItem>
  );
};

const UserSettingModel = () => {
  const { t } = useTranslate("setting");
  const { factoryList, myLlmList: llmList, loading } = useSelectLlmList();
  const {
    saveApiKeyLoading,
    initialApiKey,
    llmFactory,
    onApiKeySavingOk,
    apiKeyVisible,
    hideApiKeyModal,
    showApiKeyModal,
  } = useSubmitApiKey();
  const {
    addModelLoading,
    initialAddModel,
    llmFactory: llmFactoryAddModel,
    onAddModelSavingOk,
    addModelVisible,
    hideAddModelModal,
    showAddModelModal,
  } = useSubmitAddModel();
  const handleAddModel = useCallback(
    (llmFactory: string) => {
      //   if (isLocalLlmFactory(llmFactory)) {
      //     showLlmAddingModal(llmFactory);
      //   } else if (llmFactory in ModalMap) {
      //     ModalMap[llmFactory as keyof typeof ModalMap]();
      //   } else {
      //     showApiKeyModal({ llm_factory: llmFactory });
      //   }
    },
    // [showApiKeyModal, showLlmAddingModal, ModalMap],
    []
  );

  const items = [
    {
      key: "1",
      label: t("addedModels"),
      children: (
        <Grid container spacing={2}>
          {llmList.map((item) => (
            <Grid item xs={12} key={item.name} boxShadow="none">
              <ModelCard
                item={item}
                clickApiKey={() => {
                  showApiKeyModal({ llm_factory: item.name });
                }}
                clickAddModel={() => {
                  showAddModelModal({ llm_factory: item.name });
                }}
              />
            </Grid>
          ))}
        </Grid>
      ),
    },
    {
      key: "2",
      label: t("modelsToBeAdded"),
      children: (
        <Grid
          container
          spacing={{
            xs: 1,
            sm: 1,
            md: 2,
            lg: 3,
            xl: 4,
            xxl: 8,
          }}
          alignItems="stretch"
        >
          {factoryList.map((item) => (
            <Grid
              item
              xs={12}
              sm={6}
              md={4}
              lg={3}
              key={item.name}
              alignItems=""
            >
              <Card
                variant="outlined"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  borderRadius: "12px",
                  backgroundColor: "#E3F0FF",
                  boxShadow: "none",
                  padding: "16px",
                }}
              >
                <Box
                  display="flex"
                  flexDirection="column"
                  // alignItems="center"
                  flexGrow={1}
                  gap={1}
                >
                  <LlmIcon name={item.name} />
                  <Box>
                    <Typography variant="h6" noWrap title={item.name}>
                      {item.name}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      height="auto"
                      overflow="hidden"
                    >
                      {item.tags}
                    </Typography>
                  </Box>
                </Box>

                <Box>
                  <Divider style={{ margin: "4px 0" }} />
                  <Button
                    variant="text"
                    onClick={() => handleAddModel(item.name)}
                    style={{
                      color: "#1976d2",
                      fontWeight: "bold",
                      padding: "0",
                    }}
                  >
                    {t("addTheModel")}
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      ),
    },
  ];

  return (
    <SettingLayout>
      <Box>
        <ApiKeyModal
          visible={apiKeyVisible}
          hideModal={hideApiKeyModal}
          loading={saveApiKeyLoading}
          initialValue={initialApiKey}
          onOk={onApiKeySavingOk}
          llmFactory={llmFactory}
        />
        <SettingAddModelModal
          visible={addModelVisible}
          hideModal={hideAddModelModal}
          loading={addModelLoading}
          initialValue={initialAddModel}
          onOk={onAddModelSavingOk}
          llmFactory={llmFactoryAddModel}
        />
        <Box display="flex" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight="bold">
              {t("model")}
            </Typography>
            <Typography fontSize="14px">{t("modelDescription")}</Typography>
          </Box>
          <Box>
            <IconButton
              sx={{
                width: "auto",
                borderRadius: "20px",
                backgroundColor: "black",
                color: "white",
                paddingX: "20px",
                paddingY: "5px",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  opacity: 0.7,
                  backgroundColor: "black",
                  color: "white",
                },
              }}
            >
              <i
                className="fa-regular fa-gear"
                style={{ fontSize: "14px", marginRight: "6px" }}
              ></i>
              <Typography>{t("systemModelSettings")}</Typography>
            </IconButton>
          </Box>
        </Box>
        <Divider
          sx={{
            marginTop: "30px",
            marginBottom: "30px",
          }}
        />
        <Accordion
          sx={{
            border: "none",
            boxShadow: "none",
            textShadow: "none",
            backgroundColor: "transparent",
          }}
          defaultExpanded
        >
          <AccordionSummary
            expandIcon={<i className="fa-regular fa-chevron-down"></i>}
            sx={{
              flexDirection: "row-reverse",
            }}
          >
            <Typography
              sx={{
                marginLeft: "10px",
              }}
            >
              {t("addedModels")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" gap="10px" flexDirection="column">
              <Box>{items[0]["children"]}</Box>
            </Box>
          </AccordionDetails>
        </Accordion>
        <Accordion
          sx={{
            border: "none",
            boxShadow: "none",
            textShadow: "none",
            backgroundColor: "transparent",
          }}
          defaultExpanded
        >
          <AccordionSummary
            expandIcon={<i className="fa-regular fa-chevron-down"></i>}
            sx={{
              flexDirection: "row-reverse",
            }}
          >
            <Typography
              sx={{
                marginLeft: "10px",
              }}
            >
              {t("modelsToBeAdded")}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexWrap="wrap" gap="20px">
              {items[1]["children"]}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    </SettingLayout>
  );
};

export default UserSettingModel;
