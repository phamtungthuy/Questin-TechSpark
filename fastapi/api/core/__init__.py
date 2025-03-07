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
    api_paths = [path for path in pages_dir.glob('*_api.py') if not path.name.startswith('.')]
    ws_paths = [path for path in pages_dir.glob('*_ws.py') if not path.name.startswith('.')]
    return api_paths + ws_paths

def register_page(page_path):
    path = f'{page_path}'

    if "_api" in path:
        suffix = "_api"
        url_prefix = f'/api/{API_VERSION}/'
    elif "_ws" in path:
        suffix = "_ws"
        url_prefix = f'/ws/{API_VERSION}/'
    else:
        # Nếu không có đuôi xác định, có thể gán giá trị mặc định
        suffix = ""
        url_prefix = f'/{API_VERSION}/'

    # Lấy tên trang bằng cách loại bỏ phần đuôi (ví dụ: chat_api -> chat, chat_ws -> chat)
    page_name = page_path.stem.rstrip(suffix)
    module_name = '.'.join(page_path.parts[page_path.parts.index('api'):-1] + (page_name,))

    # Import module
    spec = spec_from_file_location(module_name, page_path)
    page = module_from_spec(spec)
    page.router = APIRouter()  # Tạo một router mới cho module (hoặc bạn có thể dùng router chung nếu thích)
    page.app = app
    sys.modules[module_name] = page
    spec.loader.exec_module(page)

    # Nếu module có biến page_name thì lấy giá trị đó, nếu không thì dùng page_name vừa tạo
    page_name = getattr(page, 'page_name', page_name)
    url_prefix = url_prefix + page_name
    # Đăng ký router với app
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
