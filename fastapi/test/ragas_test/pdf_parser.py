import re
import pymupdf
import logging
from io import BytesIO
class MetricParser(object):
    def starts_with_caption(self, text: str) -> bool:
        pattern = r'^(Bảng|Hình|Biểu đồ) \d+(\.\d+)*'
        return bool(re.match(pattern, text))

    def is_roman(self, s: str) -> bool:
        roman_pattern = "^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$"
        return re.match(roman_pattern, s.upper())

    def starts_with_section(self, text: str) -> bool:
        from copy import deepcopy
        text = deepcopy(text)
        text = text.lower()
        pattern = r'^(phần|chương)\s\d+'
        if bool(re.match(pattern, text.strip(), re.IGNORECASE)):
            return True
        text_split = text.strip().split(" ")
        first_text = text_split[0]
        if first_text.find(".") == -1:
            return False
        first_text_split = first_text.split(".")
        for sub_text in first_text_split:
            if sub_text == "":
                continue
            if not sub_text.isdigit() or (sub_text.isdigit() and (int(sub_text) > 15 or int(sub_text) == 0)):
                return False
        return True

    def __call__(self, filename, from_page=0, to_page=100000, **kwargs):

        lines = []
        try:
            if isinstance(filename, str):
                self.pdf = pymupdf.open(filename)
            else:
                self.pdf = pymupdf.open(stream=BytesIO(filename), filetype="pdf")

            tmp = []
            for i in range(from_page, min(to_page, self.pdf.page_count)):
                page = self.pdf.load_page(i)
                text = page.get_text()
                text_lines = text.split("\n")
                while text_lines and text_lines[0].strip() == "":
                    text_lines.pop(0)
                if self.is_roman(text_lines[0].strip()):
                    continue
                for text_line in text_lines:
                    text_line = text_line.strip()
                    if text_line == "":
                        continue
                    if self.starts_with_section(text_line) and len(tmp) > 2:
                        lines.append("\n".join(tmp))
                        tmp = []
                    tmp.append(text_line)                
            
            if len(tmp) > 0:
                lines.append("\n".join(tmp))
            
        except Exception as e:
            logging.warning(f"Outlines exception: {e}")
        
        return lines
    
    def crop(self, ck, need_position):
        raise NotImplemented
    
    @staticmethod
    def remove_tag(txt):
        raise NotImplementedError