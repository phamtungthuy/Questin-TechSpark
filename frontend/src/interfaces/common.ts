export interface IModalProps {
    showModal?(): void;
    hideModal(): void;
    visible: boolean;
    loading?: boolean;
    // onOk?(payload?: T): Promise<any> | void;
}