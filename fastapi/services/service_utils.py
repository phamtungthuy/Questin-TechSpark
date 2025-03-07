import re
import tiktoken

encoder = tiktoken.encoding_for_model("gpt-3.5-turbo")

def rmSpace(txt):
    txt = re.sub(r"([^a-z0-9.,\)>]) +([^ ])", r"\1\2", txt, flags=re.IGNORECASE)
    return re.sub(r"([^ ]) +([^a-z0-9.,\(<])", r"\1\2", txt, flags=re.IGNORECASE)

def truncate(string: str, max_len: int) -> str:
    return encoder.decode(encoder.encode(string)[:max_len])

encoder = tiktoken.encoding_for_model("gpt-3.5-turbo")

def num_tokens_from_string(string: str) -> int:
    """Returns the number of tokens in a text string."""
    try:
        return len(encoder.encode(string))
    except Exception:
        return 0
