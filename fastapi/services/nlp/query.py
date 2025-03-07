import re

from elasticsearch_dsl import Q
from services.nlp import rag_tokenizer, term_weight

class ESQueryer:
    def __init__(self, es):
        self.es = es
        self.flds = ["ask_tks^10", "ask_small_tks"]
        self.tw = term_weight.Dealer()
        
    @staticmethod
    def rmWWW(txt):
        """
        Removes specific patterns of words and phrases from the input text.

        This function uses regular expressions to remove common question words 
        (e.g., "what", "who", "how") and auxiliary verbs or pronouns (e.g., "is", 
        "are", "you", "me") from the input text. The patterns are case-insensitive.

        Args:
            txt (str): The input text from which patterns will be removed.

        Returns:
            str: The text with specified patterns removed.
        """
        patts = [
            (r"(^| )(what|who|how|which|where|why)('re|'s)? ", " "),
            (r"(^| )('s|'re|is|are|were|was|do|does|did|don't|doesn't|didn't|has|have|be|there|you|me|your|my|mine|just|please|may|i|should|would|wouldn't|will|won't|done|go|for|with|so|the|a|an|by|i'm|it's|he's|she's|they|they're|you're|as|by|on|in|at|up|out|down|of) ", " ")
        ]
        for r, p in patts:
            txt = re.sub(r, p, txt, flags=re.IGNORECASE)
        return txt

    def question(self, txt, tbl="qa", min_match="60%"):
        txt =  re.sub(
            r"[ :\r\n\t,，。？?/`!！&\^%%]+",
            " ", txt.lower()).strip()
        txt = ESQueryer.rmWWW(txt)
        tks = rag_tokenizer.tokenize(txt).split(" ")
        tks_w = self.tw.weights(tks)
        tks_w = [(re.sub(r"[ \\\"'^]", "", tk), w) for tk, w in tks_w]
        tks_w = [(re.sub(r"^[a-z0-9]$", "", tk), w) for tk, w in tks_w if tk]
        tks_w = [(re.sub(r"^[\+-]", "", tk), w) for tk, w in tks_w if tk]
        q = ["{}^{:.4f}".format(tk, w) for tk, w in tks_w if tk]
        for i in range(1, len(tks_w)):
            q.append("\"%s %s\"^%.4f" % (tks_w[i - 1][0], tks_w[i][0], max(tks_w[i - 1][1], tks_w[i][1])*2))
        if not q:
            q.append(txt)
        return Q("bool",
                    must=Q("query_string", fields=self.flds,
                        type="best_fields", query=" ".join(q),
                        boost=0.3)#, minimum_should_match=min_match)
                    ), list(set([t for t in txt.split(" ") if t]))
        
    def hybrid_similarity(self, avec, bvecs, atks, btkss, tkweight=0.3,
                          vtweight=0.7):
        from sklearn.metrics.pairwise import cosine_similarity as CosineSimilarity
        import numpy as np
        sims = CosineSimilarity([avec], bvecs)
        tksim = self.token_similarity(atks, btkss)
        return np.array(sims[0]) * vtweight + \
            np.array(tksim) * tkweight, tksim, sims[0]

    def token_similarity(self, atks, btkss):
        def toDict(tks):
            d = {}
            if isinstance(tks, str):
                tks = tks.split(" ")
            for t, c in self.tw.weights(tks):
                if t not in d:
                    d[t] = 0
                d[t] += c
            return d

        atks = toDict(atks)
        btkss = [toDict(tks) for tks in btkss]
        return [self.similarity(atks, btks) for btks in btkss]

    def similarity(self, qtwt, dtwt):
        if isinstance(dtwt, type("")):
            dtwt = {t: w for t, w in self.tw.weights(self.tw.split(dtwt))}
        if isinstance(qtwt, type("")):
            qtwt = {t: w for t, w in self.tw.weights(self.tw.split(qtwt))}
        s = 1e-9
        for k, v in qtwt.items():
            if k in dtwt:
                s += v  # * dtwt[k]
        q = 1e-9
        for k, v in qtwt.items():
            q += v
        return s / q

if __name__ == "__main__":
    dealer = ESQueryer(None)
    
    print(dealer.question("Tôi muốn hỏi về dịch vụ gì là tốt nhất ở đây?"))