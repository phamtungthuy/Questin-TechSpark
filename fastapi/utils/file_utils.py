from db.constants import FileType

import re
import os
from io import BytesIO

from ruamel.yaml import YAML
import pdfplumber
from PIL import Image


PROJECT_BASE = os.getenv("RAG_PROJECT_BASE") or os.getenv("RAG_DEPLOY_BASE")
RAG_BASE = os.getenv("RAG_BASE")

def get_project_base_directory(*args) -> str:
    """
    Returns the base directory of the project. If additional arguments are provided,
    they are appended to the base directory path.

    Args:
        *args: Additional path components to append to the base directory.

    Returns:
        str: The absolute path to the base directory or the path with additional components.
    """
    global PROJECT_BASE
    if PROJECT_BASE is None:
        PROJECT_BASE = os.path.abspath(
            os.path.join(
                os.path.dirname(os.path.realpath(__file__)),
                os.pardir
            )
        )
    if args:
        return os.path.join(PROJECT_BASE, *args)
    return PROJECT_BASE

def load_yaml_conf(conf_path: str) -> str:
    """
    Load a YAML configuration file.

    This function loads a YAML configuration file from the specified path. If the 
    provided path is not absolute, it constructs an absolute path using the project's 
    base directory.

    Args:
        conf_path (str): The path to the YAML configuration file.

    Returns:
        dict: The contents of the YAML file as a dictionary.

    Raises:
        EnvironmentError: If there is an error loading the YAML file.
    """
    if not os.path.isabs(conf_path):
        conf_path = os.path.join(get_project_base_directory(), conf_path)
    try:
        with open(conf_path) as f:
            yaml = YAML(typ='safe', pure=True)
            return yaml.load(f)
    except Exception as e:
        raise EnvironmentError(
            "loading yaml file config from {} failed:".format(conf_path), e
        )
        
def filename_type(filename):
    filename = filename.lower()
    if re.match(r".*\.pdf$", filename):
        return FileType.PDF.value

    if re.match(
             r".*\.(eml|doc|docx|ppt|pptx|yml|xml|htm|json|csv|txt|ini|xls|xlsx|wps|rtf|hlp|pages|numbers|key|md|py|js|java|c|cpp|h|php|go|ts|sh|cs|kt|html|sql)$", filename):
        return FileType.DOC.value

    if re.match(
            r".*\.(wav|flac|ape|alac|wavpack|wv|mp3|aac|ogg|vorbis|opus|mp3)$", filename):
        return FileType.AURAL.value

    if re.match(r".*\.(jpg|jpeg|png|tif|gif|pcx|tga|exif|fpx|svg|psd|cdr|pcd|dxf|ufo|eps|ai|raw|WMF|webp|avif|apng|icon|ico|mpg|mpeg|avi|rm|rmvb|mov|wmv|asf|dat|asx|wvx|mpe|mpa|mp4)$", filename):
        return FileType.VISUAL.value

    return FileType.OTHER.value

def thumbnail_img(filename, blob):
    filename = filename.lower()
    if re.match(r".*\.pdf$", filename):
        pdf = pdfplumber.open(BytesIO(blob))
        buffered = BytesIO()
        pdf.pages[0].to_image(resolution=32).annotated.save(buffered, format="png")
        return buffered.getvalue()

    if re.match(r".*\.(jpg|jpeg|png|tif|gif|icon|ico|webp)$", filename):
        image = Image.open(BytesIO(blob))
        image.thumbnail((30, 30))
        buffered = BytesIO()
        image.save(buffered, format="png")
        return buffered.getvalue()

    if re.match(r".*\.(ppt|pptx)$", filename):
        import aspose.slides as slides
        import aspose.pydrawing as drawing
        try:
            with slides.Presentation(BytesIO(blob)) as presentation:
                buffered = BytesIO()
                presentation.slides[0].get_thumbnail(0.03, 0.03).save(
                    buffered, drawing.imaging.ImageFormat.png)
                return buffered.getvalue()
        except Exception as e:
            pass
    return None