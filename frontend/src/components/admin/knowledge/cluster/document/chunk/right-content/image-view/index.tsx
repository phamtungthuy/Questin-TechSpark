import { Box, Typography } from "@mui/material";
import knowledgebaseChunkApi from "api/admin/knowledgebase/knowledgebase-chunk-api";
import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EditImageModal from "./edit-image-modal";

interface TableProps {
    caption: string;
    content: string;
}

interface ImageProps {
    location: string;
    description: string;
    chunk_id: string;
}

interface ChunkProps {
    title: string;
    content: string;
    tables: Array<TableProps>;
    images: Array<ImageProps>;
    id: string;
}

interface ImageViewProps {
    selectedChunk: ChunkProps | undefined;
}

const ImageView: React.FC<ImageViewProps> = ({ selectedChunk }) => {
    const [images, setImages] = useState<Array<ImageProps>>([]);
    const [searchParams] = useSearchParams();
    const kb_id = searchParams.get("id");
    const [editImage, setEditImage] = useState<ImageProps | undefined>(undefined);
    const [openEditImageModal, setOpenEditImageModal] = useState(false); 
    const getImages = async () => {
        if (kb_id && selectedChunk) {
            const response = await knowledgebaseChunkApi.getImageList(kb_id, selectedChunk.id);
            if (response.status === 200) {
                setImages(response.data.data.images);
            }
        }
    };

    useEffect(() => {
        getImages();
    }, [selectedChunk]);

    return (
        <Box display="flex" flexDirection="column" flex="1" overflow="hidden">
            {editImage && <EditImageModal 
                open={openEditImageModal}
                onClose={() => setOpenEditImageModal(false)}
                image={editImage}
                setImage={setEditImage}
                update={getImages}
            />}
            <Box
                display="flex"
                gap="20px"
                marginBottom="8px"
                paddingX="24px"
            ></Box>
            <Box
                overflow="auto"
                display="flex"
                flexDirection="column"
                flex="1"
                paddingX="24px"
            >
                {images.map((image, index) => (
                    <Box
                        key={index}
                        display="flex"
                        flexDirection="column"
                        padding="10px"
                        border="1px solid #e0e0e0"
                        marginBottom="24px"
                        sx={{
                            cursor: "pointer",
                        }}
                        alignItems="center"
                        onDoubleClick={() => {
                            setEditImage(image);
                            setOpenEditImageModal(true);
                        }}
                    >
                        <Box
                            component="img"
                            marginBottom="10px"
                            sx={{
                                height: "auto",      // Giữ tỷ lệ hình ảnh
                                objectFit: "contain" // Đảm bảo nội dung ảnh được giữ trong box chứa
                            }}
                            src={`http://${process.env.REACT_APP_BACKEND_HOST}/api/knowledgebase/${kb_id}/image/${image["location"]}/`}
                        ></Box>
                        <Typography 
                        sx={{
                            "whiteSpace": "pre-line"
                        }}
                        >
                            {image["description"]}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default ImageView;
