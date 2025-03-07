
import string
import math
 
import datrie
from pyvi import ViTokenizer

class RagTokenizer:
    def __init__(self, debug=False):
        self.DEBUG = debug
        self.DENOMINATOR = 1000000
        self.trie_ = datrie.Trie(string.printable)
    
    def key_(self, line):
        return str(line.lower().encode("utf-8"))[2:-1]
    
    def _strQ2B(self, ustring):
        """
        Convert full-width characters to half-width characters in a given string.

        Args:
            ustring (str): The input string containing full-width characters.

        Returns:
            str: A new string with full-width characters converted to half-width characters.
        """
        rstring = ""
        for uchar in ustring:
            inside_code = ord(uchar)
            if inside_code == 0x3000:
                inside_code = 0x0020
            else:
                inside_code -= 0xfee0
            if inside_code < 0x0020 or inside_code > 0x7e:
                rstring += uchar
            else:
                rstring += chr(inside_code)
        return rstring
    
    def tokenize(self, line):
        line = self._strQ2B(line).lower()
        return ViTokenizer.tokenize(line)        
    
    def fine_grained_tokenize(self, tks):
        tks = tks.split(" ")
        res = []
        for tk in tks:
            res.extend(tk.split("_"))
        return " ".join(res)
    
    def freq(self, tk):
        k = self.key_(tk)
        if k not in self.trie_:
            return 0
        return int(math.exp(self.trie_[k][0]) * self.DENOMINATOR + 0.5)
    
    def tag(self, tk):
        """
        Tags the given token using the trie data structure.

        Args:
            tk (str): The token to be tagged.

        Returns:
            str: The tag associated with the token if found, otherwise an empty string.
        """
        k = self.key_(tk)
        if k not in self.trie_:
            return ""
        return self.trie_[k][1]

tokenizer = RagTokenizer()
tokenize = tokenizer.tokenize
fine_grained_tokenize = tokenizer.fine_grained_tokenize
tag = tokenizer.tag
freq = tokenizer.freq