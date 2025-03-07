import { CheckIcon, LinkIcon } from "@heroicons/react/24/outline";
import {
    Box,
    Button,
    CircularProgress,
    Input,
    Typography,
} from "@mui/material";
import { IModalManagerChildrenProps } from "components/modal-manager";
import { Dialog } from "components/ui/dialog";
import { useTranslate } from "hooks/common-hook";
import { useSetNextConversation } from "hooks/conversation-hook";
import { useGetChatParams } from "hooks/route-hook";
import { useState } from "react";

interface IProps extends Omit<IModalManagerChildrenProps, "showModal"> {
    id: string;
    name: string;
}

const ShareConversationModal = ({ visible, hideModal, id, name }: IProps) => {
    const { t } = useTranslate("conversation");
    const host = window.location.host;
    const { dialogId } = useGetChatParams();
    const defaultShareLink = `http://${host}/.../share/...`;
    const [shareLink, setShareLink] = useState<string>(defaultShareLink);
    const { setConversation, loading } = useSetNextConversation();

    return (
        <Dialog
            title={t("shareConversation")}
            visible={visible}
            hideModal={hideModal}
        >
            <>
                <Typography>{t("shareConversationTip")}</Typography>
                <Typography>
                    <strong>{name}</strong>
                </Typography>
                <Box display="flex" justifyContent="space-between" gap="8px">
                    <Input
                        sx={{
                            flex: "1",
                        }}
                        placeholder={shareLink}
                        value={shareLink}
                        readOnly
                    />
                    <Button
                        disabled={loading}
                        onClick={async () => {
                            await setConversation({
                                conversation_id: id,
                                is_new: false,
                                share: "1"
                            });
                            setShareLink(`http://${host}/${dialogId}/share/${id}`);
                        
                            try {
                                await navigator.clipboard.writeText(`http://${host}/${dialogId}/share/${id}`);
                                // Bạn có thể thêm thông báo cho người dùng nếu cần,
                                // ví dụ: hiển thị Snackbar, toast, hoặc cập nhật giao diện
                            } catch (err) {
                            }
                        }}
                    >
                        {loading ? (
                            <Box display="flex" gap="4px" alignItems="center">
                                <CircularProgress size="12px" />
                                <Typography>Creating Link</Typography>
                            </Box>
                        ) : (
                            <Box>
                                {shareLink !== defaultShareLink ? <Box display="flex" gap="4px" alignItems="center">
                                <CheckIcon className="h-4 w-4" />
                                <Typography>Copied Link</Typography>
                            </Box> : <Box display="flex" gap="4px" alignItems="center">
                                <LinkIcon className="h-4 w-4" />
                                <Typography>Share Link</Typography>
                            </Box> }
                            </Box>
                        )}
                    </Button>
                </Box>
            </>
        </Dialog>
    );
};

export default ShareConversationModal;
