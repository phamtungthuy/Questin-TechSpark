import { Skeleton } from "@mui/material";
import React from "react";
import { PdfHighlighter, PdfLoader } from "react-pdf-highlighter";

interface DocumentPreviewProps {
    url: string;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ url }) => {
    return (
        <PdfLoader
            url={url}
            beforeLoad={<Skeleton />}
            workerSrc="/pdfjs-dist/pdf.worker.min.js"
            onError={(e) => {
                console.warn(e);
            }}
        >
            {(pdfDocument) => {
                return (
                    <PdfHighlighter
                        pdfDocument={pdfDocument}
                        enableAreaSelection={(event) => event.altKey}
                        onScrollChange={() => {}}
                        scrollRef={() => {}}
                        onSelectionFinished={() => null}
                        highlightTransform={() => {
                            return <div></div>;
                        }}
                        highlights={[]}
                    />
                );
            }}
        </PdfLoader>
    );
};

export default DocumentPreview;
