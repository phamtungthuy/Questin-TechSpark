import { Box, Dialog } from "@mui/material";
import React, { useState } from "react";
import Rating from "@mui/material/Rating";
import { styled } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
interface SurveyModalProps {
    open: boolean;
    onClose: () => void;
}

const StyledRating = styled(Rating)({
    "& .MuiRating-iconFilled": {
        color: "#ff6d75 ",
        borderColor: "#000000",
    },
    "& .MuiRating-iconHover": {
        color: "#ff3d47 ",
        borderColor: "#000000",
    },
    "& .MuiRating-label": {
        text: "black",
    },
});

const labels: { [index: string]: string } = {
    0.5: "Useless",
    1: "Useless+",
    1.5: "Poor",
    2: "Poor+",
    2.5: "Ok",
    3: "Ok+",
    3.5: "Good",
    4: "Good+",
    4.5: "Excellent",
    5: "Excellent+",
};

const SurveyModal: React.FC<SurveyModalProps> = ({ open, onClose }) => {
    const [value, setValue] = useState<number | null>(5);
    const [hover, setHover] = useState(-1);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
            fullWidth={true}
            maxWidth={"sm"}
        >
            <div className=" pb-4  sm:p-6  items-center justify-between bg-white border-b border-black">
                <div className="flex items-center justify-center text-center border-b border-black/10">
                    <h2 className="font-medium leading-6 text-black text-lg">
                        Ý kiến của bạn rất có giá trị với chúng tôi
                    </h2>
                </div>
                <div className="flex justify-center mt-5">
                    <StyledRating
                        name="customized-color"
                        defaultValue={5}
                        getLabelText={(value: number) =>
                            `${value} Star${value !== 1 ? "s" : ""}`
                        }
                        precision={0.5}
                        onChange={(event: React.ChangeEvent<{}>, newValue: number | null) => {
                            setValue(newValue);
                        }}
                        onChangeActive={(event: React.ChangeEvent<{}>, newHover) => {
                            setHover(newHover);
                        }}
                        icon={<FavoriteIcon fontSize="inherit" />}
                        emptyIcon={<FavoriteBorderIcon fontSize="inherit" />}
                    />
                </div>
                <div className="w-full text-center">
                    {value !== null && (
                        <Box sx={{ ml: 2, color: "black" }}>
                            {labels[hover !== -1 ? hover : value]}
                        </Box>
                    )}
                </div>

                <div className="mt-5 text-center italic font-medium">
                    <span className="text-black px-auto">
                        Cho chúng tôi biết những gì bạn chưa hài lòng với
                        Questin
                    </span>
                    <input
                        type="text"
                        className="mt-3 pl-3 border border-gray-400 w-full h-12 text-black"
                        autoFocus
                    />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row-reverse mt-5 sm:mt-4">
                    <button
                        type="button"
                        className="relative  focus:outline-none text-white  bg-blue-400 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 "
                        autoFocus
                        onClick={onClose}
                    >
                        Gửi
                    </button>
                    <button
                        type="button"
                        className="relative text-gray-900 bg-white border border-gray-300 focus:outline-none hover:bg-gray-100 focus:ring-4 focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
                        onClick={onClose}
                    >
                        Hủy
                    </button>
                </div>
            </div>
        </Dialog>
    );
};

export default SurveyModal;
