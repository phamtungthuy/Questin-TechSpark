import { useTranslation } from 'react-i18next';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectProps } from '@mui/material/Select';

export default function LanguageSelect(props: SelectProps) {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onChange={(event) => i18n.changeLanguage(event.target.value as string)}
      SelectDisplayProps={{
        // @ts-ignore
        'data-screenshot': 'toggle-language',
      }}
      {...props}
    >
      <MenuItem value="en">English</MenuItem>
      <MenuItem value="vi">Tiếng Việt</MenuItem>
    </Select>
  );
}