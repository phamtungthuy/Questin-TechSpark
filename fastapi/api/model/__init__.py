import sys
from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from api.settings import API_VERSION

app = FastAPI()

origins=['*']

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  
)


router = APIRouter()

def search_pages_path(pages_dir):
    api_path_list = [path for path in pages_dir.glob('*_api.py') if not path.name.startswith('.')]
    return api_path_list

def register_page(page_path):
    path = f'{page_path}'

    page_name = page_path.stem.rstrip('_api') if "_api" in path else page_path.stem.rstrip('_app')
    module_name = '.'.join(page_path.parts[page_path.parts.index('api'):-1] + (page_name,))

    spec = spec_from_file_location(module_name, page_path)
    page = module_from_spec(spec)
    page.router = router
    page.app = app
    sys.modules[module_name] = page
    spec.loader.exec_module(page)
    page_name = getattr(page, 'page_name', page_name)
    url_prefix = f'/{page_name}' if "_api" in path else f'/{API_VERSION}/{page_name}'

    app.include_router(page.router, prefix=url_prefix)
    return url_prefix

pages_dir = [
    Path(__file__).parent
]

client_urls_prefix = [
    register_page(path)
    for dir in pages_dir
    for path in search_pages_path(dir)
]
