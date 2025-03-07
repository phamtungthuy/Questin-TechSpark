import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import apiEndpoints from "utils/api"

const fetchProviders = async () => {
    const response = await axios.get("http://localhost:8000/api/v1/integration/providers");
    return response.data;
};

export const useFetchProviders = () => {
    return useQuery({
        queryKey: ["fetchProviders"],
        queryFn: fetchProviders,
        refetchOnWindowFocus: false,
    });
};
