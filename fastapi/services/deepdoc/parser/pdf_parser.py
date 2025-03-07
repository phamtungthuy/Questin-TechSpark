import random
from timeit import default_timer as timer

import logging
from io import BytesIO
from pypdf import PdfReader as pdf2_read
import re
import pdfplumber
import pymupdf
import numpy as np

from services.deepdoc.vision import (
    OCR, Recognizer,
    LayoutRecognizer
)

class QuestinPdfParser:
    def __init__(self):
        self.ocr = OCR()
        if hasattr(self, "model_speciess"):
            self.layouter = LayoutRecognizer("layout." + self.model_speciess)
        else:
            self.layouter = LayoutRecognizer("layout")
        
    
    @staticmethod
    def total_page_number(fnm, binary=None):
        try:
            pdf = pdfplumber.open(
                fnm) if not binary else pdfplumber.open(BytesIO(binary))
            return len(pdf.pages)
        except Exception as e:
            logging.error(str(e))

    def __images__(self, fnm, zoomin=3, page_from=0,
                   page_to=299, callback=None):
        self.lefted_chars = []
        self.mean_height = []
        self.mean_width = []
        self.boxes = []
        self.garbages = {}
        self.page_cum_height = [0]
        self.page_layout = []
        self.page_from = page_from
        st = timer()
        try:
            self.pdf = pdfplumber.open(fnm) if isinstance(
                fnm, str) else pdfplumber.open(BytesIO(fnm))
            self.page_images = [p.to_image(resolution=72 * zoomin).annotated for i, p in
                                enumerate(self.pdf.pages[page_from:page_to])]
            self.page_images_x2 = [p.to_image(resolution=72 * zoomin * 2).annotated for i, p in
                                enumerate(self.pdf.pages[page_from:page_to])]
            self.page_chars = [[{**c, 'top': c['top'], 'bottom': c['bottom']} for c in page.dedupe_chars().chars if self._has_color(c)] for page in
                               self.pdf.pages[page_from:page_to]]
            self.total_page = len(self.pdf.pages)
        except Exception as e:
            logging.error(str(e))

        self.outlines = []
        try:
            self.pdf = pdf2_read(fnm if isinstance(fnm, str) else BytesIO(fnm))
            outlines = self.pdf.outline

            def dfs(arr, depth):
                for a in arr:
                    if isinstance(a, dict):
                        self.outlines.append((a["/Title"], depth))
                        continue
                    dfs(a, depth + 1)

            dfs(outlines, 0)
        except Exception as e:
            logging.warning(f"Outlines exception: {e}")
        if not self.outlines:
            logging.warning(f"Miss outlines")

        logging.info("Images converted.")
        self.is_english = [re.search(r"[a-zA-Z0-9,/¸;:'\[\]\(\)!@#$%^&*\"?<>._-]{30,}", "".join(
            random.choices([c["text"] for c in self.page_chars[i]], k=min(100, len(self.page_chars[i]))))) for i in
                           range(len(self.page_chars))]
        if sum([1 if e else 0 for e in self.is_english]) > len(
                self.page_images) / 2:
            self.is_english = True
        else:
            self.is_english = False

        st = timer()
        for i, img in enumerate(self.page_images_x2):
            chars = self.page_chars[i] if not self.is_english else []
            self.mean_height.append(
                np.median(sorted([c["height"] for c in chars])) if chars else 0
            )
            self.mean_width.append(
                np.median(sorted([c["width"] for c in chars])) if chars else 8
            )
            self.page_cum_height.append(img.size[1] / zoomin/2)
            j = 0
            while j + 1 < len(chars):
                if chars[j]["text"] and chars[j + 1]["text"] \
                        and re.match(r"[0-9a-zA-Z,.:;!%]+", chars[j]["text"] + chars[j + 1]["text"]) \
                        and chars[j + 1]["x0"] - chars[j]["x1"] >= min(chars[j + 1]["width"],
                                                                       chars[j]["width"]) / 2:
                    chars[j]["text"] += " "
                j += 1

            self.__ocr(i + 1, img, chars, zoomin*2)
            if callback and i % 6 == 5:
                callback(prog=(i + 1) * 0.6 / len(self.page_images), msg="")
        # print("OCR:", timer()-st)

        if not self.is_english and not any(
                [c for c in self.page_chars]) and self.boxes:
            bxes = [b for bxs in self.boxes for b in bxs]
            self.is_english = re.search(r"[\na-zA-Z0-9,/¸;:'\[\]\(\)!@#$%^&*\"?<>._-]{30,}",
                                        "".join([b["text"] for b in random.choices(bxes, k=min(30, len(bxes)))]))

        logging.info("Is it English:", self.is_english)

        self.page_cum_height = np.cumsum(self.page_cum_height)
        assert len(self.page_cum_height) == len(self.page_images) + 1
        if len(self.boxes) == 0 and zoomin < 9: self.__images__(fnm, zoomin * 3, page_from,
                                                                page_to, callback)


    def __call__(self, fnm, need_image=True, zoomin=3, return_html=False):
        pass    
    
class PlainParser(object):
    
    def __call__(self, filename, from_page=0, to_page=100000, **kwargs):
        self.outlines = []
        lines = []
        try:
            self.pdf = pdf2_read(
                filename if isinstance(
                    filename, str) else BytesIO(filename)
            )
            for page in self.pdf.pages[from_page:to_page]:
                lines.extend([t for t in page.extract_text().split("\n")])
                
            outlines = self.pdf.outline
            
            def dfs(arr, depth):
                for a in arr:
                    if isinstance(a, dict):
                        self.outlines.append((a["/Title"], depth))
                        continue
                    dfs(a, depth + 1)
            dfs(outlines, 0)
            
        except Exception as e:
            logging.warning(f"Outlines exception: {e}")
        if not self.outlines:
            logging.warning(f"Miss outlines")
        
        return [(l, "") for l in lines], []
    
    def crop(self, ck, need_position):
        raise NotImplemented
    
    @staticmethod
    def remove_tag(txt):
        raise NotImplementedError
    
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
        
        return [(l, "") for l in lines], []
    
    def crop(self, ck, need_position):
        raise NotImplemented
    
    @staticmethod
    def remove_tag(txt):
        raise NotImplementedError