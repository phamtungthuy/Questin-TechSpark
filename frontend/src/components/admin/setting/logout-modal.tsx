import BaseModal from "components/base-modal";
import { IModalManagerChildrenProps } from "components/modal-manager";
import authorizationUtil from "utils/authorization-util";
import React from "react";
import { useTranslate } from "hooks/common-hook";

interface IProps extends Omit<IModalManagerChildrenProps, 'showModal'> {
    acpFunc:(params?: any) => void;
}

const LogoutModal: React.FC<IProps> = ({ visible, hideModal, acpFunc }) => {
    const { t } = useTranslate("header");
    return (
        <BaseModal open={visible} title={t('logout')} onClose={hideModal} onOk={acpFunc}>
            <React.Fragment>
                <p>Thoát?</p>
            </React.Fragment>
        </BaseModal>
    );
};

export default LogoutModal;
