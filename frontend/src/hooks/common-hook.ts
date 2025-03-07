import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export const useSetModalState = () => {
    const [visible, setVisible] = useState(false);

    const showModal = useCallback(() => {
        setVisible(true);
    }, []);

    const hideModal = useCallback(() => {
        setVisible(false);
    }, []);

    const switchVisible = useCallback(() => {
        setVisible((prev) => !prev);
    }, []);

    return { visible, showModal, hideModal, switchVisible };
};

export const useTranslate = (keyPrefix: string) => {
    return useTranslation("translation", { keyPrefix });
};

// Custom hook: useForm
const useForm = (initialValues: Record<string, any>) => {
    const [formValues, setFormValues] = useState(initialValues);

    // Cập nhật giá trị của một trường
    const setFieldValue = useCallback(
        (fieldName: string | string[], value: any) => {
            setFormValues((prev) => {
                if (Array.isArray(fieldName)) {
                    // Nếu là mảng, thực hiện cập nhật cho các field lồng nhau
                    const updateNestedField = (
                        obj: any,
                        keys: string[],
                        value: any
                    ): any => {
                        if (keys.length === 1) {
                            return { ...obj, [keys[0]]: value };
                        }
                        return {
                            ...obj,
                            [keys[0]]: updateNestedField(
                                obj[keys[0]] || {},
                                keys.slice(1),
                                value
                            ),
                        };
                    };
                    return updateNestedField(prev, fieldName, value);
                } else {
                    // Nếu là chuỗi, cập nhật trường bình thường
                    return { ...prev, [fieldName]: value };
                }
            });
        },
        []
    );

    const removeFieldValue = useCallback((fieldName: string | string[]) => {
        setFormValues((prev) => {
            if (Array.isArray(fieldName)) {
                const removeNestedField = (obj: any, keys: string[]): any => {
                    if (keys.length === 1) {
                        const { [keys[0]]: _, ...rest } = obj; // Loại bỏ trường cần xóa
                        return rest;
                    }
                    return {
                        ...obj,
                        [keys[0]]: removeNestedField(
                            obj[keys[0]] || {},
                            keys.slice(1)
                        ),
                    };
                };
                return removeNestedField(prev, fieldName);
            } else {
                const { [fieldName]: _, ...rest } = prev; // Loại bỏ trường cần xóa
                return rest;
            }
        });
    }, []);

    const setFieldsValue = useCallback((fields: Record<string, any>) => {
        setFormValues((prev) => ({
            ...prev,
            ...fields,
        }));
    }, []);

    // Lấy giá trị của một trường
    const getFieldValue = useCallback(
        (fieldName: string | string[]) => {
            if (Array.isArray(fieldName)) {
                return fieldName.reduce(
                    (acc, key) => (acc ? acc[key] : undefined),
                    formValues
                );
            }
            return formValues[fieldName];
        },
        [formValues]
    );

    // Reset toàn bộ form về giá trị ban đầu
    const resetForm = useCallback(() => {
        setFormValues(initialValues);
    }, [initialValues]);

    return {
        formValues,
        setFieldValue,
        getFieldValue,
        resetForm,
        removeFieldValue,
        setFieldsValue
    };
};

export default useForm;
