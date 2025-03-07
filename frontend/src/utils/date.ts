import dayjs from "dayjs";

export function formatDate(date: any) {
    if (!date) {
      return '';
    }
    return dayjs(date).format('DD/MM/YYYY HH:mm:ss');
  }
  