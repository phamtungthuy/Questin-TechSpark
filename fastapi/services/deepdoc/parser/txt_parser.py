import re
from services.deepdoc.parser.utils import get_text
from services.service_utils import num_tokens_from_string

class QuestinTxtParser:
    def __call__(self, fnm, binary=None, chunk_token_num=256, delimiter="\n!?;。；！？"):
        txt = get_text(fnm, binary)
        return self.parser_txt(txt, chunk_token_num, delimiter)
    
    @classmethod
    def parser_txt(cls, txt, chunk_token_num=256, delimiter="\n!?;。；！？"):
        # if not isinstance(txt, str):
        #     raise TypeError("txt type should be str!")
        # cks = []
        # paragraphs = re.split(r'\n\s*\n\s*\n', txt.strip())
        # for ck in paragraphs:
        #     cks.append(ck)
            
        # return [[c, ""] for c in cks]
        if not isinstance(txt, str):
            raise TypeError("txt type should be str!")
        cks = [""]
        tk_nums = [0]

        def add_chunk(t):
            nonlocal cks, tk_nums, delimiter
            tnum = num_tokens_from_string(t)
            if tnum < 8:
                pos = ""
            if tk_nums[-1] > chunk_token_num:
                cks.append(t)
                tk_nums.append(tnum)
            else:
                cks[-1] += t
                tk_nums[-1] += tnum

        s, e = 0, 1
        while e < len(txt):
            if txt[e] in delimiter:
                add_chunk(txt[s: e + 1])
                s = e + 1
                e = s + 1
            else:
                e += 1
        if s < e:
            add_chunk(txt[s: e + 1])

        return [[c,""] for c in cks]