import os
from utils.file_utils import get_project_base_directory

class OCR(object):
    def __init__(self, model_dir=None):
        if not model_dir:
            try:
                model_dir = os.path.join(
                    get_project_base_directory(),
                    "services/res/deepdoc"
                )
            except Exception as e:
                model_dir