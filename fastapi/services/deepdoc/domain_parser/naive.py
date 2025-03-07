import re
from timeit import default_timer as timer
from services.deepdoc.parser import (
    PdfParser, DocxParser, ExcelParser, HtmlParser,
    JsonParser, MarkdownParser, TxtParser,
)
from services.deepdoc.parser.pdf_parser import PlainParser, MetricParser
from services.nlp import (
    rag_tokenizer, tokenize_table,
    naive_merge, tokenize_chunks
)
from services.settings import cron_logger

class Docx(DocxParser):
    def __init__(self):
        pass
    
    def get_picture(self, document, paragraph):
        pass
    
    def __clen(self, line):
        line = re.sub(r"\u3000", " ", line).strip()
        return line
    
    def __call__(self, filename, binary=None, from_page=0, to_page=100000):
        pass
    
class Pdf(PdfParser):
    def __call__(self, filename, binary=None, from_page=0,
                 to_page=100000, zoomin=3, callback=None):
        start = timer()
        callback(msg="OCR is running...")
        callback(msg="OCR finished")
        
        
        

def chunk(filename, binary=None, from_page=0, to_page=100000,
          lang="Vietnamese", callback=None, **kwargs):
    eng = lang.lower() == "english"
    parser_config = kwargs.get(
        "parser_config", {
            "chunk_token_num": 128, "delimiter": "\n!?。；！？", "layout_recognize": True
        }
    )
    doc = {
        "docnm_kwd": filename,
        "title_tks": rag_tokenizer.tokenize(re.sub(r"\.[a-zA-Z]+$", "", filename)),
        "title_kwd": filename
    }
    doc["title_sm_tks"] = rag_tokenizer.fine_grained_tokenize(doc["title_tks"])
    res = []
    pdf_parser = None
    if re.search(r"\.docx$", filename, re.IGNORECASE):
        callback(0.1, "Start to parse.")
    elif re.search(r"\.pdf$", filename, re.IGNORECASE):
        pdf_parser = Pdf(
            ) if parser_config.get("layout_recognize", True) else PlainParser()
        pdf_parser = MetricParser()
        sections, tbls = pdf_parser(filename if not binary else binary,
                                    from_page=from_page, to_page=to_page, callback=callback)
        
    elif re.search(r"\.xlsx$", filename, re.IGNORECASE):
        callback(0.1, "Start to parse.")
        excel_parser = ExcelParser()
        if parser_config.get("html4excel"):
            sections = [(_, "") for _ in excel_parser.html(binary, 12) if _]
        else:
            sections = [(_, "") for _ in excel_parser(binary) if _]
    elif re.search(r"\.(txt|py|js|java|c|cpp|h|php|go|ts|sh|cs|kt|sql)$", filename, re.IGNORECASE):
        callback(0.1, "Start to parse.")
        txt_parser = TxtParser()
        sections = txt_parser(filename, binary,
                               parser_config.get("chunk_token_num", 256),
                               parser_config.get("delimiter", "\n!?;。；！？"))
        callback(0.8, "Finish parsing.")
    elif re.search(r"\.(md|markdown)$", filename, re.IGNORECASE):
        pass
    elif re.search(r"\.(htm|html)$", filename, re.IGNORECASE):
        pass
    elif re.search(r"\.json$", filename, re.IGNORECASE):
        pass
    elif re.search(r"\.doc$", filename, re.IGNORECASE):
        pass
    else:
        raise NotImplementedError(
            "file type not supported yet(pdf, xlsx, doc, docx, txt supported)"
        )
        
    st = timer()
    chunks = naive_merge(
        sections, int(parser_config.get(
            "chunk_token_num", 128)), parser_config.get("delimiter", "\n.;!?")
    )
    if kwargs.get("section_only", False):
        return chunks
    res.extend(tokenize_chunks(chunks, doc, eng, pdf_parser))
    cron_logger.info("naive_merge({}): {}".format(filename, timer() - st))
    return res