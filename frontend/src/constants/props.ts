export interface BasicModalProps {
    open: boolean;
    onClose: () => void;
}

export interface BaseModalProps extends BasicModalProps {
    onOk: (params?: any) => void;
    children: React.ReactElement;
}
